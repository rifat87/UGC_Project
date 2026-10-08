from pathlib import Path
import re
import sys

root = Path(sys.argv[1])

targets = [
    (
        root / "votechain-frontend-ts/src/components/Admin/RegisterVoter.tsx",
        re.compile(
            r"""fetch\(\s*
                apiUrl\(\s*
                (`/api/voters/train-face/\$\{formData\.nationalId\}`)
                \s*\)\s*,
            """,
            re.VERBOSE,
        ),
        r"adminFetch(\1,",
        "REGISTER_VOTER_TRAIN_FACE",
    ),
    (
        root / "votechain-frontend-ts/src/components/Biometric/face-recognition/FaceCapture.tsx",
        re.compile(
            r"""fetch\(\s*
                apiUrl\(\s*
                (["']/api/biometric/capture-face["'])
                \s*\)\s*,
            """,
            re.VERBOSE,
        ),
        r"adminFetch(\1,",
        "FACE_CAPTURE",
    ),
    (
        root / "votechain-frontend-ts/src/components/Biometric/fingerprint/FingerprintCapture.tsx",
        re.compile(
            r"""fetch\(\s*
                apiUrl\(\s*
                (["']/api/biometric/fingerprint/enroll["'])
                \s*\)\s*,
            """,
            re.VERBOSE,
        ),
        r"adminFetch(\1,",
        "FINGERPRINT_ENROLL",
    ),
]


def ensure_admin_import(text: str) -> str:
    if 'from "@/services/adminAuth"' in text:
        return text

    lines = text.splitlines(keepends=True)

    last_import_end = -1
    inside_import = False

    for index, line in enumerate(lines):
        stripped = line.strip()

        if stripped.startswith("import "):
            inside_import = True

        if inside_import:
            last_import_end = index

            if (
                stripped.endswith('"') or
                stripped.endswith('";') or
                stripped.endswith("'") or
                stripped.endswith("';")
            ):
                inside_import = False

    insertion = (
        'import {\n'
        '  adminFetch,\n'
        '} from "@/services/adminAuth"\n'
    )

    if last_import_end < 0:
        return insertion + "\\n" + text

    lines.insert(
        last_import_end + 1,
        insertion,
    )

    return "".join(lines)


def remove_unused_api_url_import(text: str) -> str:
    if "apiUrl(" in text:
        return text

    patterns = [
        re.compile(
            r'^import\\s*\\{\\s*apiUrl\\s*\\}\\s*from\\s*["\\\']@/config/api["\\\'];?\\s*\\n',
            re.MULTILINE,
        ),
        re.compile(
            r'^import\\s+\\{\\s*apiUrl,?\\s*\\}\\s+from\\s+["\\\']@/config/api["\\\'];?\\s*\\n',
            re.MULTILINE,
        ),
    ]

    for pattern in patterns:
        text = pattern.sub(
            "",
            text,
        )

    return text


for path, pattern, replacement, label in targets:
    text = path.read_text(
        encoding="utf-8",
    )

    if "adminFetch(" in text:
        direct = pattern.search(text)

        if not direct:
            print(
                f"{label}=ALREADY_PATCHED"
            )

            continue

    text, count = pattern.subn(
        replacement,
        text,
        count=1,
    )

    if count != 1:
        raise SystemExit(
            f"ERROR: {label}: expected exactly one direct privileged fetch; found {count}"
        )

    text = ensure_admin_import(
        text,
    )

    text = remove_unused_api_url_import(
        text,
    )

    path.write_text(
        text,
        encoding="utf-8",
    )

    print(
        f"{label}=PATCHED"
    )

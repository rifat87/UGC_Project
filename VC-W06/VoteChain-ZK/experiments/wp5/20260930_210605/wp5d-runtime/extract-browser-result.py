import base64
import html
import json
import re
import sys
from pathlib import Path

dom = Path(sys.argv[1]).read_text(
    encoding="utf-8",
    errors="replace",
)

match = re.search(
    r'data-wp5d-result="([^"]+)"',
    dom,
)

if not match:
    print("ERROR: data-wp5d-result missing")
    sys.exit(2)

encoded = html.unescape(
    match.group(1),
)

payload = base64.b64decode(
    encoded,
).decode("utf-8")

obj = json.loads(payload)

Path(sys.argv[2]).write_text(
    json.dumps(
        obj,
        indent=2,
    ) + "\n",
    encoding="utf-8",
)

print("BROWSER_RESULT_STATUS=" + str(obj.get("status")))

if obj.get("status") != "PASS":
    print("BROWSER_RESULT_ERROR=" + str(obj.get("error")))
    sys.exit(3)

print("BROWSER_WORKER_RUNTIME=PASS")
print(
    "BROWSER_AUTH_MS=" +
    str(obj.get("authMs"))
)
print(
    "BROWSER_PRIVACY_MS=" +
    str(obj.get("privacyMs"))
)
print(
    "BROWSER_TOTAL_MS=" +
    str(obj.get("totalMs"))
)
print(
    "CANDIDATE_PLAINTEXT_IN_BALLOT_OBJECT=" +
    str(
        obj.get(
            "candidatePlaintextInBallotObject"
        )
    ).upper()
)

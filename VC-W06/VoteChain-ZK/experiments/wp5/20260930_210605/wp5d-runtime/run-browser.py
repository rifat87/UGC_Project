import subprocess
import sys
from pathlib import Path

browser = sys.argv[1]
url = sys.argv[2]
dom_path = Path(sys.argv[3])
err_path = Path(sys.argv[4])
profile_path = sys.argv[5]

base = [
    browser,
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-extensions",
    "--disable-sync",
    f"--user-data-dir={profile_path}",
    "--dump-dom",
    url,
]

with dom_path.open("wb") as stdout, err_path.open("wb") as stderr:
    try:
        completed = subprocess.run(
            base,
            stdout=stdout,
            stderr=stderr,
            timeout=300,
            check=False,
        )
        rc = completed.returncode
    except subprocess.TimeoutExpired:
        print("BROWSER_TIMEOUT=YES")
        sys.exit(124)

print(f"BROWSER_RETURN_CODE={rc}")
sys.exit(rc)

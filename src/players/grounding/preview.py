"""Generate the PR-17 local preview from the proposed backend protocol."""
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import tempfile

parser = argparse.ArgumentParser()
parser.add_argument("--backend", required=True)
args = parser.parse_args()
backend = Path(args.backend).resolve()
source = subprocess.run(
    ["git", "show", "origin/feat/#114:data/protocols/PR-17.json"],
    cwd=backend, capture_output=True, check=True, encoding="utf-8",
).stdout
protocol = json.loads(source)
fixture = Path(__file__).resolve().parents[2] / "fixtures" / "run" / "PR-17.json"
data = json.loads(fixture.read_text(encoding="utf-8"))
data["content"]["content_spec"] = protocol["content_spec"]
data["content"]["guide_text"] = protocol["guide"]["intro_text"]
backup = Path(tempfile.mkdtemp(prefix="lumi-grounding-")) / "PR-17.json"
shutil.copy2(fixture, backup)
fixture.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("Updated PR-17: five senses, examples, no countdown, no background music")
print(f"Backup: {backup}")

"""Local fixture generator. Run with the sibling BE virtualenv; never print the key."""

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

parser = argparse.ArgumentParser()
parser.add_argument("--backend", required=True)
args = parser.parse_args()
backend = Path(args.backend).resolve()
sys.path.insert(0, str(backend))
os.chdir(backend)

import httpx  # noqa: E402

from app.config import get_settings  # noqa: E402

fixture = Path(__file__).resolve().parents[2] / "fixtures" / "run" / "PR-10.json"
if not fixture.is_file():
    raise SystemExit("PR-10 fixture not found")
key = get_settings().pixabay_api_key
if not key:
    raise SystemExit("PIXABAY_API_KEY is not set in the backend")
# Read the proposed protocol without changing the user's backend working branch.
source = subprocess.run(
    ["git", "show", "origin/feat/#108:data/protocols/PR-10.json"],
    cwd=backend, capture_output=True, check=True, encoding="utf-8",
).stdout
protocol = json.loads(source)
slot = next(s for s in protocol["content_spec"]["slots"] if s["slot"] == "VISUAL_VIDEO")
ids = [int(slot["selection"]["fixed_video_id"])]
asset = None
with httpx.Client(timeout=30) as client:
    for video_id in ids:
        try:
            response = client.get(
                "https://pixabay.com/api/videos/",
                params={"key": key, "id": str(video_id), "safesearch": "true"},
            )
            response.raise_for_status()
            hits = response.json().get("hits", [])
        except (httpx.HTTPError, ValueError):
            continue
        for hit in hits:
            duration = int(hit.get("duration") or 0)
            if hit.get("id") != video_id or duration < slot["selection"]["min_source_duration_seconds"]:
                continue
            versions = sorted(
                (v for v in hit.get("videos", {}).values() if isinstance(v, dict)),
                key=lambda v: v.get("width", 0) * v.get("height", 0),
            )
            video = next((
                v for v in versions if str(v.get("url", "")).startswith("https://")
                and v.get("width", 0) >= 1280 and v.get("height", 0) >= 720
            ), None)
            if video is None:
                continue
            asset = {
                "slot": "VISUAL_VIDEO", "url": video["url"], "provider": "PIXABAY",
                "title": f"Pixabay forest video {video_id}", "creator": hit.get("user"),
                "source_url": hit.get("pageURL"), "license": "Pixabay Content License",
                "generated": False, "verification": "PENDING_CONTENT_REVIEW",
                "metadata": {
                    "id": video_id, "source_duration_seconds": duration,
                    "loop_boundary_review": "PENDING",
                },
            }
            break
        if asset:
            break
if not asset:
    raise SystemExit("No candidate available. Fixture unchanged; check Pixabay API access.")
data = json.loads(fixture.read_text(encoding="utf-8"))
data["content"]["assets"] = [
    a for a in data["content"]["assets"] if a["slot"] != "VISUAL_VIDEO"
] + [asset]
data["content"]["content_spec"] = protocol["content_spec"]
data["content"]["asset_warnings"] = []
backup = Path(tempfile.mkdtemp(prefix="lumi-rest-")) / "PR-10.json"
shutil.copy2(fixture, backup)
fixture.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Updated PR-10: video {asset['metadata']['id']}, {asset['metadata']['source_duration_seconds']}s, loop to 20min")
print(f"Backup: {backup}")

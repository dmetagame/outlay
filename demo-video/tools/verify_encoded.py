"""Check encoded browser chapters against the intended source screenshots."""
from pathlib import Path
from PIL import Image, ImageChops, ImageStat
import io
import json
import subprocess

root = Path(__file__).resolve().parents[1]
timeline = json.loads((root / "src/timeline.json").read_text())
offset = 0
results = {}
for scene in timeline:
    offset += scene["durationInFrames"] / 30
    if scene["id"] in ["evidence", "outro"]:
        continue
    data = subprocess.check_output(["ffmpeg", "-v", "error", "-ss", str(offset - 0.5), "-i",
        str(root / "outlay-demo.mp4"), "-vf", "crop=1712:856:104:130", "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "-"])
    actual = Image.open(io.BytesIO(data)).convert("RGB")
    filename = "published-proof" if scene["id"] == "proof" else scene["id"]
    expected = Image.open(root / "public/screens" / f"{filename}.jpg").convert("RGB").resize(actual.size, Image.Resampling.LANCZOS)
    difference = sum(ImageStat.Stat(ImageChops.difference(actual, expected)).mean) / 3
    results[scene["id"]] = round(difference, 4)
    assert difference < 5, f"Encoded {scene['id']} holds an unexpected screen ({difference:.2f})"
    print(f"Encoded {scene['id']}: intended screen confirmed (mean difference {difference:.2f})", flush=True)
(root / "encoded-verification.json").write_text(json.dumps(results, indent=2) + "\n")

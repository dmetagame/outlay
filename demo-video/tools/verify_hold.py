"""Verify that each edited browser clip holds the intended captured end state."""
from pathlib import Path
from PIL import Image, ImageChops, ImageStat
import io
import json
import subprocess

root = Path(__file__).resolve().parents[1]
results = {}
for name in ["intro", "contract", "configure", "approve", "fund", "settle", "recurring"]:
    data = subprocess.check_output(["ffmpeg", "-v", "error", "-sseof", "-0.5", "-i",
        str(root / "public/footage" / f"{name}.mp4"), "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "-"])
    actual = Image.open(io.BytesIO(data)).convert("RGB")
    expected = Image.open(root / "public/screens" / f"{name}.jpg").convert("RGB")
    assert actual.size == expected.size
    difference = sum(ImageStat.Stat(ImageChops.difference(actual, expected)).mean) / 3
    results[name] = round(difference, 4)
    assert difference < 8, f"{name} ends on an unexpected screen ({difference:.2f})"
    print(f"{name}: final frame matches screenshot (mean pixel difference {difference:.2f})", flush=True)
(root / "hold-verification.json").write_text(json.dumps(results, indent=2) + "\n")

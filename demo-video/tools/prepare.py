"""Cut browser footage to scene length, and export matching portable subtitles."""
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
scenes = json.loads((ROOT / "src/timeline.json").read_text())
manifest = {"clips": []} if "--subtitles-only" in sys.argv else json.loads((ROOT / "public/raw/manifest.json").read_text())
clips = {clip["id"]: clip for clip in manifest["clips"]}
(ROOT / "public/footage").mkdir(exist_ok=True)

for scene in scenes:
    if "--subtitles-only" in sys.argv:
        break
    if scene["id"] not in clips or scene["id"] in ["proof", "outro"]:
        continue
    clip = clips[scene["id"]]
    duration = scene["durationInFrames"] / 30
    # Preserve normal interaction speed, then hold the final frame for narration.
    # Capture/video clocks can differ by a fraction of a second. Every recorded
    # action ends with a deliberate hold; trim its final two seconds to exclude
    # the following chapter before cloning the intended end state.
    captured_duration = max(0.2, clip["duration"] - 2.0)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(clip["from"]), "-t", str(captured_duration),
                    "-i", manifest["raw"], "-vf", f"fps=30,tpad=stop_mode=clone:stop_duration={duration}",
                    "-t", str(duration), "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "20",
                    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                    str(ROOT / "public/footage" / f"{scene['id']}.mp4")], check=True)
    print(f"Prepared {scene['id']} ({duration:.2f}s)", flush=True)

def stamp(ms):
    value = round(ms)
    return f"{value // 3600000:02}:{value // 60000 % 60:02}:{value // 1000 % 60:02},{value % 1000:03}"

offset = 0
subtitles = []
for scene in scenes:
    words = scene["captions"]
    for start in range(0, len(words), 10):
        group = words[start:start + 10]
        subtitles.append(f"{len(subtitles) + 1}\n{stamp(offset + 350 + group[0]['startMs'])} --> {stamp(offset + 350 + group[-1]['endMs'])}\n{''.join(w['text'] for w in group).strip()}\n")
    offset += scene["durationInFrames"] / 30 * 1000
(ROOT / "outlay-demo.srt").write_text("\n".join(subtitles))
(ROOT / "transcript.txt").write_text("\n\n".join(scene["chapter"] + "\n" + scene["text"] for scene in scenes) + "\n")
print(f"Total runtime: {offset / 1000:.2f}s", flush=True)

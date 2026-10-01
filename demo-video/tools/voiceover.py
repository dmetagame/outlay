"""Generate narration and exact speech-boundary captions without reading environment files."""
import asyncio
import json
import math
import re
from pathlib import Path
import subprocess
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
VOICE = "en-GB-RyanNeural"
FPS = 30
PACE = 1.12


async def generate(scene):
    audio = ROOT / "public" / "voice" / f"{scene['id']}.mp3"
    audio.parent.mkdir(parents=True, exist_ok=True)
    words = []
    speech = edge_tts.Communicate(scene["text"], VOICE, rate="+4%", boundary="WordBoundary")
    with audio.open("wb") as output:
        async for chunk in speech.stream():
            if chunk["type"] == "audio":
                output.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 10000
                words.append({"text": " " + chunk["text"], "startMs": start,
                              "endMs": start + chunk["duration"] / 10000,
                              "timestampMs": start, "confidence": None})
    normalized = audio.with_suffix(".normalized.mp3")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(audio), "-af",
                    f"atempo={PACE},loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000",
                    "-b:a", "128k", str(normalized)], check=True)
    normalized.replace(audio)
    for word in words:
        for key in ["startMs", "endMs", "timestampMs"]:
            word[key] /= PACE
    cursor = 0
    for word in words:
        match = re.search(re.escape(word["text"].strip()), scene["text"][cursor:], re.IGNORECASE)
        if match:
            cursor += match.end()
            punctuation = re.match(r"[.,;:!?]+", scene["text"][cursor:])
            if punctuation:
                word["text"] += punctuation.group()
    duration = float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(audio)
    ], text=True).strip())
    result = {**scene, "audioDuration": duration, "durationInFrames": math.ceil((duration + 1.1) * FPS),
              "captions": words}
    print(f"{scene['id']}: {duration:.2f}s, {len(words)} caption tokens", flush=True)
    return result


async def main():
    # Serial generation keeps service load low and produces small recoverable assets.
    scenes = []
    for scene in json.loads((ROOT / "script.json").read_text()):
        scenes.append(await generate(scene))
    (ROOT / "src" / "timeline.json").write_text(json.dumps(scenes, indent=2) + "\n")
    offset = 0
    subtitles = []
    def timestamp(ms):
        value = round(ms)
        return f"{value // 3600000:02}:{value // 60000 % 60:02}:{value // 1000 % 60:02},{value % 1000:03}"
    for scene in scenes:
        words = scene["captions"]
        for start in range(0, len(words), 10):
            group = words[start:start + 10]
            subtitles.append(f"{len(subtitles) + 1}\n{timestamp(offset + 350 + group[0]['startMs'])} --> {timestamp(offset + 350 + group[-1]['endMs'])}\n{''.join(w['text'] for w in group).strip()}\n")
        offset += scene["durationInFrames"] / FPS * 1000
    (ROOT / "outlay-demo.srt").write_text("\n".join(subtitles))
    print(f"Total: {offset / 1000:.2f}s", flush=True)


asyncio.run(main())

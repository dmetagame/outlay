import {execFileSync} from "node:child_process";
import {readFile, writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import path from "node:path";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const input = path.resolve(process.argv[2] || path.join(root, "out/raw.mp4"));
const output = path.join(root, "outlay-demo.mp4");
const timeline = JSON.parse(await readFile(path.join(root, "src/timeline.json"), "utf8"));
const expectedFrames = timeline.reduce((frames, scene) => frames + scene.durationInFrames, 0);
assert.notEqual(input, output, "Finalize needs a separate input file");
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", input, "-c", "copy", "-movflags", "+faststart",
  "-metadata", "title=Outlay — scheduled USDG settlement demo", "-metadata",
  "comment=Reconstructed wallet walkthrough followed by published onchain payment evidence.", output]);
const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", output], {encoding: "utf8"}));
const video = probe.streams.find(stream => stream.codec_type === "video");
const audio = probe.streams.find(stream => stream.codec_type === "audio");
assert.equal(video.codec_name, "h264");
assert.equal(video.width, 1920); assert.equal(video.height, 1080);
assert.equal(video.r_frame_rate, "30/1"); assert.equal(Number(video.nb_frames), expectedFrames);
assert.equal(audio.codec_name, "aac"); assert.equal(audio.sample_rate, "48000");
assert(Math.abs(Number(probe.format.duration) - expectedFrames / 30) < 0.05);
execFileSync("ffmpeg", ["-v", "error", "-i", output, "-f", "null", "/dev/null"]);
const bytes = await readFile(output);
const atoms = [];
for (let offset = 0; offset + 8 <= bytes.length;) {
  const size = bytes.readUInt32BE(offset);
  atoms.push({type: bytes.toString("ascii", offset + 4, offset + 8), offset});
  if (!size) break;
  offset += size;
}
assert(atoms.find(atom => atom.type === "moov").offset < atoms.find(atom => atom.type === "mdat").offset);
const report = {verifiedAt: new Date().toISOString(), fullDecode: "pass", fastStart: true,
  width: video.width, height: video.height, fps: 30, frames: Number(video.nb_frames), videoCodec: video.codec_name,
  audioCodec: audio.codec_name, audioSampleRate: Number(audio.sample_rate), audioChannels: audio.channels,
  durationSeconds: Number(probe.format.duration), sizeBytes: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  renderSourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {cwd: path.join(root, ".."), encoding: "utf8"}).trim()};
await writeFile(path.join(root, "media-verification.json"), JSON.stringify(report, null, 2) + "\n");
console.log(`Finalized: 1080p/30 H.264 + AAC, ${expectedFrames} frames, fast start, full decode passed.`);

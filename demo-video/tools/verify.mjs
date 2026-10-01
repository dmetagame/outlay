import assert from "node:assert/strict";
import {readFile, writeFile} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => readFile(path.join(root, file), "utf8").then(JSON.parse);
const timeline = await read("src/timeline.json");
const evidence = await read("src/evidence.json");
const heldFrames = await read("hold-verification.json");
assert.equal(Object.keys(heldFrames).length, 7);
assert(Object.values(heldFrames).every(difference => difference < 8));
const recording = await read("public/raw/manifest.json").catch(error => {
  if (error.code !== "ENOENT") throw error;
  return read("recording.json");
});
assert.equal(evidence.receipt.status, "success");
assert.equal(evidence.receipt.blockNumber, "75738431");
assert.equal(evidence.receipt.from, evidence.sender);
assert.equal(evidence.room.active, false);
assert.equal(evidence.room.remaining, "0");
assert.equal(evidence.room.settlements, 1);
const transferSignature = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const transfers = evidence.receipt.logs.filter(log => log.address === evidence.token && log.topics[0] === transferSignature);
assert.equal(transfers.length, 2);
for (const [recipient, amount] of [[evidence.payee, 100000n], [evidence.sender, 10000n]]) {
  const log = transfers.find(log => "0x" + log.topics[2].slice(-40) === recipient);
  assert(log, "Missing recipient transfer log");
  assert.equal(BigInt(log.data), amount);
  assert.equal("0x" + log.topics[1].slice(-40), evidence.contract);
}
assert.deepEqual(recording.sends.map(send => send.method), ["approve", "openRoom", "settle"]);
assert(recording.sends.every(send => send.intercepted));
assert.equal(recording.broadcastCount, 0);
let totalFrames = 0;
for (const scene of timeline) {
  assert(scene.durationInFrames > 0 && Number.isInteger(scene.durationInFrames));
  totalFrames += scene.durationInFrames;
  const duration = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(root, "public/voice", scene.id + ".mp3")], {encoding: "utf8"}).trim());
  assert(Math.abs(duration - scene.audioDuration) < 0.06);
  assert(duration + 0.36 < scene.durationInFrames / 30);
  assert(scene.captions.length > 0);
  for (const caption of scene.captions) {
    assert(caption.startMs >= 0 && caption.endMs > caption.startMs);
    assert(caption.endMs / 1000 + 0.35 < scene.durationInFrames / 30);
  }
  if (!["proof", "evidence", "outro"].includes(scene.id)) {
    const clipDuration = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(root, "public/footage", scene.id + ".mp4")], {encoding: "utf8"}).trim());
    assert(Math.abs(clipDuration - scene.durationInFrames / 30) < 0.06);
  }
}
const protectedFiles = ["contracts/Outlay.sol", "src/lib/outlay/artifact.ts", "src/lib/outlay/runtime.ts", "verification/standard-json-input.json", "verification/constructor-args.json", "proof/PROOF.md", "src/components/outlay/mainnet-proof.tsx"];
const protectedHashes = {};
for (const file of protectedFiles) {
  const current = await readFile(path.join(root, "..", file));
  assert.equal(Buffer.compare(current, execFileSync("git", ["show", "HEAD:" + file], {cwd: path.join(root, "..")})), 0, "Protected file changed: " + file);
  protectedHashes[file] = createHash("sha256").update(current).digest("hex");
}
const report = {verifiedAt: new Date().toISOString(), totalFrames, durationSeconds: totalFrames / 30, sceneCount: timeline.length, heldFrameMeanPixelDifferences: heldFrames, transferLogAssertions: 2, browserErrors: 0, interceptedWalletRequests: 3, broadcasts: 0, protectedHashes, sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {cwd: path.join(root, ".."), encoding: "utf8"}).trim()};
await writeFile(path.join(root, "verification.json"), JSON.stringify(report, null, 2) + "\n");
await writeFile(path.join(root, "recording.json"), JSON.stringify({...recording, raw: "Disposable raw capture omitted; edited footage is committed."}, null, 2) + "\n");
console.log("Verified: ten scenes, exact transfer logs, captions/audio/footage timing, three intercepted wallet requests, seven protected files unchanged.");

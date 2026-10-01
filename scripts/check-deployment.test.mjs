import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkLocal, checkPublished } from "./check-deployment.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "contracts/Outlay.sol", "verification/standard-json-input.json", "verification/constructor-args.json",
  "src/lib/outlay/artifact.ts", "src/lib/outlay/runtime.ts",
];

async function changedFixture(t, file, change) {
  const fixture = await mkdtemp(path.join(tmpdir(), "outlay-verifier-test-"));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  for (const name of files) {
    const destination = path.join(fixture, name);
    await mkdir(path.dirname(destination), { recursive: true });
    const content = await readFile(path.join(root, name), "utf8");
    await writeFile(destination, name === file ? change(content) : content);
  }
  return fixture;
}

test("fresh compilation agrees with the released artifacts", async () => {
  const build = await checkLocal();
  assert.equal(build.compiler, "0.8.37+commit.f401782d");
  assert.equal((build.runtime.length - 2) / 2, 4113);
});

test("rejects canonical source that differs from the verification input", async (t) => {
  const fixture = await changedFixture(t, "contracts/Outlay.sol", (text) => text + "\n// drift\n");
  await assert.rejects(checkLocal({ root: fixture }), /verification source differs/);
});

test("rejects different optimization settings", async (t) => {
  const fixture = await changedFixture(t, "verification/standard-json-input.json", (text) => {
    const input = JSON.parse(text);
    input.settings.optimizer.runs = 201;
    return JSON.stringify(input);
  });
  await assert.rejects(checkLocal({ root: fixture }));
});

test("rejects a lookalike token constructor", async (t) => {
  const fixture = await changedFixture(t, "verification/constructor-args.json", (text) => {
    const constructors = JSON.parse(text);
    constructors[4663] = "0".repeat(64);
    return JSON.stringify(constructors);
  });
  await assert.rejects(checkLocal({ root: fixture }), /chain 4663 constructor differs/);
});

test("rejects an artifact with an injected admin function", async (t) => {
  const fixture = await changedFixture(t, "src/lib/outlay/artifact.ts", (text) => {
    const match = text.match(/export const outlayAbi = ([\s\S]*?) as const;/);
    const abi = JSON.parse(match[1]);
    abi.push({ type: "function", name: "sweep", inputs: [], outputs: [], stateMutability: "nonpayable" });
    return text.replace(match[1], JSON.stringify(abi));
  });
  await assert.rejects(checkLocal({ root: fixture }), /ABI differs/);
});

test("rejects changed creation bytecode", async (t) => {
  const fixture = await changedFixture(t, "src/lib/outlay/artifact.ts", (text) =>
    text.replace(/(export const outlayBytecode = "(?:0x)+)[0-9a-f]{2}/, "$100"));
  await assert.rejects(checkLocal({ root: fixture }), /creation artifact differs/);
});

test("rejects a changed pinned runtime", async (t) => {
  const fixture = await changedFixture(t, "src/lib/outlay/runtime.ts", (text) =>
    text.replace(/(const ROBINHOOD_OUTLAY_RUNTIME = "0x)[0-9a-f]{2}/, "$100"));
  await assert.rejects(checkLocal({ root: fixture }), /pinned runtime differs/);
});

test("rejects a compiler other than the exact released version", async () => {
  await assert.rejects(checkLocal({ solc: "/missing-outlay-solc" }), /Solc 0.8.37/);
});

test("rejects RPC URLs with embedded credentials before making a request", async () => {
  await assert.rejects(checkPublished({}, { rpcUrl: "https://user:password@example.com" }),
    /without embedded credentials/);
});

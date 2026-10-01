import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { closeSync, openSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  createPublicClient, decodeEventLog, encodeAbiParameters, http, keccak256, parseAbi,
} from "viem";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMPILER = "0.8.37+commit.f401782d";
const TOKENS = {
  4663: "0x5fc5360d0400a0fd4f2af552add042d716f1d168",
  42161: "0x004b506865409877c9fa29bfb1eba929984b9bbc",
  421614: "0xffc95faa3d63cde504a05b567c600b78c0b41892",
};
const CONTRACT = "0xe1b5d2cf63c43103455abd802b6b241b959a530c";
const SENDER = "0xee3ea6f858ae84dd6959f241dfc257a2f8fa3f53";
const PAYEE = "0x4157e84fa929f797cc244d28fd9d48b4c6d43df0";
const TRANSACTIONS = {
  deploy: "0xc0cd9fcba279c431dec9756b865994c127a3727fc2aedd77b400a7cfcef5e432",
  open: "0xfb921ebeccb21e342e4dee63f518da14ca721f9d1ecf94b46cb84c9d902e4633",
  settle: "0x8463c5c7a56df5781d443981558f3149f8199740b6aeb6569f8a60059c8cdb12",
};
const tokenAbi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);
const normalizeHex = (value) => `0x${value.replace(/^(?:0x)+/, "").toLowerCase()}`;
const sameAddress = (actual, expected) => assert.equal(actual?.toLowerCase(), expected);
function sortedKeys(value) {
  if (Array.isArray(value)) return value.map(sortedKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortedKeys(value[key])]));
  }
  return value;
}
const canonicalAbi = (abi) => abi.map((entry) => JSON.stringify(sortedKeys(entry))).sort();

function compilerPath(requested) {
  const candidates = requested ? [requested] : [
    path.join(homedir(), ".local/share/svm/0.8.37/solc-0.8.37"),
    path.join(homedir(), ".svm/0.8.37/solc-0.8.37"),
    "solc",
  ];
  for (const candidate of candidates) {
    const result = spawnSync(candidate, ["--version"], { encoding: "utf8" });
    if (result.status === 0 && result.stdout.includes(`Version: ${COMPILER}`)) return candidate;
  }
  throw new Error(`Solc ${COMPILER} is required; install it with Foundry or pass --solc PATH.`);
}

// Compiles the committed verification input in memory; never regenerates protected files.
export async function checkLocal({ root = ROOT, solc } = {}) {
  const read = (name) => readFile(path.join(root, name), "utf8");
  const [source, inputText, artifact, constructorsText, runtimeSource] = await Promise.all([
    read("contracts/Outlay.sol"), read("verification/standard-json-input.json"),
    read("src/lib/outlay/artifact.ts"), read("verification/constructor-args.json"),
    read("src/lib/outlay/runtime.ts"),
  ]);
  const input = JSON.parse(inputText);
  assert.deepEqual(Object.keys(input.sources), ["contracts/Outlay.sol"], "unexpected verification sources");
  assert.equal(input.sources["contracts/Outlay.sol"].content, source, "verification source differs");
  assert.deepEqual(input.settings.optimizer, { enabled: true, runs: 200 });
  assert.equal(input.settings.evmVersion, "cancun");
  assert.equal(input.settings.viaIR, false);
  // Solc reads stdin to EOF; a regular file avoids a Node socket-stdin hang.
  const inputFd = openSync(path.join(root, "verification/standard-json-input.json"), "r");
  let compiled;
  try {
    compiled = spawnSync(compilerPath(solc), ["--standard-json"], {
      stdio: [inputFd, "pipe", "pipe"], encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
      timeout: 30_000,
    });
  } finally {
    closeSync(inputFd);
  }
  assert.equal(compiled.status, 0, "Solc invocation failed");
  const output = JSON.parse(compiled.stdout);
  assert.equal((output.errors ?? []).filter((entry) => entry.severity === "error").length, 0,
    "verification input does not compile");
  const build = output.contracts["contracts/Outlay.sol"].Outlay;
  assert.equal(JSON.parse(build.metadata).compiler.version, COMPILER);
  const abiMatch = artifact.match(/export const outlayAbi = ([\s\S]*?) as const;/);
  const bytecodeMatch = artifact.match(/export const outlayBytecode = "([^"]+)"/);
  const runtimeMatch = runtimeSource.match(/const ROBINHOOD_OUTLAY_RUNTIME = "([^"]+)"/);
  assert(abiMatch && bytecodeMatch && runtimeMatch, "committed artifact/runtime format changed");
  assert.deepEqual(canonicalAbi(JSON.parse(abiMatch[1])), canonicalAbi(build.abi), "ABI differs");
  const functions = build.abi.filter((entry) => entry.type === "function");
  assert.deepEqual(functions.map((entry) => entry.name).sort(),
    ["costOf", "getRoom", "openRoom", "refund", "roomCount", "rooms", "settle", "usdg"].sort(),
    "unexpected public/admin function");
  assert.deepEqual(functions.filter((entry) => entry.stateMutability === "nonpayable")
    .map((entry) => entry.name).sort(), ["openRoom", "refund", "settle"], "unexpected mutation surface");
  assert(!build.abi.some((entry) => ["fallback", "receive"].includes(entry.type)), "unexpected fallback");
  const creation = normalizeHex(build.evm.bytecode.object);
  assert.equal(normalizeHex(bytecodeMatch[1]), creation, "creation artifact differs");
  const constructors = JSON.parse(constructorsText);
  assert.deepEqual(Object.keys(constructors).sort(), Object.keys(TOKENS).sort());
  for (const [chainId, token] of Object.entries(TOKENS)) {
    assert.equal(constructors[chainId], encodeAbiParameters([{ type: "address" }], [token]).slice(2),
      `chain ${chainId} constructor differs`);
  }
  let runtime = build.evm.deployedBytecode.object;
  const references = Object.values(build.evm.deployedBytecode.immutableReferences).flat();
  assert.equal(references.length, 2, "unexpected immutable references");
  for (const { start, length } of references) {
    assert.equal(length, 32);
    runtime = runtime.slice(0, start * 2) + constructors[4663] + runtime.slice((start + length) * 2);
  }
  runtime = normalizeHex(runtime);
  assert.equal(runtime, runtimeMatch[1].toLowerCase(), "pinned runtime differs from fresh compilation");
  assert.equal(keccak256(runtime), "0x85a19056971ff2d270e7a32ee7ac27a47eb5969331914e6dd46f67206b732ee9");
  return { abi: build.abi, runtime, deployInput: creation + constructors[4663], compiler: COMPILER };
}

// Only a public client is constructed: no wallet, signer, dotenv, or send-RPC path.
export async function checkPublished(build, {
  rpcUrl = "https://rpc.mainnet.chain.robinhood.com", blockNumber,
} = {}) {
  const url = new URL(rpcUrl);
  assert(["https:", "http:"].includes(url.protocol) && !url.username && !url.password && !url.search,
    "use an HTTP RPC without embedded credentials");
  const client = createPublicClient({ transport: http(rpcUrl, { timeout: 20_000, retryCount: 1 }) });
  assert.equal(await client.getChainId(), 4663, "RPC is not Robinhood chain 4663");
  const snapshot = blockNumber ?? await client.getBlockNumber();
  const block = await client.getBlock({ blockNumber: snapshot });
  const read = (address, abi, functionName, args = []) => client.readContract({
    address, abi, functionName, args, blockNumber: snapshot,
  });
  const [code, token, count, room, balance, decimals] = await Promise.all([
    client.getCode({ address: CONTRACT, blockNumber: snapshot }),
    read(CONTRACT, build.abi, "usdg"), read(CONTRACT, build.abi, "roomCount"),
    read(CONTRACT, build.abi, "getRoom", [1n]), read(TOKENS[4663], tokenAbi, "balanceOf", [CONTRACT]),
    read(TOKENS[4663], tokenAbi, "decimals"),
  ]);
  assert.equal(code?.toLowerCase(), build.runtime, "published runtime differs");
  sameAddress(token, TOKENS[4663]);
  assert.equal(count, 1n, "published room count changed");
  sameAddress(room.sender, SENDER);
  sameAddress(room.payee, PAYEE);
  assert.deepEqual([room.amount, room.bounty, room.remaining, room.nextRunAt,
    room.interval, room.settlements, room.active], [100_000n, 10_000n, 0n, 1790693157n, 0, 1, false],
  "published proof room changed");
  assert.equal(balance, 0n, "published contract has unexpected backing");
  assert.equal(decimals, 6);
  const evidence = {};
  for (const [name, hash] of Object.entries(TRANSACTIONS)) {
    const [transaction, receipt] = await Promise.all([
      client.getTransaction({ hash }), client.getTransactionReceipt({ hash }),
    ]);
    assert.equal(receipt.status, "success", `${name} receipt failed`);
    assert(receipt.blockNumber <= snapshot, `${name} is later than snapshot`);
    sameAddress(transaction.from, SENDER);
    assert.equal(transaction.blockHash, receipt.blockHash);
    assert.equal(transaction.blockNumber, receipt.blockNumber);
    evidence[name] = { transaction, receipt };
  }
  sameAddress(evidence.deploy.receipt.contractAddress, CONTRACT);
  assert.equal(evidence.deploy.transaction.to, null);
  assert.equal(evidence.deploy.transaction.input.toLowerCase(), build.deployInput, "deployment input differs");
  for (const name of ["open", "settle"]) sameAddress(evidence[name].transaction.to, CONTRACT);
  const transferTopic = keccak256(new TextEncoder().encode("Transfer(address,address,uint256)"));
  const transfers = (receipt) => receipt.logs.filter((log) => log.address.toLowerCase() === TOKENS[4663]
    && log.topics[0] === transferTopic)
    .map((log) => {
      const decoded = decodeEventLog({ abi: tokenAbi, ...log });
      assert.equal(decoded.eventName, "Transfer");
      return [decoded.args.from.toLowerCase(), decoded.args.to.toLowerCase(), decoded.args.value];
    });
  assert.deepEqual(transfers(evidence.open.receipt), [[SENDER, CONTRACT, 110_000n]]);
  assert.deepEqual(transfers(evidence.settle.receipt), [[CONTRACT, PAYEE, 100_000n], [CONTRACT, SENDER, 10_000n]]);
  const event = (name, expected) => {
    const logs = evidence[name].receipt.logs.filter((log) => log.address.toLowerCase() === CONTRACT);
    assert.equal(logs.length, 1, `${name} Outlay event count differs`);
    const decoded = decodeEventLog({ abi: build.abi, ...logs[0] });
    assert.equal(decoded.eventName, expected);
    for (const field of ["sender", "payee", "settler"]) {
      if (decoded.args[field]) decoded.args[field] = decoded.args[field].toLowerCase();
    }
    return decoded.args;
  };
  assert.deepEqual(event("open", "RoomOpened"), {
    id: 1n, sender: SENDER, payee: PAYEE, amount: 100_000n,
    bounty: 10_000n, funded: 110_000n, nextRunAt: 1790693157n, interval: 0,
  });
  assert.deepEqual(event("settle", "Settled"), {
    id: 1n, payee: PAYEE, settler: SENDER, amount: 100_000n,
    bounty: 10_000n, nextRunAt: 0n, stillActive: false,
  });
  const settlementBlock = await client.getBlock({ blockHash: evidence.settle.receipt.blockHash });
  assert(settlementBlock.timestamp >= room.nextRunAt, "settlement preceded due time");
  // Detect a changing/reorganized RPC snapshot rather than combining states from different blocks.
  assert.equal((await client.getBlock({ blockNumber: snapshot })).hash, block.hash, "snapshot changed");
  return {
    chainId: 4663, blockNumber: snapshot.toString(), blockHash: block.hash,
    runtimeKeccak256: keccak256(code), compiler: build.compiler,
    contract: CONTRACT, proof: "successful deploy/open/settle receipts and exact transfer/event values",
    historicalBalanceSnapshots: "not re-read; receipt transfers are independently checked",
  };
}

async function main() {
  const options = {};
  for (let i = 2; i < process.argv.length; ++i) {
    const flag = process.argv[i];
    if (flag === "--offline") options.offline = true;
    else if (["--rpc-url", "--block", "--solc"].includes(flag)) {
      const value = process.argv[++i];
      assert(value && !value.startsWith("--"), `missing value for ${flag}`);
      if (flag === "--block") options.blockNumber = BigInt(value);
      else options[flag === "--solc" ? "solc" : "rpcUrl"] = value;
    } else throw new Error(`Unknown argument: ${flag}`);
  }
  const build = await checkLocal(options);
  const result = options.offline
    ? { compiler: build.compiler, localArtifact: "exact match", adminSurface: "no admin/upgrade/pause/sweep entry point" }
    : await checkPublished(build, options);
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.shortMessage ?? error.message);
    process.exitCode = 1;
  });
}

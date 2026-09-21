import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "contracts", "Outlay.sol");
const verificationDir = path.join(root, "verification");
const source = await readFile(sourcePath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "contracts/Outlay.sol": { content: source },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "cancun",
    viaIR: false,
    outputSelection: {
      "*": { "*": ["abi", "evm.bytecode", "evm.deployedBytecode", "metadata"] },
    },
  },
};

const tokens = {
  "42161": "0x004B506865409877C9fA29bfb1ebA929984B9bbC",
  "4663": "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  "421614": "0xFFC95faa3d63Cde504a05B567C600B78C0b41892",
};

const constructorArgs = Object.fromEntries(
  Object.entries(tokens).map(([chainId, address]) => [
    chainId,
    `000000000000000000000000${address.slice(2).toLowerCase()}`,
  ]),
);

await mkdir(verificationDir, { recursive: true });
await writeFile(
  path.join(verificationDir, "standard-json-input.json"),
  `${JSON.stringify(input, null, 2)}\n`,
);
await writeFile(
  path.join(verificationDir, "constructor-args.json"),
  `${JSON.stringify(constructorArgs, null, 2)}\n`,
);
console.log("wrote verification/standard-json-input.json and verification/constructor-args.json");


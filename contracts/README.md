# Outlay contract

[`Outlay.sol`](./Outlay.sol) is the canonical single-file contract. It is compiled with Solidity
`v0.8.37+commit.f401782d`, optimizer enabled at 200 runs, EVM Cancun, and `viaIR=false`.

Run `forge test -vv` from the repository root for the 12-test EVM suite. Use
[`../verification/standard-json-input.json`](../verification/standard-json-input.json) for explorer
verification; unlike `compiler.json`, it embeds the exact source accepted by a standard-JSON
compiler endpoint. Regenerate all artifacts with `npm run generate` after any source change.

The root [README](../README.md) contains chain-specific constructor arguments, the judge click path,
and the post-deployment verification command. No deployed or verified address is claimed yet.

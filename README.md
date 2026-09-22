# Outlay

Scheduled canonical-USDG payout rooms with a sender-funded settler bounty.

Live app: [outlay-theta.vercel.app](https://outlay-theta.vercel.app/) · Public source:
[github.com/dmetagame/outlay](https://github.com/dmetagame/outlay)

A sender locks one or more payouts in an isolated room. Once the onchain due time arrives, any
wallet can call `settle`: the payee receives the payout and the caller receives the bounty in the
same transaction. One-shot rooms return excess funding to the sender and close. Refund is possible
only before the first payout.

Outlay is not a stream and does not depend on an offchain keeper. Its wedge against passive timer
escrow is the paid, permissionless settlement market. It is not Conduit Financial.

## Money loop

`fund canonical USDG → due time arrives → anyone settles → payee + caller are paid`

The judge defaults are a **0.10 USDG payout**, **0.01 USDG bounty**, one funded period, and a payee
different from the connected sender. One MetaMask can deploy, fund, and settle; the payee can be a
second address controlled by the judge and does not need to connect.

The `0.01 USDG` bounty proves that the caller is paid; it is not a profitability guarantee. At the
22 Sep 2026 observed Robinhood gas price of `0.050094 gwei`, the tested one-shot settlement gas
estimate would cost more than one cent at the contemporaneous ETH/USDG quote. A sender seeking
unattended third-party execution should set the configurable bounty above live transaction cost.

**Proof status:** the Robinhood USDG funding route is live-quoted, but Outlay is not yet claimed as
mainnet-proven. That claim waits for a user-signed Robinhood Blockscout transaction showing the
payee received `0.10 USDG` and the settler received `0.01 USDG`.

## Canonical USDG

| Network | Chain ID | Constructor argument |
| --- | ---: | --- |
| Robinhood Chain (default demo) | 4663 | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` |
| Arbitrum One (existing holders only) | 42161 | `0x004B506865409877C9fA29bfb1ebA929984B9bbC` |
| Arbitrum Sepolia | 421614 | `0xFFC95faa3d63Cde504a05B567C600B78C0b41892` |

Sources: [Paxos mainnet addresses](https://docs.paxos.com/guides/stablecoin/usdg/mainnet) and
[Paxos testnet addresses](https://docs.paxos.com/guides/stablecoin/usdg/testnet). Outlay contains no
mock-token route; testnet uses Paxos's published token and official
[faucet](https://faucet.paxos.com/). The faucet may require a Paxos developer account or sign-in.

### Robinhood Chain funding route

The judge route is the pinned [Uniswap ETH → canonical USDG swap](https://app.uniswap.org/swap?chain=robinhood&inputCurrency=ETH&outputCurrency=0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168).
At Robinhood block `69,615,154`, the verified Uniswap v3 pool
[`0x52e65B17…271Ca`](https://app.uniswap.org/explore/pools/robinhood/0x52e65B17fB6E5BA00Ed806f37Afcd2DaA50271Ca)
reported WETH as `token0`, canonical USDG as `token1`, fee `100` (0.01%), and nonzero liquidity.
Uniswap QuoterV2 `0x33e885eD…A9E7` returned `274490` USDG base units—`0.274490 USDG`—for
`0.0001 WETH`. This is a live onchain quote for a cents-size fill; it is not inferred from a token
page. The UI URL starts with native ETH, which Uniswap wraps for the WETH pool.

### Arbitrum One liquidity warning

The [Arbitrum One Uniswap URL](https://app.uniswap.org/swap?chain=arbitrum&outputCurrency=0x004B506865409877C9fA29bfb1ebA929984B9bbC)
pins the correct output contract, but it is **not a proven funding route**. Checks on 22 Sep 2026
found zero Dexscreener pairs and no Uniswap or aggregator fill. Arbitrum One is supported only for a
wallet that already holds canonical USDG. Never substitute Gold USD `0x82248d53…` or another
lookalike.

## Contract guarantees

- `amount > 0`, `bounty > 0`, `funded >= amount + bounty`, and `payee != sender` are enforced onchain.
- Every room owns its own `remaining`; another room's deposit cannot subsidize it.
- State changes precede token transfers and all mutating entry points share a reentrancy lock.
- ERC-20 transfers support both tokens that return `bool` and tokens that return no data.
- Recurring schedules advance from settlement time (`block.timestamp + interval`), avoiding catch-up
  bursts from an old due date.
- One-shot settlement pays both legs, returns any remainder, zeros accounting, and closes atomically.
- After any settlement, `refund` reverts `AlreadyPaid`.

The canonical source is [`contracts/Outlay.sol`](./contracts/Outlay.sol).

## Run and test

Requirements: Node.js 22+, npm, and Foundry.

```bash
npm install
forge test -vv
npm run check
npm run dev
```

`forge test -vv` runs 14 EVM tests with bool-return, no-return, and actively reentrant token doubles.
`npm run check` type-checks, runs seven address/form/chain tests plus nine accounting-model tests,
and creates the production client/SSR bundles. The TypeScript model is supplemental; the Foundry
suite is the contract evidence.

## Judge click path

1. [Add Robinhood Chain to MetaMask](https://docs.robinhood.com/chain/add-network-to-wallet/) if it
   is missing: chain ID `4663`, RPC `https://rpc.mainnet.chain.robinhood.com`, currency `ETH`, and
   explorer `https://robinhoodchain.blockscout.com`. Copy a second address you control for the payee.
2. Keep enough ETH on Robinhood Chain for gas. Open the pinned [Uniswap route](https://app.uniswap.org/swap?chain=robinhood&inputCurrency=ETH&outputCurrency=0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168),
   confirm output token `0x5fc5…d168`, and buy at least `0.11 USDG`.
3. Open Outlay, click **Connect MetaMask**, and select **Robinhood Chain** if needed. Confirm the
   full connected address is shown by the wallet control tooltip and the USDG balance appears.
4. Click **Deploy from this wallet** and approve the transaction. Open **Deployment transaction** on
   Robinhood Blockscout and copy the deployed address.
5. Keep the defaults: payout `0.10`, bounty `0.01`, periods `1`, and **In 1 minute**. Paste the second
   address. The form rejects the connected sender. Confirm the lock preview is `0.11 USDG`.
6. Click **Approve 0.11 USDG**, confirm, then click **Fund and open room** and confirm. Open the room
   transaction link.
7. Once the room says **DUE**, click **Settle · earn 0.01 USDG** from the connected wallet. This can
   be the original sender: settlement is public, not sender-exclusive.
8. Open both proof links shown by the app: **Settlement tx** and **Payee USDG balance**. Confirm the
   second address increased by `0.10 USDG`; the calling address received `0.01 USDG`; the one-shot
   room is closed.

For a no-value rehearsal, switch the app and MetaMask to Arbitrum Sepolia, obtain official Paxos
testnet USDG, and repeat the same clicks. The Paxos faucet may require an account. Use Arbitrum One
only if the wallet already holds its canonical USDG; no DEX route was found there.

## Build and explorer verification

| Setting | Exact value |
| --- | --- |
| Compiler | `v0.8.37+commit.f401782d` |
| Optimizer | enabled, 200 runs |
| EVM version | `cancun` |
| via IR | false |
| License | MIT |

Regenerate the browser artifact and verification inputs from the canonical source:

```bash
npm run generate
```

The accepted compiler payload is
[`verification/standard-json-input.json`](./verification/standard-json-input.json); per-chain ABI
constructor encodings are in
[`verification/constructor-args.json`](./verification/constructor-args.json). After a real wallet
deployment, verify without reconstructing settings:

```bash
scripts/verify-contract.sh 4663 0xDEPLOYED_ADDRESS
```

Use chain `42161` for Arbitrum One or `421614` for Arbitrum Sepolia. No deployment address, verified
badge, or mainnet Outlay payment is claimed in this repository yet.

The TanStack Start production build uses Nitro's Node/Vercel adapter. `vercel.json` explicitly selects
the `tanstack-start` framework; `npm start` serves the built `.output` bundle locally.

## Repository map

- `contracts/Outlay.sol` — canonical deployable contract
- `test/Outlay.t.sol` — EVM behavior and adversarial token tests
- `src/components/outlay` — wallet deployment, funding, room, settlement, and proof UI
- `src/lib/outlay` — ABI/bytecode, chain constants, formatting, storage, and accounting model
- `verification` — standard JSON and constructor encoding kit
- `scripts` — deterministic artifact generation and post-deploy explorer verification

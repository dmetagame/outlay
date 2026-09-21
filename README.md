# Outlay

Scheduled canonical-USDG payout rooms with a sender-funded settler bounty.

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

## Canonical USDG

| Network | Chain ID | Constructor argument |
| --- | ---: | --- |
| Arbitrum One (default) | 42161 | `0x004B506865409877C9fA29bfb1ebA929984B9bbC` |
| Robinhood Chain | 4663 | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` |
| Arbitrum Sepolia | 421614 | `0xFFC95faa3d63Cde504a05B567C600B78C0b41892` |

Sources: [Paxos mainnet addresses](https://docs.paxos.com/guides/stablecoin/usdg/mainnet) and
[Paxos testnet addresses](https://docs.paxos.com/guides/stablecoin/usdg/testnet). Outlay contains no
mock-token route; testnet uses Paxos's published token and official
[faucet](https://faucet.paxos.com/).

### Arbitrum One liquidity warning

The [Uniswap URL](https://app.uniswap.org/swap?chain=arbitrum&outputCurrency=0x004B506865409877C9fA29bfb1ebA929984B9bbC)
pins the correct output contract, but it is **not currently a proven funding route**. Checks on
22 Sep 2026 found no Uniswap V3 pool against Arbitrum USDC, USDT, or WETH at the standard fee tiers;
the Dexscreener token-pairs endpoint returned no pools, and ParaSwap returned `No routes found with
enough liquidity` for a 1 USDC quote. A mainnet demo therefore requires USDG already held on
Arbitrum One. Rehearse on Arbitrum Sepolia with the official Paxos token/faucet; never substitute a
lookalike or mock.

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

`forge test -vv` runs 12 EVM tests with bool-return, no-return, and actively reentrant token doubles.
`npm run check` type-checks, runs five address/form tests plus nine accounting-model tests,
and creates the production client/SSR bundles. The TypeScript model is supplemental; the Foundry
suite is the contract evidence.

## Judge click path

1. In MetaMask, select Arbitrum One and hold ETH plus at least `0.11` canonical USDG. Copy a second
   address you control for the payee.
2. Open Outlay and click **Connect MetaMask**. Confirm the full connected address is shown by the
   wallet control tooltip and the canonical USDG balance appears in the strip.
3. Click **Deploy from this wallet** and approve the transaction. Open **Deployment transaction** on
   Arbiscan and copy the deployed address.
4. Keep the defaults: payout `0.10`, bounty `0.01`, periods `1`, and **In 1 minute**. Paste the second
   address. The form rejects the connected sender. Confirm the lock preview is `0.11 USDG`.
5. Click **Approve 0.11 USDG**, confirm, then click **Fund and open room** and confirm. Open the room
   transaction link.
6. Once the room says **DUE**, click **Settle · earn 0.01 USDG** from the connected wallet. This can
   be the original sender: settlement is public, not sender-exclusive.
7. Open both proof links shown by the app: **Settlement tx** and **Payee USDG balance**. Confirm the
   second address increased by `0.10 USDG`; the calling address received `0.01 USDG`; the one-shot
   room is closed.

For a no-value rehearsal, switch the app and MetaMask to Arbitrum Sepolia, obtain official Paxos
testnet USDG, and repeat the same clicks. Do not use the Robinhood deployment unless the wallet has
both chain-4663 ETH and canonical USDG.

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
ETHERSCAN_API_KEY=... scripts/verify-contract.sh 42161 0xDEPLOYED_ADDRESS
```

Use chain `421614` for Arbitrum Sepolia or `4663` for Robinhood Blockscout. No deployment address or
verified badge is claimed in this repository yet.

The TanStack Start production build uses Nitro's Node/Vercel adapter. `vercel.json` explicitly selects
the `tanstack-start` framework; `npm start` serves the built `.output` bundle locally.

## Repository map

- `contracts/Outlay.sol` — canonical deployable contract
- `test/Outlay.t.sol` — EVM behavior and adversarial token tests
- `src/components/outlay` — wallet deployment, funding, room, settlement, and proof UI
- `src/lib/outlay` — ABI/bytecode, chain constants, formatting, storage, and accounting model
- `verification` — standard JSON and constructor encoding kit
- `scripts` — deterministic artifact generation and post-deploy explorer verification

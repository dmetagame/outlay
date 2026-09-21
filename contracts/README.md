# Outlay

Scheduled USDG payout rooms with a **settler bounty**.

A sender locks canonical USDG in an isolated room: payout to a distinct payee, plus a bounty for whoever calls `settle` once the rule is due. One-shot rooms close on payout and return leftover to the sender. Cancel/refund is only allowed **before the first settlement**.

Not LlamaPay (no stream, public settle is paid). Not Conduit Financial. Not buyer-release escrow.

## Loop

`fund USDG → wait until due → anyone settles → payee + settler balances change`

Default demo: **0.10 USDG payout + 0.01 USDG bounty**. Payee must be a different address than the sender. One wallet can fund and settle to a second MetaMask account.

## USDG

| Network | Chain ID | Token |
| --- | --- | --- |
| Arbitrum One | 42161 | `0x004B506865409877C9fA29bfb1ebA929984B9bbC` |
| Robinhood Chain | 4663 | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` |
| Arbitrum Sepolia | 421614 | `0xFFC95faa3d63Cde504a05B567C600B78C0b41892` |

Paxos mint is institutional. Secondary market: [Uniswap on Arbitrum](https://app.uniswap.org/swap?chain=arbitrum&outputCurrency=0x004B506865409877C9fA29bfb1ebA929984B9bbC). Testnet addresses: [Paxos USDG testnets](https://docs.paxos.com/guides/stablecoin/usdg/testnet).

## Guarantees

- Isolated `remaining` per room
- Checks-effects-interactions + reentrancy lock
- Bounty `> 0` and payout `> 0`
- `payee != sender`
- Interval advances from `block.timestamp` at settle
- `refund` reverts with `AlreadyPaid` after the first settlement

## Verify on explorer

After deploy, verify [Outlay.sol](./Outlay.sol) as a single-file contract:

| Setting | Value |
| --- | --- |
| Compiler | `0.8.37+commit.f401782d` |
| Optimizer | yes, 200 runs |
| EVM | Cancun |
| License | MIT |
| Constructor | canonical USDG address for that chain (table above) |

Standard-JSON input: [compiler.json](./compiler.json) plus the source as `Outlay.sol`.

## Tests

Accounting machine (Node): `src/lib/outlay/machine.test.ts`

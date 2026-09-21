# Project State

> Living handoff for Codex sessions. Read this file before working. Do not put
> secrets or raw credential-bearing values here.

Last updated: `2026-09-21T23:30:17Z`
Status: `READY_FOR_WALLET_PROOF`
Active objective: Finish and verify Outlay for the Arbitrum Open House Singapore Promising Products track.

## Workspace

- Repository: `https://github.com/dmetagame/outlay`
- Worktree: `/home/rouma/outlay`
- Branch: `main`
- Commit: `05b22f2cf31b5252189a942dce7b41cd9c9e64bd` (application checkpoint, pushed to `origin/main`)
- Protected releases/artifacts: none identified; no deployed or verified Outlay contract is claimed.

## Constraints

- Product is locked: scheduled canonical-USDG payout rooms with a mandatory sender-funded settler bounty.
- Arbitrum One is the default chain; Robinhood Chain is optional only with funded USDG and ETH.
- Keep auth/database off, enforce `payee != sender`, and do not introduce mock USDG in the application.
- Do not deploy from an unavailable user key or claim explorer verification before a real deployment.

## Current Context

- `contracts/Outlay.sol` is the canonical single-file contract at the starting commit.
- The repository contains the contract, compiler metadata, and nine Node accounting-model tests only.
- The prompt-described TanStack Start/wagmi UI and leftover `src/components/conduit` / `src/lib/conduit` paths are absent from every public branch and from the workspace. The only Vercel `conduit-ui` deployment is the older Sui app.
- No Foundry project or EVM tests existed at session start.

## Work Completed

- Cloned the public repository and verified `main` matches `origin/main` at `2205695`.
- Verified GitHub authentication as `dmetagame` and the HTTPS origin.
- Read the contract, compiler metadata, README, and all existing TypeScript accounting tests.
- Confirmed through the public repository tree and authenticated code search that no `Conduit.sol` or claimed Outlay UI source exists elsewhere under `dmetagame`.
- Added a pinned Foundry project and public-interface EVM suite in `test/Outlay.t.sol` covering all required room, balance, isolation, ERC-20 return, and reentrancy behaviors.
- Corrected `refund()` validation order so any room with a settlement reverts `AlreadyPaid`, including a closed one-shot room.
- Restored the missing TanStack Start/wagmi application entirely under `src/components/outlay` and `src/lib/outlay`; no Conduit source paths or storage keys remain.
- Added connected-wallet deployment, canonical-USDG balance/allowance reads, payee validation, lock preview, room settlement/refund controls, and transaction plus payee-balance explorer proofs.
- Existing contract addresses are accepted only after `usdg()` matches the canonical token for the selected chain.
- Added deterministic ABI/bytecode generation, exact standard-JSON verification input, constructor encodings, and chain-aware `scripts/verify-contract.sh`.
- Added the official Nitro/Vercel production adapter and explicit `tanstack-start` framework declaration.
- Confirmed the Uniswap URL pins canonical Arbitrum USDG but found no current V3 pool or aggregator route; the UI and README now disclose this and route dry runs to official Paxos Sepolia USDG/faucet.

## Verification

| Check | Result | Evidence/date |
| --- | --- | --- |
| Git/GitHub | pass | Clean `main`; `gh auth status` authenticated as `dmetagame`, 2026-09-21 |
| Existing EVM tests | missing | No `foundry.toml`, Solidity test, or test dependency at start |
| Existing UI | missing | Repository/workspace/GitHub search, 2026-09-21 |
| Foundry EVM suite | pass | `forge test -vv`: 12 passed, 0 failed, 2026-09-21 |
| Foundry formatting | pass | `forge fmt --check`, 2026-09-21 |
| Accounting model | pass | `node --experimental-strip-types src/lib/outlay/machine.test.ts`: 9 passed, 2026-09-21 |
| Form/address unit tests | pass | Vitest: 5 passed, 0 failed, 2026-09-21 |
| Typecheck + production build | pass | `npm run check`; Nitro `.output` generated, 2026-09-21 |
| Production server | pass | `PORT=3022 npm start`; HTTP 200 with rendered Outlay HTML, 2026-09-21 |
| Browser smoke | pass | Playwright desktop: 0 console errors; 390px viewport: no horizontal overflow, 2026-09-21 |
| Dependency audit | pass | `npm audit --audit-level=high`: 0 vulnerabilities, 2026-09-21 |
| Verification JSON | pass | solc `0.8.37` standard-JSON compile: 0 errors; bytecode matches Foundry after prefix normalization, 2026-09-21 |
| Verification CLI dry run | pass | `forge verify-contract --show-standard-json-input`: Cancun, optimizer 200, `contracts/Outlay.sol`, 2026-09-21 |

## Risks And Blockers

- External/blocking for final proof: no indexed DEX pair, standard Uniswap V3 pool, or ParaSwap route was available for canonical Arbitrum One USDG on 2026-09-22. A mainnet proof requires USDG already held on Arbitrum One or a newly available route.
- External: no Outlay contract is deployed or explorer-verified yet; those steps require the user's wallet and the resulting contract address.
- Build warning: Nitro/Rolldown reports third-party `use client` directive warnings, but the generated production server returned HTTP 200 and hydrated cleanly in the browser smoke test.

## Next Actions

1. Deploy the public UI from GitHub/Vercel.
2. With a funded user wallet, deploy Outlay on Arbitrum One (or rehearse on Sepolia), run the 0.10 + 0.01 loop to a distinct payee, and verify the resulting address with the committed kit.

## Session Handoff

Start with `git status --short --branch`, this file, `contracts/Outlay.sol`, and `README.md`. Do not claim a deployment, verified badge, mainnet payment, or working Arbitrum One swap until explorer evidence exists.

## Change Log

| Timestamp | Session/agent | Event | Result |
| --- | --- | --- | --- |
| 2026-09-21T22:11:05Z | Codex | Session start and repository reconciliation | Public repository is clean and authenticated; prompt-described UI and EVM tests are absent. |
| 2026-09-21T22:18:00Z | Codex | Contract audit and EVM-test checkpoint | Found one spec mismatch, fixed it minimally, and passed 12 Foundry tests plus the existing accounting suite. |
| 2026-09-21T23:28:35Z | Codex | Application, verification, funding, and adversarial review checkpoint | Wallet UI and production adapter pass tests/browser smoke; verification artifacts compile exactly; mainnet USDG acquisition remains external. |
| 2026-09-21T23:30:17Z | Codex | GitHub checkpoint | Commit `05b22f2` pushed to public `dmetagame/outlay` on `origin/main`. |

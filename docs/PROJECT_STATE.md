# Project State

> Living handoff for Codex sessions. Read this file before working. Do not put
> secrets or raw credential-bearing values here.

Last updated: `2026-09-22T11:48:26Z`
Status: `READY_FOR_ROBINHOOD_WALLET_PROOF`
Active objective: Finish and verify Outlay for the Arbitrum Open House Singapore Promising Products track.

## Workspace

- Repository: `https://github.com/dmetagame/outlay`
- Worktree: `/home/rouma/outlay`
- Branch: `main`
- Base commit: `27e65a1751865dfaca9b5d77c447a8f94797e8e7` (matched `origin/main` at session start); Robinhood-default checkpoint is pending commit.
- Protected releases/artifacts: none identified; no deployed or verified Outlay contract is claimed.

## Constraints

- Product is locked: scheduled canonical-USDG payout rooms with a mandatory sender-funded settler bounty.
- Robinhood Chain is the default demo chain; Arbitrum One remains supported only for wallets already holding canonical USDG because no DEX route was found.
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
- Published the app at `https://outlay-theta.vercel.app/`; Vercel project `dmetagames-projects/outlay` is connected to the public GitHub repository.
- Confirmed the Uniswap URL pins canonical Arbitrum USDG but found no current V3 pool or aggregator route; the UI and README now disclose this and route dry runs to official Paxos Sepolia USDG/faucet.
- Changed the disconnected/default demo chain to Robinhood Chain while keeping Arbitrum One and Arbitrum Sepolia supported.
- Made Robinhood buy, Arbitrum One warning, and Sepolia faucet/docs routes visible without a connected wallet; every route displays its exact canonical token address.
- Added the complete Robinhood judge click path to the UI and README and preserved the explicit no-mainnet-proof claim until a user-signed transaction exists.
- Added Foundry coverage for refund-before-settlement and the second recurring `NotDue` boundary.

## Verification

| Check | Result | Evidence/date |
| --- | --- | --- |
| Git/GitHub | partial | Repository matched `origin/main` at session start, but `gh auth status` reports an expired token; push not yet attempted for this checkpoint, 2026-09-22 |
| Existing EVM tests | missing | No `foundry.toml`, Solidity test, or test dependency at start |
| Existing UI | missing | Repository/workspace/GitHub search, 2026-09-21 |
| Foundry EVM suite | pass | `forge test -vv`: 14 passed, 0 failed, 2026-09-22 |
| Foundry formatting/lint | pass | `forge fmt --check`; `forge lint --deny warnings`, 2026-09-22 |
| Accounting model | pass | `node --experimental-strip-types src/lib/outlay/machine.test.ts`: 9 passed, 2026-09-21 |
| Form/address/chain unit tests | pass | Vitest: 7 passed, 0 failed, 2026-09-22 |
| Typecheck + production build | pass | `npm run check`; 7 Vitest + 9 model tests and Nitro `.output`, 2026-09-22 |
| Production server | pass | `PORT=3022 npm start`; rendered Outlay production build, 2026-09-22 |
| Browser smoke | pass | Playwright disconnected desktop: 0 console errors; 390px viewport: no horizontal overflow, 2026-09-22 |
| Public deployment | pass | Vercel deployment `dpl_CpCJKtaMxwtybXmsGrHRV4hhpoLx`; alias HTTP 200 and live browser console 0 errors, 2026-09-21 |
| Dependency audit | pass | `npm audit --audit-level=high`: 0 vulnerabilities, 2026-09-22 |
| Verification JSON | pass | solc `0.8.37` standard-JSON compile: 0 errors; bytecode matches Foundry after prefix normalization, 2026-09-21 |
| Verification CLI dry run | pass | `forge verify-contract --show-standard-json-input`: Cancun, optimizer 200, `contracts/Outlay.sol`, 2026-09-21 |
| Robinhood quote | pass | Block `69,615,154`: pool `0x52e65B17fB6E5BA00Ed806f37Afcd2DaA50271Ca` token0 WETH, token1 canonical USDG, fee 100, nonzero liquidity; QuoterV2 returned `0.274490 USDG` for `0.0001 WETH`, 2026-09-22 |
| Disconnected browser smoke | pass | Local production build: Robinhood token shown by default; all 3 funding routes visible, exact pinned links, 0 console errors, 390px no overflow, 2026-09-22 |

## Risks And Blockers

- GitHub CLI authentication failed at the 2026-09-22 session start because the saved token is no longer valid. The repository itself is clean and matches `origin/main`; a later HTTPS push must be attempted and verified before new work is called remotely backed up.
- Arbitrum One remains existing-holder-only: no indexed pair or executable DEX route was found for its canonical USDG. Gold USD `0x82248d53…` is a forbidden lookalike.
- External: no Outlay contract is deployed or explorer-verified yet; those steps require the user's wallet and the resulting contract address.
- External: the Robinhood funding route is live-quoted, but the Outlay money loop is not mainnet-proven until the user supplies a Blockscout settlement transaction showing payee `+0.10 USDG` and settler `+0.01 USDG`.
- Build warning: Nitro/Rolldown reports third-party `use client` directive warnings, but the generated production server returned HTTP 200 and hydrated cleanly in the browser smoke test.

## Next Actions

1. Commit and push the Robinhood-default checkpoint, deploy the updated UI, and repeat the disconnected live browser smoke.
2. User adds Robinhood Chain to MetaMask, buys at least `0.11` canonical USDG through the pinned Uniswap route, deploys Outlay, and runs the `0.10 + 0.01` loop to a distinct payee.
3. Verify the deployed contract on Robinhood Blockscout and record the user-provided settlement transaction only after both USDG transfer legs are visible.

## Session Handoff

Start with `git status --short --branch`, this file, `contracts/Outlay.sol`, and `README.md`. Do not claim a deployed/verified Outlay contract or mainnet payment until explorer evidence exists. Robinhood liquidity is quote-proven; Arbitrum One liquidity is not.

## Change Log

| Timestamp | Session/agent | Event | Result |
| --- | --- | --- | --- |
| 2026-09-21T22:11:05Z | Codex | Session start and repository reconciliation | Public repository is clean and authenticated; prompt-described UI and EVM tests are absent. |
| 2026-09-21T22:18:00Z | Codex | Contract audit and EVM-test checkpoint | Found one spec mismatch, fixed it minimally, and passed 12 Foundry tests plus the existing accounting suite. |
| 2026-09-21T23:28:35Z | Codex | Application, verification, funding, and adversarial review checkpoint | Wallet UI and production adapter pass tests/browser smoke; verification artifacts compile exactly; mainnet USDG acquisition remains external. |
| 2026-09-21T23:30:17Z | Codex | GitHub checkpoint | Commit `05b22f2` pushed to public `dmetagame/outlay` on `origin/main`. |
| 2026-09-21T23:34:55Z | Codex | Production deployment | Vercel project linked to GitHub; `https://outlay-theta.vercel.app/` returned HTTP 200 and a clean live-browser smoke test. |
| 2026-09-22T00:00:00Z | Codex | Session reconciliation for Robinhood-default change | Clean `main` at `27e65a1`, matching `origin/main`; state was stale and GitHub CLI authentication is expired. |
| 2026-09-22T11:48:26Z | Codex | Robinhood demo-route implementation and verification | Robinhood is the disconnected default; all funding routes are always visible; pinned v3 quote returned `0.274490 USDG` for `0.0001 WETH`; 14 EVM + 7 Vitest + 9 model tests pass. |

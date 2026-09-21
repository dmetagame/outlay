# Project State

> Living handoff for Codex sessions. Read this file before working. Do not put
> secrets or raw credential-bearing values here.

Last updated: `2026-09-21T22:18:00Z`
Status: `IN_PROGRESS`
Active objective: Finish and verify Outlay for the Arbitrum Open House Singapore Promising Products track.

## Workspace

- Repository: `https://github.com/dmetagame/outlay`
- Worktree: `/home/rouma/outlay`
- Branch: `main`
- Commit: `220569526df540901a5e0b33607e0fa1044d1e0e`
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

## Verification

| Check | Result | Evidence/date |
| --- | --- | --- |
| Git/GitHub | pass | Clean `main`; `gh auth status` authenticated as `dmetagame`, 2026-09-21 |
| Existing EVM tests | missing | No `foundry.toml`, Solidity test, or test dependency at start |
| Existing UI | missing | Repository/workspace/GitHub search, 2026-09-21 |
| Foundry EVM suite | pass | `forge test -vv`: 12 passed, 0 failed, 2026-09-21 |
| Foundry formatting | pass | `forge fmt --check`, 2026-09-21 |
| Accounting model | pass | `node --experimental-strip-types --test src/lib/outlay/machine.test.ts`, 2026-09-21 |

## Risks And Blockers

- High: the claimed live TanStack UI source is not present; completing the requested wallet path requires adding the missing application source to this repository.
- High: Solidity behavior is represented only by a TypeScript model until Foundry tests pass.
- External: mainnet proof, deployed address, and explorer verification require the user's wallet.

## Next Actions

1. Commit and push the contract-test checkpoint with this state file.
2. Add the missing Outlay-only wallet UI, verification kit, funding links, and judge click path.

## Session Handoff

Start with `git status --short --branch`, this file, `contracts/Outlay.sol`, and the Foundry/UI verification commands recorded below as work progresses.

## Change Log

| Timestamp | Session/agent | Event | Result |
| --- | --- | --- | --- |
| 2026-09-21T22:11:05Z | Codex | Session start and repository reconciliation | Public repository is clean and authenticated; prompt-described UI and EVM tests are absent. |
| 2026-09-21T22:18:00Z | Codex | Contract audit and EVM-test checkpoint | Found one spec mismatch, fixed it minimally, and passed 12 Foundry tests plus the existing accounting suite. |

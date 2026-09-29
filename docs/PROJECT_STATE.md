# Project State

Last updated: `2026-09-29`
Status: `ROBINHOOD_PROOF_PUBLISHED_AND_LIVE`
Active objective: Completed — public main and live app present the Robinhood payment proof and Sourcify exact match.

## Workspace and boundaries

- Repository: `https://github.com/dmetagame/outlay`; worktree: `/home/rouma/outlay-proof/outlay`; branch: `main`.
- Published application/proof commit: `bb4ad4dee4f5f5c657dc8c79cf28d7b6566bd90e`, pushed to main and confirmed by `git ls-remote origin refs/heads/main`.
- Starting commit: `e85f81f4ca65c79136dbdb7869af10ab2e1a37a3`, confirmed on `origin/main` before edits.
- Protected: `contracts/Outlay.sol`, committed `src/lib/outlay/artifact.ts`, and deployed bytecode. Do not change or regenerate them for this publication.
- User authorizes commit and push to main, followed by checking the Git-integrated Vercel deployment. No new blockchain transactions are needed.
- Do not read, print, or commit `.env` or any private key. Metadata-only Git checks confirm `.env` is ignored and untracked. Build checks run in a temporary checkout without `.env` to avoid Vite loading it.
- The earlier proof script and `.env.example` remain local, untracked files from the broadcasting session; they are outside this publication's staged files.

## Completed Robinhood proof

- Chain: Robinhood 4663.
- Contract: `0xe1b5d2cf63c43103455abd802b6b241b959a530c`.
- Canonical USDG: `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`.
- Sender / caller: `0xee3ea6f858ae84dd6959f241dfc257a2f8fa3f53`; payee: `0x4157e84fa929f797cc244d28fd9d48b4c6d43df0`.
- Deploy: `0xc0cd9fcba279c431dec9756b865994c127a3727fc2aedd77b400a7cfcef5e432`, block `75737751`. Creation bytecode equals the committed artifact plus the canonical USDG constructor argument; only its duplicated `0x` text prefix was normalized during encoding.
- Open: `0xfb921ebeccb21e342e4dee63f518da14ca721f9d1ecf94b46cb84c9d902e4633`, block `75737838`. Room 1: amount 0.10, bounty 0.01, funded 0.11 USDG, interval 0.
- Settle: `0x8463c5c7a56df5781d443981558f3149f8199740b6aeb6569f8a60059c8cdb12`, block `75738431`, timestamp `1790693161`, due `1790693157`.
- USDG balances before open / after open / after settle: sender `0.326841 / 0.216841 / 0.226841`; payee `0 / 0 / 0.100000`; contract `0 / 0.110000 / 0`.
- Transfer logs and RPC reads proved payee +0.10 USDG and caller +0.01 USDG. Room 1: settlements 1, remaining 0, active false.
- `settle(uint256)` was called by the sender. Settlement is permissionless; this was not a third-party keeper demo.
- Gas: `99970` at `20850000 wei`, `0.0000020843745 ETH` (about `0.000002084 ETH`). No keeper profitability guarantee.
- [Sourcify exact match, creation and runtime](https://repo.sourcify.dev/4663/0xe1B5d2cF63C43103455ABD802B6B241b959a530c): compiler `0.8.37+commit.f401782d`, verified `2026-09-29T15:32:34Z`.
- Full public evidence: [`proof/PROOF.md`](../proof/PROOF.md).

## Product and publication

- TanStack Start/wagmi app at `https://outlay-theta.vercel.app/`; Vercel project `dmetagames-projects/outlay` deploys from main through Git integration.
- Robinhood remains the default; Arbitrum One supports existing canonical-USDG holders; Arbitrum Sepolia uses official Paxos testnet USDG.
- Preserve wallet deployment, approval, funding, room management, and permissionless settlement flows. No auth/database or mock-token route.
- README now presents completed proof before the existing judge click path. The app proof strip shows the full deployment address and settlement/Sourcify links without changing wallet deployment.

## Verification and limitations

- Broadcasting session: all four receipts succeeded (deploy, approve, open, settle); balance, event, and room assertions passed. No swap was required.
- Publication checks (2026-09-29): isolated `npm run check` passed (typecheck, seven Vitest tests, nine model tests, production build). Local production HTML and browser show the exact deployment/settlement/Sourcify links and retain the wallet deploy control; 390px mobile has no horizontal overflow and no page errors. Public-file scan found only allowlisted transaction hashes and no key assignments; protected contract/artifact diff is empty.
- Historical checks (2026-09-22): 14 Foundry EVM tests; seven Vitest tests; nine accounting-model tests; typecheck and production build; desktop/mobile browser smoke passed.
- Robinhood Blockscout verification is an open explorer-badge limitation: compiler list lacks `0.8.37`, API returns Cloudflare 403. The CLI attempt and exact error are in the proof. Do not claim a Blockscout verified badge. This does not block the completed payment or Sourcify exact match.
- GitHub CLI token is invalid; Git HTTPS push succeeded. Public main contains the proof, updated README/state, and app proof strip.
- Arbitrum One's canonical-USDG DEX funding route was not found in earlier checks. Existing-holder-only disclosure remains.
- Vercel CLI previously lacked authorization; deployment uses the existing Git integration.

## Publication result and next actions

- `https://outlay-theta.vercel.app/` serves the new proof strip through the existing Git/Vercel integration. HTTP HTML and a live browser both show the full deployed address, exact settlement URL, and exact Sourcify URL.
- Live browser at 390px: no horizontal overflow or page errors; wallet deploy control remains present; the sender-settled and incomplete-Blockscout caveats are visible.
- Only six public docs/proof/UI files were committed. `.env` is absent from Git status, tracked files, and staging; no private key values were included. Contract, artifact, and standard JSON remain identical to the starting commit.
- Publication is complete. Optional later work: obtain a Blockscout badge when compiler support/API access permit; no repeat payment or deployment is needed.

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
| 2026-09-22T11:56:19Z | Codex | GitHub and production checkpoint | Commit `2c31322` pushed to `origin/main`; Git-integrated Vercel deployment serves the Robinhood-default UI with a clean live-browser smoke. |
| 2026-09-22T12:26:51Z | Codex | Independent economics critique | Measured `0.050094 gwei`; commit `65d841b` retains locked demo amounts but discloses that `0.01 USDG` proves payment, not third-party profitability; public HTML contains the disclosure. |
| 2026-09-29 | Codex | Robinhood proof completed | Deployment/open/settlement succeeded; sender settled, payee +0.10 USDG, caller +0.01 USDG. No contract changes. |
| 2026-09-29T15:32:34Z | Sourcify | Source verification | Exact creation/runtime match for compiler 0.8.37+commit.f401782d. |
| 2026-09-29 | Codex | Public proof publication preparation | Replaced obsolete missing-proof blockers, documented both caveats, added app proof strip; typecheck/tests/build and local browser checks passed; push/live confirmation pending. |
| 2026-09-29 | Codex | Publication confirmed | `bb4ad4d` pushed to origin/main; live HTTP and browser checks confirm exact proof links, preserved deploy flow, no mobile overflow or page errors. |

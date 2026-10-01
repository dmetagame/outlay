# Project State

Last updated: `2026-10-01`
Status: `DEMO_VIDEO_COMPLETE`
Active objective: Completed: the requested 2:45 Outlay demo video, thumbnail, subtitles, transcript and editable project are verified and published on GitHub. The public MP4 download matches the local SHA-256 byte for byte. The application, contract and published proof are unchanged; no environment-file reads or blockchain broadcasts. No required video work remains.

## Demo video — 2026-10-01

- User explicitly requests the Outlay demo video after supplying `https://x.com/MystiqueMide/status/2105303495444246574?s=20`. Inspected the 2:43 Kovrell reference: framed application walkthrough, deliberate cuts, narration/captions and evidence. Its editing software is unconfirmed; no claim that MystiqueMide uses Remotion.
- Starting `main` / GitHub main both `ffa721b26b9976fac4020500d0510f133cb91a8c`; GitHub authentication succeeds. The two pre-existing untracked files remain excluded. Updated this state to the newly authorized video scope; previous audit entries below are historical completed work.
- Added isolated `demo-video/` Remotion 4.0.532 project: ten scenes, 4948 frames, 164.93 seconds, 1920×1080 at 30 fps. Live Outlay browser footage, its IBM Plex fonts/forest palette, word-timed captions, generated English narration, recurring setup, public-proof panel and closing app/source links.
- Approve/open/settle reconstruction visibly labeled throughout. All three wallet requests and browser RPC calls are intercepted. No actual wallet, signatures or broadcasts. Real receipt and room 1 re-read separately over public RPC: successful settlement at block 75738431, exact token transfer logs of 100000/10000 units, one settlement, inactive, zero remaining. Proof screenshot captured from a fresh unconnected browser without fixtures.
- `demo-video/recording.json`, `src/evidence.json` and `verification.json` retain reviewable evidence. Sender-settled, incomplete Blockscout verification and no guaranteed keeper profit remain explicit. Contract/artifact/runtime/verification/proof remain byte-for-byte equal to HEAD; the application source is unchanged.
- `npm run lint` (ESLint/TypeScript), matching Remotion versions and `node tools/verify.mjs` pass. Reviewed representative composition stills for intro, configure, evidence and outro. Studio runs locally on port 3005. Final H.264/AAC export is rendering to task-owned temporary storage before final decode/frame/audio checks and publication.
- Root disk was nearly full; video-only dependencies, npm cache and renderer output use `/dev/shm/outlay-video-*`. No unfamiliar cache or user files were removed. The editable sources, assets, subtitles and final artifact will remain in the repository; task-created disposable raw captures/cache can be cleaned after export.
- No work remains in the video scope. Optional future edits use `demo-video/script.json`, `src/scenes/`, and the documented re-record/render commands.
- Editable source/assets checkpoint `b4fcb70e8b59e771ecf388eba3307bb2186e50b0` is pushed and independently confirmed on GitHub main. First full export completed and decoded cleanly, but encoded-frame review caught the following chapter entering the final cloned browser frame. Corrected each cut to end inside its deliberate hold; added `tools/verify_hold.py` to compare all seven edited clips' held states against captured screenshots. All seven pass with mean RGB pixel differences below 1.2; re-export is running with corrected footage. Final artifact publication remains pending.
- Corrected source/footage checkpoint `26acd05047d096b881fbbb18ec2a4be8ca569724` is pushed and independently verified. Corrected full export passes native decoding, eight encoded browser-state comparisons (mean pixel differences 0.65–1.55), seven source-clip end-state comparisons, and all original timeline/receipt/protected-file checks. Representative encoded intro, settlement and recurring frames reviewed. The first-export regression is rejected by the new encoded-state check; the corrected export passes.
- Final artifact: `demo-video/outlay-demo.mp4`, 14869351 bytes, 164.949 seconds, 1920×1080/30 fps, 4948 H.264 frames, stereo AAC at 48 kHz, fast-start MP4. SHA-256 `fc1472aa9a4b730dd271e76a233e84d0590831ac34017d77712b7ac9582c3d4a`. Audio measured -13.8 LUFS integrated, -1.9 dBFS true peak, 3.6 LU range. Narration and captions are included; separate SRT, transcript, editable sources and thumbnail accompany it.
- `media-verification.json` and `encoded-verification.json` record final checks. Task-created raw recordings and npm cache are cleaned; committed edited clips, screenshots and recording evidence remain. `npm run verify` passes using the retained recording manifest after raw cleanup. Studio is stopped. Final commit/push and public-file hash confirmation follow.
- Finished deliverables commit `d9f90c450fd76b6fc069242ad69527a8f50e9b7f` is pushed and independently confirmed on GitHub main. Public download `https://raw.githubusercontent.com/dmetagame/outlay/main/demo-video/outlay-demo.mp4` returns the exact 14869351-byte file and SHA-256 above; public SRT compares byte-for-byte with local. Current workspace `/home/rouma/outlay-proof/outlay`, branch `main`; this final documentation handoff follows the deliverable checkpoint. The only excluded pre-existing files remain `.env.example` and `scripts/prove-robinhood.mjs`.
- Final cleanup removes only this task's temporary rendering/dependency/cache directories and its ignored node_modules symlink. The final MP4/thumbnail/subtitles, edited recording assets, all verification evidence and source/lockfiles are committed and retained. No website or application redesign was performed for the video.

## Audit coverage — 2026-10-01

- User requests implementation of the remaining gaps following the completed wallet fixes. Reconciled main/origin/main at `8cd03ca30c5ea808158e0ef026568d120390207a`; GitHub authentication succeeds. Only the pre-existing `.env.example` and proof script are untracked and excluded.
- Scope: test the eleven existing contract claims at their already-authorized public interfaces, including failure atomicity, cross-entry token callbacks, pooled backing assumptions, and impractical lifetime boundaries. Add a local fork test against canonical USDG and a read-only deployment verifier. Keep both residual risks explicit; tests cannot remove issuer controls from an immutable contract.
- Protected-file SHA-256 baseline saved outside the repository. Tests/builds use `/tmp/outlay-coverage`, copied from tracked source without environment files. No real contracts will be deployed and no wallet transaction will be sent.
- Resume reconciliation: `main` and published GitHub main both remain at `8cd03ca`; authentication succeeds. The previously recorded `/tmp/outlay-coverage` directory is absent, and no completed coverage run is recorded. Recreate an isolated source copy and protected-file baseline before validation; preserve the existing local test drafts and excluded files.
- Resumed local coverage passes: isolated `forge test --offline -vv` reports 56 passed, 0 failed/skipped; six fuzz tests each run 512 cases and three invariants each run 128 campaigns × 64 calls with no handler reverts. Canonical-USDG fork, reproducible deployment verifier, final documentation and publication remain pending.
- Canonical fork validation passes all ten USDG tests at the live RPC snapshot, including unit transfers, full refund, self-payee characterization, pause/freeze controls and atomic rollback. The fork profile also discovered 14 imported baseline tests; the npm command now explicitly selects `RobinhoodUSDGForkTest`. Local verifier compilation/ABI/runtime checks pass. Final expanded-suite rerun, verifier failure checks and published-chain verification remain pending.
- Final local suite now passes 57 tests (0 failed/skipped), including short malformed ERC20 returns and the artificial beyond-uint64 timestamp boundary. Nine verifier success/drift tests pass. Read-only verifier passes at Robinhood block `77497119`, hash `0x7ec96c68422ad75d308dc11ec4e4d3eb08c9665755cfb03d6d37a5c450d3e650`: fresh compilation, exact deployed input/runtime, canonical token, all three successful receipts, USDG/Outlay payment logs and closed zero-balance room. Pin the final fork run to this block; documentation and publication follow.
- Final fork run at block `77497119`: 10 passed, 0 failed/skipped. Final isolated `npm run check`: typecheck, 39 frontend tests, 9 model tests, 9 verifier tests and production build pass. `forge fmt --check` and `git diff --check` pass. The contract results log is `/tmp/outlay-coverage/contract-results.log`; the complete application check is `/tmp/outlay-coverage/check-results.log`.
- Added three contract suites and two helper files, `fork-test/Robinhood.t.sol`, the read-only `scripts/check-deployment.mjs` and its drift tests. Foundry config makes fuzz/invariant budgets explicit; npm exposes fork/verifier commands and includes offline verifier tests in `check`. README and AUDIT now show the completed eleven-claim matrix and qualify pooled backing/counter guarantees.
- Protected SHA-256 baseline and comparisons with `HEAD` confirm all seven contract/artifact/runtime/verification/proof files unchanged; the whole `src` tree is unchanged. No environment files or keys were read. No wallet sends, signatures or chain broadcasts occurred. `.env.example` and `scripts/prove-robinhood.mjs` remain excluded.
- R1 (issuer restrictions/pooled backing) and R2 (artificial counter-wrap boundary) remain disclosed. Tests characterize the retained release; they do not remove issuer controls or establish future token policy/keeper profitability.
- Coverage source commit `b1eafd13d4b06e4b057d26d0bca08d6678a046f7` is pushed and independently confirmed on GitHub main. Vercel Git-integrated production `dpl_Fhu49rBhZDqmxpLH2fqSDZY2kNie` is READY for that exact SHA and aliased to `https://outlay-theta.vercel.app/`. Live proof HTML, text, all three links and caveats exactly match the pre-push snapshot at 2026-10-01T16:13Z. A documentation-only handoff commit follows this verified source checkpoint. Only the two excluded pre-existing local files remain untracked. No required work remains; optional Blockscout badge/independent keeper economics are outside this completed scope.

## Wallet-page security fixes — 2026-10-01

- Reconciled `main` / `origin/main` at `340f0bf426b733eed79ed026b6ccdd60b8ddc27d`; GitHub authentication succeeds as `dmetagame`. The previous objective below is historical. Current user authorization is frontend fixes, audit update, and main push followed by live confirmation; no new contract deployment.
- The prior read-only audit remains in `docs/AUDIT.md`; user requested F1 severity Medium because selection requires pasting an address, wallet spender disclosure, and a finite room allowance. Added the preventing files under all five findings; contract verdict remains safe.
- `runtime.ts` pins the independently audited 4113-byte Robinhood runtime. Entered, stored, and wallet-deployed candidates must match `getCode`; unknown-chain runtime verification fails closed. Only chain-bound verified contracts reach wallet funding actions.
- Approve/open/settle/refund explicitly require receipt status success; reverted transactions keep links and show errors, without room refresh or payment proof. Payee validation rejects zero/sender/Outlay/USDG, gates Approve and opening, and USDG parsing rejects more than six fractional digits before rounding.
- Isolated typecheck, 39 Vitest tests in the existing files, nine supplemental model tests, unchanged 14 Foundry tests, and production build pass. Eleven local production browser scenarios pass: entered/stored impostors rejected; payee and precision gates; errors and links for four reverted paths; visible wallet rejection; successful approve/open/settle; exact published proof snapshot. All wallet sends are intercepted. Source commit `ffd5a9acf9913c2032fe16aa7aa66591c0634631` is pushed and verified on remote main. Production `dpl_4vWRZH4hfU441KvetgLWQ3J8EcqK` is READY and aliased to the live domain; all eleven live browser scenarios pass as of 2026-10-01T00:08Z. Exact proof text and all three links match the pre-change snapshot. No required work remains. No environment files are copied into the isolated build.

## Four targeted desk fixes — 2026-09-30

- Reconciled workspace/main at `5b5b335390f810c7c01239c996b7c29d0d042f7e`, matching public `origin/main` via escalated `git ls-remote`. The previous workspace commit below was stale; `5b5b335` records the completed redesign deployment.
- Read the explicitly requested `/home/rouma/.agents/skills/frontend-design/SKILL.md`. The user's no-redesign requirement preserves the existing visual system and overrides new-design exploration.
- GitHub CLI inside the network sandbox initially reported an expired token; escalated `gh auth status` confirms valid authentication as `dmetagame`. Public main matches local main.
- Vercel project confirmed through MCP: `dmetagames-projects/outlay`, production domain `https://outlay-theta.vercel.app/`. Publish local source to production before the user-authorized main push.
- Preserve protected contract/artifact/verification/proof files byte-for-byte and exact proof numbers, links, and caveats. Build and browser verification use a temporary source copy without environment files. Pre-existing `.env.example` and `scripts/prove-robinhood.mjs` remain outside scope.
- Implemented only `src/routes/index.tsx`, `src/components/outlay/room-list.tsx`, `src/components/outlay/fund-usdg.tsx`, and supporting CSS: hero connects through wagmi, connected/no-contract action is disabled with its reason, absent/zero rooms render one sentence, all funding addresses shorten and copy the exact full address with status feedback, and both paid bar portions use the existing success accent.
- Isolated `npm run check` passed typecheck, seven Vitest tests, nine accounting-model tests, and production build. Protected-file and proof-component diff is empty.
- Local production browser checks passed light/dark at 1440px/390px with screenshots in `/tmp/outlay-desk-evidence/`: no overflow or page errors; all three copy controls copy full 42-character addresses; keyboard focus visible; wallet connection requests accounts; missing-contract action disabled; public contract reads real closed room 1 (remaining 0, settlements 1); ready-contract hero links to desk; simulated zero-room RPC result renders only one sentence. Exact proof text, external links, route descriptions, and bounty caveat match the pre-deployment live snapshot.
- Vercel CLI 62.0.0 published isolated tracked source to production deployment `dpl_EW3o2AD6GZvZtS4fPfzsQcdaGZTb`; deployment is READY and aliased to `https://outlay-theta.vercel.app/`. Source files match the workspace byte-for-byte.
- Live checks on 2026-09-30T22:40Z passed the same four viewport/theme cases, exact proof/link/caveat snapshot comparisons, full-address copying, keyboard focus, hero wallet connection, no-contract disabled reason, real closed-room read, ready-contract link, and zero-room empty state. Screenshots and results: `/tmp/outlay-desk-evidence/live-*`. No overflow or page errors. Main was pushed only after this live verification.
- Fixes commit `c1210325f08f2a61b491415d8048baa0cbce0b1f` was then pushed to `origin/main` and verified with `git ls-remote`. Git-integrated production deployment `dpl_3nZzoXrvZyadYBjANgjt83nYk9bE` is READY for that exact SHA; post-push public HTML retains the fixes and checked CSS bundle. This handoff update follows the source commit on main. No remaining task blockers or required actions.

## Completed redesign — 2026-09-29

- Starting main: `4e8770748a8770788cc23a7afda9345e75b9ef56`. User approved using installed frontend/design skills with MystiqueMide's documented product designs after the installation record confirmed his 25 installed skills do not contain a general visual system.
- Direction and applied skill paths are recorded in `docs/DESIGN.md`: Swiss typography/palette/grid, product-specific settlement receipt and operator console, preserved canonical funding routes and wallet calls.
- Read the installed design inventory and relevant design-system instructions before CSS. More specific product/frontend guidance and the user's explicit constraints override inapplicable presentation, framework, and branded examples.
- GitHub CLI authentication now succeeds as `dmetagame`; HTTPS origin remains unchanged. Existing untracked proof script and `.env.example` are outside this change. No `.env` reads or blockchain broadcasts are part of this task.
- Implemented self-hosted IBM Plex fonts, a payment receipt hero, horizontal contract setup, payout-led composer beside the settlement queue, and full-width funding routes. Light/dark modes, native disclosures/radios, visible focus, and 48px actions follow the recorded system.
- Preserved deploy/approve/open/settle/refund calls and exact proof links. Browser deployment normalizes only the existing duplicate `0x` text prefix; normalized creation data plus constructor was compared byte-for-byte with the public deployment input. Protected artifact/contract/verification files remain unchanged.
- Local production browser checks: 1440px desktop, 390px and 320px mobile have no overflow; fonts load; keyboard focus is visible; invalid payee and recurring 3-period total (0.33 USDG) render correctly. The existing public contract loads room 1 as closed, settlements 1, remaining 0. No page errors. Both settlement and Sourcify URLs returned HTTP 200.
- Isolated `npm run check` passed typecheck, seven Vitest tests, nine model tests, and production build. Final copy refinements passed the same check; native disclosure keyboard activation also passed. Redesign commit `17280c9` was pushed to main and confirmed on the live site.
- Production: `https://outlay-theta.vercel.app/` serves the new hero, receipt, console, self-hosted fonts, exact settlement/Sourcify links, and both proof caveats. Desktop and 390px live browser checks show no overflow or page errors; deploy control and Arbitrum One warning remain visible.
- `.env` remains ignored and absent from Git status/tracked files. Only the pre-existing `.env.example` and proof script remain untracked. No private key or environment file was read or committed during this redesign.

## Workspace and boundaries

- Repository: `https://github.com/dmetagame/outlay`; worktree: `/home/rouma/outlay-proof/outlay`; branch: `main`.
- Current coverage source checkpoint: `b1eafd13d4b06e4b057d26d0bca08d6678a046f7`, verified on GitHub main and production on 2026-10-01; this final documentation-only handoff follows it. Coverage session starting main: `8cd03ca30c5ea808158e0ef026568d120390207a`.
- Current published wallet-fixes/source commit: `ffd5a9acf9913c2032fe16aa7aa66591c0634631`, verified on `origin/main` and live production on 2026-10-01; a documentation-only handoff commit follows it. Wallet session starting commit: `340f0bf426b733eed79ed026b6ccdd60b8ddc27d`. Earlier desk-fixes source commit: `c1210325f08f2a61b491415d8048baa0cbce0b1f`. Session starting desk/documentation commit: `5b5b335390f810c7c01239c996b7c29d0d042f7e`. Original application/proof commit: `bb4ad4dee4f5f5c657dc8c79cf28d7b6566bd90e`.
- Starting commit: `e85f81f4ca65c79136dbdb7869af10ab2e1a37a3`, confirmed on `origin/main` before edits.
- Protected: `contracts/Outlay.sol`, committed `src/lib/outlay/artifact.ts`, and deployed bytecode. Do not change or regenerate them for this publication.
- Current user authorizes creating the Outlay demo video. Prior audit verification is complete. Existing main-push authorization and this workspace's checkpoint policy continue to apply. No new contract deployment or blockchain transactions are authorized.
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
- GitHub CLI authentication succeeds as `dmetagame` as of this redesign. Public main already contains the payment proof and corrected README.
- Arbitrum One's canonical-USDG DEX funding route was not found in earlier checks. Existing-holder-only disclosure remains.
- Vercel CLI previously lacked authorization; deployment uses the existing Git integration.

## Earlier proof publication result

- `https://outlay-theta.vercel.app/` serves the new proof strip through the existing Git/Vercel integration. HTTP HTML and a live browser both show the full deployed address, exact settlement URL, and exact Sourcify URL.
- Live browser at 390px: no horizontal overflow or page errors; wallet deploy control remains present; the sender-settled and incomplete-Blockscout caveats are visible.
- Only six public docs/proof/UI files were committed. `.env` is absent from Git status, tracked files, and staging; no private key values were included. Contract, artifact, and standard JSON remain identical to the starting commit.
- Publication is complete. Optional later work: obtain a Blockscout badge when compiler support/API access permit; no repeat payment or deployment is needed.

## Change Log

| Timestamp | Session/agent | Event | Result |
| --- | --- | --- | --- |
| 2026-10-01T21:55Z | Codex | Outlay demo published and verified | `d9f90c4` pushed/confirmed; public MP4 SHA-256 and SRT match local files. 2:45 1080p narrated/captioned demo, thumbnail and editable sources delivered. Protected/application files unchanged; no signatures/broadcasts. Video scope complete. |
| 2026-10-01T21:51Z | Codex | Final demo export verified | 2:45 1080p/30 H.264/AAC MP4; full decode, fast start, eight encoded end states and caption/audio timing pass. SHA-256 recorded above. Final deliverable publication follows; application and protected files unchanged. |
| 2026-10-01T21:29Z | Codex | Demo composition and browser capture checkpoint | `b4fcb70` is pushed/verified; ten-scene 1080p narration/captions project is complete. Corrected scene ending after first encoded review; seven screenshot/held-frame comparisons pass. Final export/publication pending; no broadcasts or protected-file changes. |
| 2026-10-01T16:13Z | Codex | Audit coverage publication confirmed | `b1eafd1` pushed and independently verified on GitHub main; Vercel production READY for exact SHA; live proof text/links/caveats equal pre-push HTML. Protected files unchanged; no signatures/broadcasts. Scope complete. |
| 2026-10-01T15:56Z | Codex | Remaining audit verification completed | 57 local EVM tests, 10 canonical-USDG fork tests at block 77497119, 9 verifier tests, typecheck/frontend/model/build and formatting checks pass. Read-only chain verifier matches published build/payment. All protected files unchanged; commit/push and production confirmation follow. |
| 2026-10-01T00:08Z | Codex | Wallet-page fixes published and verified | `ffd5a9a` pushed to main; production READY for exact SHA; 39 Vitest + 9 model + 14 Foundry tests, typecheck/build, eleven local/live browser scenarios pass. Protected files and proof snapshots unchanged; no broadcasts. |
| 2026-09-30T22:40:46Z | Codex | Four targeted fixes deployed before main push | Typecheck, 16 tests, production build, local and live light/dark at 1440px/390px pass; proof text/links/caveats and protected files unchanged. Main commit/push is next. |
| 2026-09-30T22:42Z | Codex | Main publication confirmed after live verification | `c121032` pushed and verified on GitHub; Git-integrated production READY for the same SHA and post-push live HTML preserves fixes. Pre-existing untracked files remain untouched. |
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

| 2026-09-29 | Codex | Settlement desk redesign published | `17280c9` pushed to main; Git-integrated Vercel serves the redesigned page. Typecheck, 16 tests, production build, desktop/mobile/dark-mode checks, real room read, keyboard focus, and proof-link checks passed. Protected contract/artifact/verification files unchanged. |

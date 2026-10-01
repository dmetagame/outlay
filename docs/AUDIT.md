**Verdict: The deployed Robinhood contract is safe to leave in place.** Its creation input and runtime independently match the committed build, its sole room is closed with zero remaining, and the published payout and bounty are corroborated by successful receipts and USDG Transfer logs. The five website findings below are addressed by runtime verification, explicit successful-receipt checks, and stricter input validation. The deployed contract, uint32 settlement counter, artifact, verification JSON, and published proof remain unchanged.

Audited revision: `origin/main` / `340f0bf426b733eed79ed026b6ccdd60b8ddc27d`. Both local references resolved to that commit. Audit date: 1 October 2026, Africa/Lagos; RPC snapshot: 30 September 2026 at `22:57:03.105Z`, block **76891124** (`0x49543f4`). Scope includes `contracts/Outlay.sol`, `test/Outlay.t.sol`, `verification/`, the committed browser artifact, `src/components/outlay`, `src/lib/outlay`, the wallet path, `proof/PROOF.md`, `README.md`, [the live site](https://outlay-theta.vercel.app/), and the three published transactions.

## Method and boundaries

Applied the installed audit/report workflow in `~/.agents/skills/audit/SKILL.md` and the boundary-review standards in `~/.agents/skills/cursor-thermo-nuclear-code-quality-review/SKILL.md`, with the requested evidence and severity format taking precedence. No design skill was used. Theme and viewport appearance were outside this audit.

Built and tested an isolated copy of the exact committed files. The Foundry suite passed **14 tests, 0 failures, 0 skipped** using `forge test --offline -vv`; no missing tests were added. Type checking, the seven frontend unit tests, nine supplemental accounting-model tests, and the production build also passed. Model tests are not substituted for EVM coverage.

Browser checks ran against both that production build and the live page. For adversarial scenarios, an injected fixture wallet intercepted every send request, and browser RPC responses were controlled fixtures. No signatures, private keys, or real broadcasts were used. These scenarios prove frontend behavior, not that the fixture address is a deployed attacker contract. Actual chain evidence below came separately from read-only RPC calls.

The original audit added only this report, without source changes, deployment, broadcast, push, or commit. The subsequent website remediation changes frontend source and existing Vitest tests under the user's explicit main-publication authorization. No `.env` contents or private keys were read, and no contract deployment or blockchain broadcast is part of the remediation.

## Confirmed defects from the audit, with website fixes

No critical finding was established. Historical evidence and locations below refer to the audited revision. Website fixes follow each finding; the deployed contract remains safe and unchanged. Findings follow in severity order.

### F1. Existing-contract selection can authorize an impostor spender

- **Severity:** Medium, revised from High because the user must paste the address, the wallet shows the spender, and the allowance is the typed room amount rather than unlimited.
- **Location:** `src/components/outlay/deploy-card.tsx:68`, `src/components/outlay/deploy-card.tsx:77`, `src/lib/outlay/storage.ts:10`, `src/routes/index.tsx:25`, `src/components/outlay/open-room.tsx:99`.
- **What happens:** The manual address check asks only whether `usdg()` returns the selected network's canonical token. An unrelated contract can return that address without implementing Outlay's accounting. The next approval gives that contract permission to transfer the approved USDG from the connected wallet. The exposure is the granted allowance, not an unlimited approval. Stored addresses bypass even the token check: any stored value beginning with `0x` becomes the active contract on load.
- **How proved:** On both source build and live page, a controlled contract response at `0x1111111111111111111111111111111111111111` returned canonical Robinhood USDG. The page displayed **Contract ready**, performed **zero `eth_getCode` requests**, and emitted an intercepted `approve(impostor, 110000)` request to the canonical USDG address. A second fixture with a wrong `usdg()` return was correctly rejected through manual selection, but the same address preloaded under `outlay.contract.4663` reached **Fund and open room** without any `usdg()` read. Source at the locations above confirms both routes.
- **Deployed Robinhood contract affected:** Its verified runtime is not an impostor and does not expose this theft path. Users of the live frontend who select an impostor address are affected; the existing-contract check does not establish its claimed identity. Merely changing local storage requires local/browser access and is not itself a demonstrated remote compromise.
- **Smallest fix:** Verify the selected chain's expected Outlay runtime, including its immutable canonical token, before enabling approval or using either entered or stored addresses.
- **Website fix:** `src/lib/outlay/runtime.ts` and `src/components/outlay/deploy-card.tsx` require exact `getCode` equality with the pinned published Robinhood runtime; `src/routes/index.tsx` revalidates storage, and `src/components/outlay/open-room.tsx` accepts only a chain-bound verified contract. Chains without known runtime code are rejected.

### F2. Reverted transactions can produce payment proof or disappear without a failure message

- **Severity:** Medium.
- **Location:** `src/components/outlay/room-list.tsx:147`, `src/components/outlay/room-list.tsx:154`, `src/components/outlay/room-list.tsx:173`, `src/components/outlay/room-list.tsx:214`, `src/components/outlay/open-room.tsx:34`, `src/components/outlay/open-room.tsx:190`, `src/components/outlay/deploy-card.tsx:34`, `src/components/outlay/deploy-card.tsx:119`.
- **What happens:** Settlement and refund await the public client's receipt but never check its status. A mined revert can therefore populate settlement proof or a refund link without a failure message. Approval, opening, and deployment use Wagmi's receipt hook, but the components render only their local submission errors and ignore receipt-hook errors.
- **How proved:** On both source build and live page, the settlement fixture returned a receipt with `status: "0x0"` and identical before/after balances. The page nevertheless rendered **Payee balance changed onchain**, a `(+0)` delta, and a settlement link, with no alert. A reverted refund displayed its transaction link without an alert. Reverted approval and opening receipts were polled, then the actions became available again without an alert. Deployment's missing receipt-error display is established by source; its revert was not separately exercised in the browser. The installed Viem implementation resolves an available receipt irrespective of status (`node_modules/viem/actions/public/waitForTransactionReceipt.ts:194`); Wagmi's wrapper throws on a reverted receipt (`node_modules/wagmi/node_modules/@wagmi/core/src/actions/waitForTransactionReceipt.ts:60`). Consequently, approval/opening are **not** incorrectly counted as successful by the hook; their failure is simply hidden.
- **Deployed Robinhood contract affected:** No contract accounting defect follows from this UI behavior. Its actual published settlement succeeded. Future failed transactions against it can be misreported by the live frontend.
- **Smallest fix:** Require a successful receipt before presenting settlement/refund evidence, and render mined-revert errors from every receipt hook.
- **Website fix:** `src/lib/outlay/transactions.ts`, `src/components/outlay/open-room.tsx`, and `src/components/outlay/room-list.tsx` require receipt status `success` before callbacks or proof, preserve transaction links on revert, and display revert and wallet-rejection errors.

### F3. Choosing Outlay itself as payee strands the payout

- **Severity:** Low; sender configuration error with permanent loss of access to that payout.
- **Location:** `contracts/Outlay.sol:86`, `contracts/Outlay.sol:123`, `contracts/Outlay.sol:135`, `contracts/Outlay.sol:140`, `contracts/Outlay.sol:151`; deployed USDG implementation source `contracts/ClaimableRewardsBase.sol:490` (source provenance in the USDG section below).
- **What happens:** `openRoom` rejects the zero address and the sender but allows `payee == address(this)`. USDG accepts a transfer from Outlay to itself without changing balances. Settlement still charges the room's amount and bounty, pays the bounty, and closes a one-shot room. The payout then remains as unallocated tokens in Outlay; closed-room refund is prohibited and there is no sweep or recovery function.
- **How proved:** This follows directly from the Outlay checks and state updates, plus the current USDG implementation's explicit successful self-transfer branch at lines 490–493. A one-shot room funded with `110000`, amount `100000`, and bounty `10000` would close with room remaining zero while `100000` stays in the contract. At the deployed address, a read-only `openRoom(Outlay,100000,10000,110000,1,0)` call from the published sender passed argument checks and reached the token pull, which returned `TransferFailed`, rather than `BadArgs`. That call did not create a room; the loss mechanism is source evidence, not a claimed live loss.
- **Deployed Robinhood contract affected:** The same edge case is available for future rooms. Published room 1 used a different payee and is unaffected; RPC currently reports Outlay's USDG balance as zero.
- **Smallest fix:** Reject the selected Outlay and USDG addresses before approval or opening, leaving the verified deployment unchanged.
- **Website fix:** `src/lib/outlay/room-form.ts` and `src/components/outlay/open-room.tsx` reject the selected Outlay address and canonical USDG token as payee before approval or opening; the verified deployed contract is retained.

### F4. USDG inputs beyond six decimal places are silently rounded

- **Severity:** Low.
- **Location:** `src/lib/outlay/format.ts:6`, `src/components/outlay/open-room.tsx:41`, `src/components/outlay/open-room.tsx:119`.
- **What happens:** The parser uses six decimals but does not reject extra fractional digits. The installed parser rounds them, so the submitted payout can differ from the entered amount. The lock preview reflects the rounded result without identifying it as a rounding adjustment.
- **How proved:** On both source build and live page, entering `0.1000009` generated an intercepted `openRoom` request with amount **100001** base units, meaning **0.100001 USDG**. A separate parser check returned `0` for `0.0000004` and `1` for `0.0000006`. RPC `decimals()` independently returned **6** for deployed canonical USDG. Default `0.10` and `0.01` inputs encode correctly.
- **Deployed Robinhood contract affected:** It accepts integer base units correctly; this is a frontend interpretation defect. The published payment amounts are unaffected.
- **Smallest fix:** Reject payout and bounty inputs with more than six fractional digits before parsing or requesting approval.
- **Website fix:** `src/lib/outlay/format.ts` rejects more than six fractional digits before `parseUnits`; `src/components/outlay/open-room.tsx` displays that USDG allows at most six decimal places.

### F5. Payee validation does not gate approval and accepts the zero address

- **Severity:** Low.
- **Location:** `src/lib/outlay/room-form.ts:3`, `src/components/outlay/open-room.tsx:92`, `src/components/outlay/open-room.tsx:109`, `src/components/outlay/open-room.tsx:178`.
- **What happens:** Approval can be requested with an empty, invalid, or sender-equal payee because its handler and button omit `payeeError`. The validator also regards the zero address as valid, so opening is enabled for a value the real contract rejects. The sender-equal check does correctly block the opening transaction; it is more than a label.
- **How proved:** On both source build and live page, the sender-equal message was visible while **Approve 0.11 USDG** remained enabled and emitted the intercepted approval. With allowance already present, sender-equal payee disabled **Fund and open room**, but replacing it with the zero address enabled that action. Actual read-only `openRoom` calls with the zero address or sender as payee returned `BadArgs` from the deployed contract. Those guards prevent an invalid funded room; an actual wallet may surface the rejection during estimation rather than mining a revert.
- **Deployed Robinhood contract affected:** Its payee guards remain effective. Frontend users can authorize an unnecessary allowance or encounter a preventable rejected opening request.
- **Smallest fix:** Reject the zero address and require valid payee checks in both approval and opening handlers and controls.
- **Website fix:** `src/lib/outlay/room-form.ts` rejects zero, sender, selected Outlay, and USDG-token payees; `src/components/outlay/open-room.tsx` gates both Approve and openRoom on the same error.

## Independent deployed-build and receipt evidence

All state queries in this section use [Robinhood RPC](https://rpc.mainnet.chain.robinhood.com), chain **4663**, and block `0x49543f4` unless otherwise stated. `eth_chainId` returned `0x1237`. Outlay is `0xe1b5d2cf63c43103455abd802b6b241b959a530c`; canonical USDG is `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`.

### Build comparison

Compiled the committed `verification/standard-json-input.json` directly with native Solidity **0.8.37+commit.f401782d**, optimizer enabled with **200** runs, **Cancun**, and **viaIR false**. Its embedded Solidity source exactly equals `contracts/Outlay.sol`. All 19 browser ABI entries also equal the compiler ABI; array ordering is immaterial.

| Comparison | Independently observed result |
| --- | --- |
| Fresh creation bytecode versus committed artifact bytes | Exact equality after normalizing the artifact's disclosed duplicated text prefix `0x0x` |
| Deployment `eth_getTransactionByHash.input` versus artifact + constructor argument | Exact equality, **4316 bytes** |
| Deployment input versus fresh compiler creation bytecode + constructor argument | Exact equality |
| `eth_getCode(Outlay,0x49543f4)` versus fresh compiled runtime | Exact equality, **4113 bytes**, after applying the constructor's immutable token value |
| Constructor argument | `0000000000000000000000005fc5360d0400a0fd4f2af552add042d716f1d168` |
| Runtime immutable references | Compiler-reported 32-byte locations **815** and **3195**, both canonical USDG; no other substitutions or metadata stripping |
| Runtime Keccak-256 | `0x85a19056971ff2d270e7a32ee7ac27a47eb5969331914e6dd46f67206b732ee9` |
| Runtime SHA-256 | `2060855b3ce81a8d6a2d7cd37d827944cffbf1ea97581eb2f323a0205d62afb9` |
| Creation transaction input SHA-256 | `43bc99f6881bea6dfa45d75ea88463e5a70c671d1a470616158b389837de6a6b` |

All three committed constructor encodings match their pinned USDG addresses. [Sourcify's API](https://sourcify.dev/server/v2/contract/4663/0xe1b5d2cf63c43103455abd802b6b241b959a530c) separately returned `creationMatch: exact_match`, `runtimeMatch: exact_match`, and verification time `2026-09-29T15:32:34Z`. That is supporting evidence; it was not substituted for the comparisons above. There is no critical bytecode mismatch.

### Published receipts

`eth_getTransactionByHash`, `eth_getTransactionReceipt`, and their blocks were fetched for each full hash below. All receipts returned **status `0x1`**. Addresses and transfer values were decoded from the receipt logs, not inferred from the UI.

| Transaction | Block | Result |
| --- | ---: | --- |
| [Deploy `0xc0cd9fcba279c431dec9756b865994c127a3727fc2aedd77b400a7cfcef5e432`](https://robinhoodchain.blockscout.com/tx/0xc0cd9fcba279c431dec9756b865994c127a3727fc2aedd77b400a7cfcef5e432) | 75737751 | `contractAddress` is the published Outlay address; creation input matches the committed build and canonical constructor |
| [Open `0xfb921ebeccb21e342e4dee63f518da14ca721f9d1ecf94b46cb84c9d902e4633`](https://robinhoodchain.blockscout.com/tx/0xfb921ebeccb21e342e4dee63f518da14ca721f9d1ecf94b46cb84c9d902e4633) | 75737838 | USDG Transfer from sender to Outlay **110000**; RoomOpened id **1**, amount **100000**, bounty **10000**, funded **110000**, nextRunAt **1790693157**, interval **0** |
| [Settle `0x8463c5c7a56df5781d443981558f3149f8199740b6aeb6569f8a60059c8cdb12`](https://robinhoodchain.blockscout.com/tx/0x8463c5c7a56df5781d443981558f3149f8199740b6aeb6569f8a60059c8cdb12) | 75738431 | USDG Transfer Outlay → payee **100000**, Outlay → caller **10000**; Settled id **1**, nextRunAt **0**, stillActive **false** |

The sender and all three transaction senders are `0xee3ea6f858ae84dd6959f241dfc257a2f8fa3f53`; the payee is `0x4157e84fa929f797cc244d28fd9d48b4c6d43df0`. Settlement block timestamp **1790693161** is after due time **1790693157**. Settlement receipt gasUsed **99970** × effectiveGasPrice **20850000 wei** equals **0.0000020843745 ETH**, matching `proof/PROOF.md:49`.

Current `eth_call` results: `usdg()` is canonical USDG; `roomCount()` is **1**; `getRoom(1)` returns amount **100000**, bounty **10000**, remaining **0**, settlements **1**, interval **0**, active **false**, stored nextRunAt **1790693157**. The close event's nextRunAt **0** is its emitted local value; the closed room's old stored timestamp is harmless. USDG `balanceOf(Outlay)` returns **0**.

**Historical balance limitation:** Attempts to repeat `balanceOf` at blocks **75737837**, **75737838**, and **75738431** returned RPC error **-32000**, `historical state … is not available`. The original absolute sender/payee balance snapshots in `proof/PROOF.md:41` could not be independently reproduced through this RPC. This is an audit limitation, not a finding that those snapshots are false. Successful transfer receipts, current room state, and current zero Outlay balance corroborate the payment.

### Canonical USDG behavior, checked from deployed code

Paxos's [mainnet address list](https://docs.paxos.com/guides/stablecoin/usdg/mainnet) names the pinned Robinhood and Arbitrum tokens; its [testnet list](https://docs.paxos.com/guides/stablecoin/usdg/testnet) names the pinned Arbitrum Sepolia token. On Robinhood, token `decimals()` returned **6**, `symbol()` returned **USDG**, and `name()` returned **Global Dollar**. The name is not evidence of transfer behavior.

`eth_getCode(USDG,0x49543f4)` returned a **170-byte proxy runtime**. `eth_getStorageAt` at EIP-1967 implementation slot `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc` returned `0x00000000000000000000000068184c449e1a8f34fa18d289737129fd27b66f8f`. Fetched [that implementation's Sourcify sources](https://sourcify.dev/server/v2/contract/4663/0x68184c449e1a8f34fa18d289737129fd27b66f8f?fields=all) and independently matched its RPC code to Sourcify's recorded onchain bytecode. Its code Keccak-256 is `0x3a551ac5c744af57e68a1d1431ac403c0f516ffd7d224a75746aee11fc4f3baf`. Sourcify reports a source **match**, not an exact metadata match, for this token implementation; this is separate from Outlay's exact match.

The following file:line references identify files within that published source bundle:

- **No transfer fee found in the present transfer path:** `contracts/PaxosTokenClaimableRewards.sol:142` and `:164` invoke ordinary transfer logic; `contracts/ClaimableRewardsBase.sol:499` subtracts the requested value and adds the same value to the recipient. Ordinary and payout-group paths persist these resulting balances, including at `:505`, `:530`, `:560`, `:604`, and `:617`. The published Outlay funding and payout logs are consistent with unit-for-unit transfers. A fresh real transfer was not broadcast.
- **No automatic negative balance rebase found:** `contracts/PaxosTokenClaimableRewards.sol:153` calls `_getBalance`; `contracts/BaseStorageV3.sol:147` returns stored `balanceData[account].balance`. Claimable reward/share calculations do not make `balanceOf` an automatically rebasing balance. This conclusion concerns the inspected current implementation, not every possible future issuer change.
- **Blacklisting and pause checks are present:** `contracts/ClaimableRewardsBase.sol:475` rejects a frozen sender or recipient; `:82` reads global pause state, and token transfer functions use `whenNotPaused`. RPC returned `paused() == false` and `isFrozen(Outlay) == false`. `getFacet` for `freeze(address)` and `pause()` returned admin facet `0x58cab81e3d8468A0e90df8cBfacb34535e1DE942`. This is an issuer-controlled transfer dependency, not a current observed freeze.
- **Token behavior is administratively mutable:** `contracts/PaxosTokenClaimableRewards.sol:577` lets `DEFAULT_ADMIN_ROLE` replace selector facets; `:604` delegates fallback calls to them. This control belongs to USDG, not Outlay.

The same admin facet was returned for `wipeFrozenAddress(address)`, but its source was unavailable at the queried Sourcify endpoint (404). A selector name alone does not prove its balance effects; no finding here claims a current wipe, fee, or negative rebase.

## Residual risks, distinct from confirmed defects

### R1. Room accounting assumes unit transfers and continued USDG transfer availability

- **Severity:** Medium, conditional token/integration risk; no current accounting deficit demonstrated.
- **Location:** `contracts/Outlay.sol:97`, `contracts/Outlay.sol:104`, `contracts/Outlay.sol:140`, `contracts/Outlay.sol:176`; USDG implementation source `contracts/ClaimableRewardsBase.sol:475` and `contracts/PaxosTokenClaimableRewards.sol:577`; RPC token observations above.
- **What could happen:** Outlay records requested funding without checking the received balance delta. With a fee-on-transfer token it can record more remaining than it receives; a later negative balance change could also leave pooled assets below aggregate room liabilities. Per-room storage is isolated, but actual tokens are held at one address. Under a shortfall, successful withdrawal from one room can leave another unable to withdraw. Independently, USDG freezing an address or pausing transfers can block settlement and refund; a revert rolls back Outlay's state rather than allowing a partial payout.
- **Evidence and limits:** The funding and transfer code proves the accounting assumption. Current canonical USDG transfer and stored-balance code showed no fee or automatic negative rebase; blacklisting/pause checks and mutable admin facets are established above. There is no demonstrated fee, shortfall, freeze, or cross-room loss at the audited deployment. The constructor also rejects only zero (`contracts/Outlay.sol:65`); a different deployment with an EOA token could accept successful empty low-level calls without moving tokens. That generic configuration is not this deployment, whose canonical token has code and was independently checked.
- **Deployed Robinhood contract affected:** Future funded rooms inherit canonical USDG's transfer-availability and issuer-control dependencies. Its current closed, zero-balance room has no outstanding liability. Do not describe canonical USDG as currently fee-on-transfer or negatively rebasing on this evidence.
- **Smallest mitigation:** For future versions, reject tokens without code and require the funding balance delta to equal the credited amount, while explicitly documenting that USDG issuer restrictions can still block withdrawals.

### R2. The unchecked settlement counter weakens the lifetime refund guarantee

- **Severity:** Informational, remote lifetime boundary.
- **Location:** `contracts/Outlay.sol:22`, `contracts/Outlay.sol:124`, `contracts/Outlay.sol:151`.
- **What could happen:** The `uint32` count wraps to zero after **2^32 settlements**. A still-active recurring room with sufficient funding could then pass the `settlements != 0` refund guard despite having paid previously.
- **Evidence and limits:** This is the deterministic consequence of the unchecked increment and zero-based refund guard. With the smallest positive interval of one second, reaching it requires approximately **136 years** and over **4.29 billion successful transactions**; no practical exploit or wrapped live room was demonstrated. The expanded `testCounterWrapCharacterizesRemoteRefundBoundary` reproduces the wrap by explicitly setting the local room counter to `uint32.max`; it does not simulate billions of real payments.
- **Deployed Robinhood contract affected:** The code contains this theoretical boundary, but its only room is a closed one-shot with settlements **1** and cannot reach it. New very long-lived recurring rooms would carry it.
- **Theoretical mitigation:** Authorize refunds with an irreversible paid flag rather than a counter that can wrap to zero.
- **Decision:** No counter change is planned or implemented; wrapping is not practical, and preserving the verified deployment takes precedence.

## Historical coverage of the eleven claims at the audited revision

All named Foundry tests below passed. Test locations refer to `test/Outlay.t.sol` at the audited revision. This table preserves the gaps identified by the original audit; the completed coverage table below records their subsequent verification. A passing test proves the exercised case, not all possible variants of a claim.

| # | Claim and audit result | Existing Foundry evidence | Coverage gaps |
| --- | --- | --- | --- |
| 1 | Positive amount/bounty and `uint96` sum bound hold: `contracts/Outlay.sol:69` adds in `uint256` and rejects a sum above `uint96.max`. Actual RPC `costOf(max,1)` returned `BadArgs`; `costOf(max-1,1)` returned **79228162514264337593543950335**. | `testOpenRoomRejectsZeroAmount` at **128**; `testOpenRoomRejectsZeroBounty` at **122**; `testOpenRoomRejectsUnderfunding` at **140**. | No Foundry sum-overflow or exact-maximum test, and no direct `costOf` boundary test. RPC boundary checks supplement, but do not fill, test coverage. |
| 2 | Zero and sender-equal payees are rejected at `contracts/Outlay.sol:86`; both deployed RPC calls returned `BadArgs`. **The settler may be the payee**: `settle` has no caller/payee exclusion and pays both legs to that address. This is permissionless intended behavior. Outlay itself as payee is F3. | `testOpenRoomRejectsSenderAsPayee` at **134**. | No zero-payee test, no payee-as-settler balance test, and no Outlay-as-payee test. |
| 3 | Each room's `remaining` is separate, and normal backed unit transfers preserve that isolation. The unconditional statement that a token loss in one room cannot impair another is broader than the code: pooled backing shortfalls are R1. | `testRoomsCannotShareRemaining` at **167** checks another room's remaining and backing after a normal settlement. | No fee, negative balance change, token shortfall, or freeze scenario; no adversarial test establishing physical segregation under token loss. |
| 4 | `contracts/Outlay.sol:140` pays the payee, then caller, then leftover to sender only on closure. Recurring rooms retain enough for the next cost; one-shot or insufficient-next-period rooms return the remainder. Token failure reverts all legs. | `testSettlePaysPayeeAndSettlerBalances` at **155**; `testOneShotReturnsLeftoverInSameSettlement` at **195**; `testIntervalAdvancesFromSettlementTime` at **182** checks retained recurring balance. | No final recurring settlement with leftover; no failing second/third token leg proving rollback; no test of all three recipients' balances for a recurring close. |
| 5 | One-shot rooms become inactive and cannot settle twice. Recurring due time is settlement timestamp plus interval, with `NotDue` on an early second call. Deployed `settle(1)` now returns **Inactive**. | `testOneShotReturnsLeftoverInSameSettlement` at **195** asserts closure; `testIntervalAdvancesFromSettlementTime` at **182** proves late settlement **145 → 205**; `testSecondRecurringSettlementRevertsUntilNextInterval` at **236**; `testPrematureSettleReverts` at **146**. | No direct Foundry second-call test for a closed one-shot; no successful second recurring settlement at the exact new due time. |
| 6 | Refund checks sender, then count, then active state; before payment it returns full remaining and closes. Actual deployed refund by sender returned **AlreadyPaid**, and by payee **NotSender**. The lifetime counter-wrap exception is R2. | `testRefundBeforeSettlementReturnsTheWholeRoom` at **221**; `testRefundAfterSettlementRevertsAlreadyPaid` at **210**. | No wrong-sender refund test, second refund/Inactive test, active-recurring refund after its first payout, or count-wrap boundary. |
| 7 | All three mutating entry points share `nonReentrant` at `contracts/Outlay.sol:57`; room state is written before `_pull` or `_push`. Token callbacks cannot enter any of these paths while locked. | `testReentrantTokenCannotDoublePay` at **270**, using the token callback at **89**, proves transfer → same-room settle is blocked. | No callback during open's `transferFrom`, during refund, into a different room, or across open/settle/refund; no explicit state/lock rollback test after token failure. |
| 8 | `_call` at `contracts/Outlay.sol:175` accepts true or empty return, rejects false, and rejects unsuccessful low-level calls. Malformed nonempty data also reverts during decode; it is not treated as true. | Bool-return token used by normal tests; `testSupportsTokenWithNoReturnData` at **253** exercises opening and settlement. | No false-return, malformed-return, or reverting-token test; no no-return refund test. False rejection is source-reviewed, not directly tested. |
| 9 | Fee-on-transfer or negative balance changes can make accounting exceed backing because no funding delta is checked. Canonical Robinhood USDG currently has exact-value transfer logic and stored balances, but frozen-address and pause checks; see deployed-code evidence and R1. | **No Foundry test** uses actual canonical USDG or fee/rebase/blacklist behavior. | No fee/rebase/freeze cases, canonical-token fork test, or balance-delta invariant. The token doubles establish return/reentry behavior only. |
| 10 | Nonzero past due times are accepted and immediately due after successful funding; zero due is rejected. A huge `uint32` interval is valid and advances from the current settlement time, potentially locking the next period for about 136 years. Funding above one cost is intentional: one-shot returns extra; recurring retains full periods and closes when less than another cost remains. | `testIntervalAdvancesFromSettlementTime` at **182**, `testOneShotReturnsLeftoverInSameSettlement` at **195**, and multi-period tests at **167**, **221**, **236** cover excess funding and schedules. | No zero-due, genuinely past-due opening, maximum-interval, timestamp-width boundary, or final partial-recurring-period test. RPC past-due and max-interval openings passed argument checks and reached the token pull, which reverted; they were not successful openings. |
| 11 | Outlay contains no admin, upgrade, pause, or sweep path. Full source/ABI review and independent deployed runtime equality establish this for this address. USDG's separate admin controls are not Outlay admin controls. | **No dedicated Foundry test.** | No explicit ABI/admin-surface assertion. This is a static/runtime property, not demonstrated by an ownership test. |

## Frontend and live-site checks that passed

- `src/lib/outlay/chains.ts:4` pins all three addresses to their selected chain; they match the current Paxos primary address lists. Unsupported chains have no canonical token and opening/deployment handlers reject them. Manual existing-contract selection rejects a wrong token, although F1 documents the identity and stored-address gaps.
- Approval uses exactly `(amount + bounty) × funded periods`, via `src/components/outlay/open-room.tsx:52` and `:99`, rather than an unlimited value. The default browser request approved **110000** base units to the selected spender. Six-decimal base-unit conversion is correct for supported-precision inputs; F4 documents unsupported precision.
- `validatePayee` compares normalized addresses, and `openRoom` checks its result before calling the wallet (`src/lib/outlay/room-form.ts:6`, `src/components/outlay/open-room.tsx:109`). The sender-equal opening action was disabled on both builds. Approval and zero-payee exceptions are F5.
- Each funding copy control copied the full **42-character** address, not the displayed shortened text: Robinhood `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`, Arbitrum One `0x004B506865409877C9fA29bfb1ebA929984B9bbC`, and Arbitrum Sepolia `0xFFC95faa3d63Cde504a05B567C600B78C0b41892`. This was checked through the clipboard on source build and live page; source is `src/components/outlay/fund-usdg.tsx:129`. No checked control was unreachable.
- The live mainnet proof and `src/components/outlay/mainnet-proof.tsx:12` display **0.11 funded, 0.10 to payee, 0.01 to caller, closed, nothing remaining, block 75738431**. Those values agree with the actual receipt and current state. The actual sender-settler and incomplete Blockscout verification are explicitly disclosed at `:26`; the bounty note at `src/components/outlay/open-room.tsx:187` disclaims profitability.

## Already disclosed; not findings

1. **The demo settler was the sender.** `proof/PROOF.md:65`, `README.md:44`, and live proof disclose it; settlement transaction `from` and Settled log confirm it. Permissionless code does not establish an independently operated keeper.
2. **Blockscout has no claimed verified badge.** `proof/PROOF.md:66`, `README.md:45`, and live proof state verification is incomplete. Direct explorer API access returned a Cloudflare challenge during this audit; badge status was not inferred from the payment or Sourcify links. The previously recorded compiler-list limitation was not independently re-established through that blocked API.
3. **The 0.01 bounty proves payment, not profit after gas.** `README.md:24`, `proof/PROOF.md:49`, and the live bounty note make this distinction. The actual receipt establishes gas and payment but is not a profitability demonstration.
4. **The artifact's duplicated text prefix is normalized.** `proof/PROOF.md:19` discloses it, and `src/components/outlay/deploy-card.tsx:49` normalizes it. Independent byte comparisons passed; this is not a deployed bytecode mismatch.
5. **Arbitrum One liquidity and faucet constraints are disclosed.** `README.md:74` and `src/components/outlay/fund-usdg.tsx:68` restrict the Arbitrum One route to existing holders; `:85` notes faucet account/availability constraints. This audit did not establish a new liquidity quote or independently repeat the old quote. No finding assumes historical route evidence is a current fill guarantee.

## What was tried and could not be broken

- Actual RPC boundary calls rejected zero amount/bounty, an overflowing cost sum, zero/sender-equal payees, and zero due time; the exact maximum valid sum was accepted.
- The existing EVM tests preserved another normally backed room's remaining, blocked an early recurring payment and the exercised token reentry, and returned the full pre-payment refund and one-shot leftover.
- The deployed closed room rejected another settlement with `Inactive`, its sender's refund with `AlreadyPaid`, and another caller's refund with `NotSender`.
- Fresh compilation could not produce any difference in creation input or runtime after the required immutable constructor substitution. All three actual receipts agree with the published payment, chain, contract, participants, and gas arithmetic.
- Manual wrong-token selection, sender-equal opening, exact default approval amount, and full-address copy controls behaved as enforced in source and observed on the live page.

These successful checks do not erase the test gaps or token dependencies above. No unsupported allegation of missing funds, a hidden Outlay admin, or an unobserved live exploit is included.

## Website remediation validation — 1 October 2026

- Typecheck passed; the existing two Vitest files now contain **39 passing tests**, covering runtime identity, unknown chains, stored candidates, payee restrictions, exact room funding, six-decimal precision, successful/reverted receipt boundaries, and wallet-rejection messages. The nine supplemental model tests also pass.
- The unchanged Foundry suite passed **14 tests, 0 failures, 0 skipped**. The production build passed in an isolated directory without environment files.
- Contract, artifact, verification JSON, README, proof record, and mainnet-proof component are checked against their pre-change hashes. The pinned runtime was fetched again from the published address and matches the independently audited 4113 bytes.
- Local production browser checks passed all eleven scenarios: entered/stored impostors rejected, all payee gates and both precision fields enforced, four reverted receipt paths show errors and transaction links, wallet rejection remains visible, valid approve/open/settle still work, and proof text plus links equal the pre-change snapshot. Every wallet send was intercepted; no broadcast occurred.
- Live verification at **2026-10-01T00:08Z** passed the same eleven browser scenarios on `https://outlay-theta.vercel.app/`. Vercel production deployment `dpl_4vWRZH4hfU441KvetgLWQ3J8EcqK` is READY for source commit `ffd5a9acf9913c2032fe16aa7aa66591c0634631`, confirmed on remote main. The published contract address, settlement transaction, Sourcify exact-match link, sender-settled caveat, incomplete-Blockscout caveat, and all proof numbers match the original snapshot exactly. No contract deployment or blockchain broadcast occurred.

## Completed contract coverage — 1 October 2026

The expanded suite adds verification around the retained contract; it does not change or regenerate
the deployed contract, browser artifact, pinned runtime, verification JSON, settlement counter, or
published proof. Sources start from `8cd03ca30c5ea808158e0ef026568d120390207a`. Tests and production
checks run in `/tmp/outlay-coverage`, copied without environment files.

| # | Claim | Added evidence and remaining scope |
| --- | --- | --- |
| 1 | Positive amount/bounty and bounded cost | `OutlayBoundaries.t.sol`: invalid `costOf`/open, overflowing sums, exact `uint96.max` open/settle, and 512 fuzz cases of sum boundaries. |
| 2 | Payee restrictions and permissionless settlement | Zero-payee rejection, payee-as-caller receiving both legs, and direct self-payee loss characterization. The canonical fork reproduces self-payee behavior; the wallet prevents this input, while direct contract callers remain able to choose it. |
| 3 | Per-room accounting and pooled backing | Three stateful invariants check aggregate liabilities, recipient balances, funding conservation, closed-room state and refunds before payments with unit-transfer tokens. Fee-on-transfer and negative-balance doubles reproduce R1 cross-room impairment; physical token isolation is not claimed. |
| 4 | All payout legs and final closure | Final recurring settlement returns a partial period to the sender. Failure on payout, bounty or leftover rolls back room state, all recipient balances and token effects; each mode/leg is fuzzed. Transfer order is checked explicitly. |
| 5 | Due boundaries and one-shot finality | Repeated one-shot settlement reverts; successful second recurring settlement occurs exactly at the new due time; 512 fuzz cases check settlement-time scheduling and early rejection. |
| 6 | Refund authorization and payment guard | Wrong sender, second refund, unknown/refunded rooms, active recurring refund after payment, full no-return-token refund and retry after token failure. R2 is characterized using artificial local storage; the counter is retained. |
| 7 | Effects before interactions and shared lock | Callbacks during pull, recurring/one-shot payout and refund observe updated room state and attempt open, same-room settle, refund and other-room settle. All four entries return `Reentrant`. Failed operations permit a later valid retry, establishing lock rollback. |
| 8 | ERC20 return handling and failure atomicity | True and empty returns succeed; false, invalid ABI bool, short return and reverting token fail. Fuzzed failures cover pulls, all three settlement legs and refund. No-return refund has a separate test. |
| 9 | Canonical USDG integration and issuer controls | Ten real-token local-fork tests check exact requested balance deltas, payout/bounty/leftover, full refund, stored balances across time warp, pause, frozen Outlay/payee/caller and atomic recovery/rollback. These are snapshot-local issuer simulations, not live freezes or assurances about future issuer policy. |
| 10 | Schedule/funding boundaries | Zero/past due, excess and partial-period funding, maximum interval, `uint64` addition-overflow rollback and explicit timestamp truncation beyond `uint64.max`. The latter two use artificial far-future timestamps and do not establish a present-day exploit. |
| 11 | No Outlay admin/upgrade/pause/sweep path | `scripts/check-deployment.mjs` checks the exact eight public ABI functions, only three mutating entries, no fallback/receive, all constructor encodings, fresh creation/runtime bytes, and equality with the actual deployed code. This is a compiled/static property rather than a simulated ownership test. |

Commands and observed results:

```bash
forge test --offline -vv
# 57 passed, 0 failed, 0 skipped; includes 6 fuzz tests × 512 cases.
# 3 invariants each: 128 runs × 64 calls = 8192 calls, 0 handler reverts.

npm run test:contracts:robinhood -- --offline --fork-block-number 77497119
# 10 passed, 0 failed, 0 skipped, only RobinhoodUSDGForkTest selected.

npm run test:deployment
# 9 passed: positive build match; changed source, settings, constructor,
# ABI/admin injection, creation bytecode, runtime, compiler and credentialed RPC rejection.

npm run check:deployment -- --offline
# Exact local artifact/runtime/compiler and public mutation surface.

npm run check:deployment
# Exact published creation input/runtime, successful receipts, transfer/event values and closed room.
```

The chain verifier used block **77497119**, hash
`0x7ec96c68422ad75d308dc11ec4e4d3eb08c9665755cfb03d6d37a5c450d3e650`.
It binds all current state reads to one block and rechecks its hash before completing. The ten fork
tests were rerun at that exact block. Native Solidity `0.8.37+commit.f401782d` recompiles the committed
standard JSON in memory; ABI comparison ignores JSON key and top-level entry ordering but preserves
parameter order. Only the disclosed duplicate `0x` creation prefix and compiler-reported immutable
token references are normalized. No metadata is stripped.

The verifier uses only a public client and read RPC methods, requires chain 4663, and rejects runtime,
constructor, source, receipt, transfer or room-state mismatch. It does not load `.env`, regenerate
artifacts, deploy, sign, broadcast, or claim to reproduce unavailable historical absolute balances.
RPC errors and missing historical state cause failure rather than a skipped or successful result.

R1 issuer/pooled-backing assumptions and R2 counter lifetime remain explicit. The contract counter
and immutable published release are preserved. The sender-settled demo, unproven keeper profitability,
incomplete Blockscout badge and historical-balance limitation remain unchanged. There are no remaining
implementation items in the original eleven-claim verification scope; broader formal verification,
future token upgrades and independently operated keeper economics are not established by these tests.

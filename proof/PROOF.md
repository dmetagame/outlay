# Outlay Robinhood mainnet proof

**Completed payment; Sourcify exact match for creation and runtime.**

## Deployment and participants

- Chain: **Robinhood 4663** (`0x1237`)
- Contract: [`0xe1b5d2cf63c43103455abd802b6b241b959a530c`](https://robinhoodchain.blockscout.com/address/0xe1b5d2cf63c43103455abd802b6b241b959a530c)
- Canonical USDG: `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` (6 decimals)
- Sender / deployer / settlement caller: `0xee3ea6f858ae84dd6959f241dfc257a2f8fa3f53`
- Payee: `0x4157e84fa929f797cc244d28fd9d48b4c6d43df0`

| Transaction | Block | Evidence |
| --- | ---: | --- |
| Deploy | 75737751 | [Deployment transaction](https://robinhoodchain.blockscout.com/tx/0xc0cd9fcba279c431dec9756b865994c127a3727fc2aedd77b400a7cfcef5e432) |
| Open | 75737838 | [Open room transaction](https://robinhoodchain.blockscout.com/tx/0xfb921ebeccb21e342e4dee63f518da14ca721f9d1ecf94b46cb84c9d902e4633) |
| Settle | 75738431 | [Settlement transaction](https://robinhoodchain.blockscout.com/tx/0x8463c5c7a56df5781d443981558f3149f8199740b6aeb6569f8a60059c8cdb12) |

Creation bytecode equals the committed artifact in `src/lib/outlay/artifact.ts` plus the canonical
USDG constructor argument. The duplicated `0x` text prefix in the committed artifact was normalized
for transaction encoding; the bytecode bytes and `contracts/Outlay.sol` were not changed.

Constructor encoding:

```text
0000000000000000000000005fc5360d0400a0fd4f2af552add042d716f1d168
```

## Room and settlement

Room `1` opened for payee `0x4157e84fa929f797cc244d28fd9d48b4c6d43df0` with amount **0.10 USDG**
(`100000`), bounty **0.01 USDG** (`10000`), funded **0.11 USDG** (`110000`), and interval **0**.

The sender `0xee3ea6f858ae84dd6959f241dfc257a2f8fa3f53` called `settle(uint256)` for room `1` at
block `75738431`, timestamp `1790693161`, after its due timestamp `1790693157`.

Canonical USDG balances (whole-token units):

| Account | Before open | After open | After settle | Settlement delta |
| --- | ---: | ---: | ---: | ---: |
| Sender / caller | 0.326841 | 0.216841 | 0.226841 | +0.010000 |
| Payee | 0 | 0 | 0.100000 | +0.100000 |
| Outlay contract | 0 | 0.110000 | 0 | −0.110000 |

The caller funded 0.11 USDG before receiving the 0.01 USDG settlement bounty; the net sender change
across opening and settlement was −0.10 USDG. Canonical USDG Transfer logs and RPC balance reads
confirm both payout legs. Room `1` now has **settlements 1, remaining 0, active false**.

Settlement used **99970 gas** at **20850000 wei** per gas: `0.0000020843745 ETH`, about
**0.000002084 ETH**. Payment of the bounty does not establish keeper profitability.

## Source verification

[Sourcify exact match — creation and runtime](https://repo.sourcify.dev/4663/0xe1B5d2cF63C43103455ABD802B6B241b959a530c)
was verified at **2026-09-29T15:32:34Z**.

- Compiler: `0.8.37+commit.f401782d`
- Optimizer: enabled, 200 runs
- EVM: `cancun`
- License: MIT
- Standard JSON input: [`verification/standard-json-input.json`](../verification/standard-json-input.json)

## Caveats

1. **The settler was the sender.** The call is permissionless, but this was not a third-party keeper demo.
2. **Robinhood Blockscout verification was not completed.** Its compiler list lacks `0.8.37` and its
   API returns Cloudflare 403. No Blockscout verified badge is claimed. This is an open explorer-badge
   limitation; payment and Sourcify verification are complete.

The Blockscout attempt used:

```bash
scripts/verify-contract.sh 4663 0xe1b5d2cf63c43103455abd802b6b241b959a530c
```

The CLI reported `Failed to deserialize response: expected value at line 1 column 1` and
`Error: Failed to obtain contract ABI for 0xe1B5d2cF63C43103455ABD802B6B241b959a530c` after receiving
a Cloudflare HTML challenge instead of the expected API JSON. The [Blockscout contract page](https://robinhoodchain.blockscout.com/address/0xe1b5d2cf63c43103455abd802b6b241b959a530c?tab=contract)
is a transaction/address reference, not evidence of a verified badge.

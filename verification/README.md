# Explorer verification kit

This directory is generated from `contracts/Outlay.sol` by
`node scripts/generate-verification-kit.mjs`.

- `standard-json-input.json` embeds the canonical source and exact optimizer/EVM settings.
- `constructor-args.json` contains the ABI-encoded canonical USDG constructor value per chain,
  without a `0x` prefix for browser verifier forms.

For Arbiscan's **Verify with Standard JSON Input** form, upload `standard-json-input.json`, select
compiler `v0.8.37+commit.f401782d`, choose `contracts/Outlay.sol:Outlay`, and paste the matching
constructor string. For CLI verification after a real deployment, run:

```bash
ETHERSCAN_API_KEY=... scripts/verify-contract.sh <chain-id> <contract-address>
```

Supported chain IDs are `42161`, `421614`, and `4663`. The script derives the constructor argument
from the chain ID and pins optimizer runs, EVM version, compiler version, verifier, and source path.
It does not deploy, and the repository does not claim verification before a real address exists.

#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: scripts/verify-contract.sh <chain-id> <contract-address>" >&2
  exit 64
fi

chain_id="$1"
contract_address="$2"

case "$chain_id" in
  42161)
    usdg="0x004B506865409877C9fA29bfb1ebA929984B9bbC"
    verifier="etherscan"
    verifier_args=()
    ;;
  421614)
    usdg="0xFFC95faa3d63Cde504a05B567C600B78C0b41892"
    verifier="etherscan"
    verifier_args=()
    ;;
  4663)
    usdg="0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168"
    verifier="blockscout"
    verifier_args=(--verifier-url "https://robinhoodchain.blockscout.com/api/")
    ;;
  *)
    echo "unsupported chain id: $chain_id" >&2
    exit 64
    ;;
esac

constructor_args="$(cast abi-encode 'constructor(address)' "$usdg")"

forge verify-contract \
  "$contract_address" \
  contracts/Outlay.sol:Outlay \
  --chain "$chain_id" \
  --compiler-version "v0.8.37+commit.f401782d" \
  --num-of-optimizations 200 \
  --evm-version cancun \
  --constructor-args "$constructor_args" \
  --verifier "$verifier" \
  "${verifier_args[@]}" \
  --watch


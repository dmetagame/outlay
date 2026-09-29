import { useAccount, useChainId, useReadContract } from "wagmi";
import { canonicalUsdg, isSupportedChainId } from "../../lib/outlay/chains";
import { erc20Abi } from "../../lib/outlay/erc20";
import { formatUsdg, shortAddress } from "../../lib/outlay/format";

export function UsdgStrip() {
  const { address } = useAccount();
  const chainId = useChainId();
  const supported = isSupportedChainId(chainId);
  const token = supported ? canonicalUsdg(chainId) : undefined;
  const balance = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(token && address) },
  });

  return (
    <div className="token-strip">
      <div className="token-strip-inner">
        <div className="token-meta"><span className="token-dot" aria-hidden="true">$</span><strong>Canonical USDG</strong></div>
        <div className="token-contract">Token <code title={token}>{token ? shortAddress(token, 7) : "Switch network"}</code></div>
        <div>Wallet balance <strong>{balance.data !== undefined ? `${formatUsdg(balance.data, 6)} USDG` : "—"}</strong></div>
      </div>
    </div>
  );
}

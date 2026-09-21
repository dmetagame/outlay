import { useChainId } from "wagmi";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";
import {
  canonicalUsdg,
  isSupportedChainId,
  robinhood,
  uniswapArbitrumUsdgUrl,
} from "../../lib/outlay/chains";

const PAXOS_TESTNET = "https://docs.paxos.com/guides/stablecoin/usdg/testnet";
const PAXOS_FAUCET = "https://faucet.paxos.com/";
const PAXOS_MINT = "https://www.paxos.com/mint-and-redeem";
const ROBINHOOD_BRIDGE = "https://docs.robinhood.com/chain/bridging/";

export function FundUsdg() {
  const chainId = useChainId();
  const token = isSupportedChainId(chainId) ? canonicalUsdg(chainId) : undefined;

  return (
    <section className="panel funding-panel">
      <div className="panel-heading">
        <div>
          <p className="step">FUNDING</p>
          <h2>Get canonical USDG</h2>
        </div>
        <span className="badge warning">NO MOCKS</span>
      </div>
      <p className="muted">
        Outlay accepts the immutable Paxos token configured at deployment. Check the output address before swapping.
      </p>
      {token && <code className="token-address">{token}</code>}
      {chainId === arbitrum.id && (
        <p className="error" role="alert">
          Liquidity warning: on 22 Sep 2026, independent checks found no Uniswap V3 pool or
          aggregator route for this Arbitrum token. Do not assume the link below can fill a swap.
          Use USDG already held on Arbitrum One, or switch to Sepolia for the official-faucet dry run.
        </p>
      )}
      <div className="fund-links">
        {chainId === arbitrum.id && (
          <a className="fund-link" href={uniswapArbitrumUsdgUrl()} target="_blank" rel="noreferrer">
            <span>ARBITRUM ONE</span>
            <strong>Inspect canonical USDG on Uniswap ↗</strong>
          </a>
        )}
        {chainId === arbitrumSepolia.id && (
          <>
            <a className="fund-link" href={PAXOS_FAUCET} target="_blank" rel="noreferrer">
              <span>ARBITRUM SEPOLIA</span>
              <strong>Request official faucet USDG ↗</strong>
            </a>
            <a className="fund-link" href={PAXOS_TESTNET} target="_blank" rel="noreferrer">
              <span>VERIFY ADDRESS</span>
              <strong>Open Paxos testnet docs ↗</strong>
            </a>
          </>
        )}
        {chainId === robinhood.id && (
          <a className="fund-link" href={ROBINHOOD_BRIDGE} target="_blank" rel="noreferrer">
            <span>ROBINHOOD CHAIN</span>
            <strong>Open official bridge routes ↗</strong>
          </a>
        )}
        <a className="fund-link" href={PAXOS_MINT} target="_blank" rel="noreferrer">
          <span>PRIMARY MARKET</span>
            <strong>Paxos mint requirements ↗</strong>
        </a>
      </div>
      <p className="muted"><small>Direct Paxos minting is institutional; it is not the judge path.</small></p>
    </section>
  );
}

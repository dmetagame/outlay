import { arbitrum, arbitrumSepolia } from "wagmi/chains";
import {
  canonicalUsdg,
  robinhood,
  uniswapArbitrumUsdgUrl,
  uniswapRobinhoodUsdgUrl,
} from "../../lib/outlay/chains";

const PAXOS_TESTNET = "https://docs.paxos.com/guides/stablecoin/usdg/testnet";
const PAXOS_FAUCET = "https://faucet.paxos.com/";
const PAXOS_MINT = "https://www.paxos.com/mint-and-redeem";
const ROBINHOOD_NETWORK = "https://docs.robinhood.com/chain/add-network-to-wallet/";
const ROBINHOOD_POOL =
  "https://app.uniswap.org/explore/pools/robinhood/0x52e65B17fB6E5BA00Ed806f37Afcd2DaA50271Ca";

export function FundUsdg() {
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
        These routes stay visible before wallet connection. Match the selected network and the exact Paxos token
        address—never a same-name lookalike.
      </p>

      <div className="fund-routes">
        <article className="fund-route featured">
          <div className="route-title">
            <span className="badge success">DEFAULT DEMO</span>
            <strong>Robinhood Chain · 4663</strong>
          </div>
          <code className="token-address">{canonicalUsdg(robinhood.id)}</code>
          <p>
            Live route check at block 69,615,154: Uniswap QuoterV2 returned <strong>0.274490 USDG</strong> for
            0.0001 WETH through the canonical WETH/USDG 0.01% pool. The swap link uses native ETH and
            pins this USDG output address.
          </p>
          <div className="fund-links">
            <a className="fund-link" href={uniswapRobinhoodUsdgUrl()} target="_blank" rel="noreferrer">
              <span>BUY USDG</span>
              <strong>ETH → canonical USDG on Uniswap ↗</strong>
            </a>
            <a className="fund-link" href={ROBINHOOD_POOL} target="_blank" rel="noreferrer">
              <span>LIQUIDITY</span>
              <strong>Inspect the WETH/USDG pool ↗</strong>
            </a>
            <a className="fund-link" href={ROBINHOOD_NETWORK} target="_blank" rel="noreferrer">
              <span>METAMASK</span>
              <strong>Add Robinhood Chain ↗</strong>
            </a>
          </div>
        </article>

        <article className="fund-route warning-route">
          <div className="route-title">
            <span className="badge warning">NO DEX ROUTE FOUND</span>
            <strong>Arbitrum One · 42161</strong>
          </div>
          <code className="token-address">{canonicalUsdg(arbitrum.id)}</code>
          <p>
            Supported only if you already hold canonical USDG. Dexscreener returned zero pairs and
            independent Uniswap and aggregator checks found no fill. Do not use Gold USD or another
            same-name token.
          </p>
          <a className="fund-link" href={uniswapArbitrumUsdgUrl()} target="_blank" rel="noreferrer">
            <span>ADDRESS CHECK ONLY</span>
            <strong>Inspect canonical token on Uniswap ↗</strong>
          </a>
        </article>

        <article className="fund-route">
          <div className="route-title">
            <span className="badge">DRY RUN</span>
            <strong>Arbitrum Sepolia · 421614</strong>
          </div>
          <code className="token-address">{canonicalUsdg(arbitrumSepolia.id)}</code>
          <p>
            Paxos publishes this testnet token and faucet. The faucet may require a Paxos developer
            account or sign-in; availability is controlled by Paxos.
          </p>
          <div className="fund-links">
            <a className="fund-link" href={PAXOS_FAUCET} target="_blank" rel="noreferrer">
              <span>OFFICIAL FAUCET</span>
              <strong>Request Paxos testnet USDG ↗</strong>
            </a>
            <a className="fund-link" href={PAXOS_TESTNET} target="_blank" rel="noreferrer">
              <span>VERIFY ADDRESS</span>
              <strong>Open Paxos testnet docs ↗</strong>
            </a>
          </div>
        </article>
      </div>

      <div className="judge-path">
        <p className="step">JUDGE CLICK PATH</p>
        <ol>
          <li>Add Robinhood Chain to MetaMask if missing, then connect and select it in Outlay.</li>
          <li>On Uniswap, buy at least <strong>0.11 canonical USDG</strong>; keep ETH for gas.</li>
          <li>Deploy Outlay from the connected wallet.</li>
          <li>Paste a different address you control as payee; keep payout 0.10 and bounty 0.01.</li>
          <li>Approve 0.11 USDG, fund the room, wait until due, then settle.</li>
          <li>Open the Robinhood Blockscout transaction and payee-balance proof links.</li>
        </ol>
      </div>

      <div className="fund-links institutional-link">
        <a className="fund-link" href={PAXOS_MINT} target="_blank" rel="noreferrer">
          <span>PRIMARY MARKET</span>
          <strong>Paxos mint requirements ↗</strong>
        </a>
      </div>
      <p className="muted"><small>Direct Paxos minting is institutional; it is not the judge path.</small></p>
    </section>
  );
}

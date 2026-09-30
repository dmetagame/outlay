import { useState } from "react";
import type { Address } from "viem";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";
import {
  canonicalUsdg,
  robinhood,
  uniswapArbitrumUsdgUrl,
  uniswapRobinhoodUsdgUrl,
} from "../../lib/outlay/chains";
import { shortAddress } from "../../lib/outlay/format";

const PAXOS_TESTNET = "https://docs.paxos.com/guides/stablecoin/usdg/testnet";
const PAXOS_FAUCET = "https://faucet.paxos.com/";
const PAXOS_MINT = "https://www.paxos.com/mint-and-redeem";
const ROBINHOOD_NETWORK = "https://docs.robinhood.com/chain/add-network-to-wallet/";
const ROBINHOOD_POOL =
  "https://app.uniswap.org/explore/pools/robinhood/0x52e65B17fB6E5BA00Ed806f37Afcd2DaA50271Ca";

export function FundUsdg() {
  return (
    <section className="funding-panel" id="funding" aria-labelledby="funding-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Funding routes</p>
          <h2 id="funding-title">The right token. The right network.</h2>
        </div>
      </div>
      <p className="muted">
        These routes stay visible before wallet connection. Match the selected network and the exact Paxos token
        address—never a same-name lookalike.
      </p>

      <div className="fund-routes">
        <article className="fund-route featured">
          <div className="route-title">
            <span className="badge success">Default demo</span>
            <h3>Robinhood Chain <span>4663</span></h3>
          </div>
          <TokenAddress address={canonicalUsdg(robinhood.id)} network="Robinhood Chain" />
          <p>
            Live route check at block 69,615,154: Uniswap QuoterV2 returned <strong>0.274490 USDG</strong> for
            0.0001 WETH through the canonical WETH/USDG 0.01% pool. The swap link uses native ETH and
            pins this USDG output address.
          </p>
          <div className="fund-links">
            <a className="fund-link" href={uniswapRobinhoodUsdgUrl()} target="_blank" rel="noreferrer">
              <span>Buy USDG</span>
              <strong>ETH → canonical USDG on Uniswap ↗</strong>
            </a>
            <a className="fund-link" href={ROBINHOOD_POOL} target="_blank" rel="noreferrer">
              <span>Liquidity</span>
              <strong>Inspect the WETH/USDG pool ↗</strong>
            </a>
            <a className="fund-link" href={ROBINHOOD_NETWORK} target="_blank" rel="noreferrer">
              <span>MetaMask</span>
              <strong>Add Robinhood Chain ↗</strong>
            </a>
          </div>
        </article>

        <article className="fund-route warning-route">
          <div className="route-title">
            <span className="badge warning">No DEX route found</span>
            <h3>Arbitrum One <span>42161</span></h3>
          </div>
          <TokenAddress address={canonicalUsdg(arbitrum.id)} network="Arbitrum One" />
          <p>
            Supported only if you already hold canonical USDG. Dexscreener returned zero pairs and
            independent Uniswap and aggregator checks found no fill. Do not use Gold USD or another
            same-name token.
          </p>
          <a className="fund-link" href={uniswapArbitrumUsdgUrl()} target="_blank" rel="noreferrer">
            <span>Address check only</span>
            <strong>Inspect canonical token on Uniswap ↗</strong>
          </a>
        </article>

        <article className="fund-route">
          <div className="route-title">
            <span className="badge">Testnet</span>
            <h3>Arbitrum Sepolia <span>421614</span></h3>
          </div>
          <TokenAddress address={canonicalUsdg(arbitrumSepolia.id)} network="Arbitrum Sepolia" />
          <p>
            Paxos publishes this testnet token and faucet. The faucet may require a Paxos developer
            account or sign-in; availability is controlled by Paxos.
          </p>
          <div className="fund-links">
            <a className="fund-link" href={PAXOS_FAUCET} target="_blank" rel="noreferrer">
              <span>Official faucet</span>
              <strong>Request Paxos testnet USDG ↗</strong>
            </a>
            <a className="fund-link" href={PAXOS_TESTNET} target="_blank" rel="noreferrer">
              <span>Verify address</span>
              <strong>Open Paxos testnet docs ↗</strong>
            </a>
          </div>
        </article>
      </div>

      <details className="judge-path">
        <summary>Run your own settlement <span>Six steps, from funding to proof</span></summary>
        <ol>
          <li>Add Robinhood Chain to MetaMask if missing, then connect and select it in Outlay.</li>
          <li>On Uniswap, buy at least <strong>0.11 canonical USDG</strong>; keep ETH for gas.</li>
          <li>Deploy Outlay from the connected wallet.</li>
          <li>Paste a different address you control as payee; keep payout 0.10 and bounty 0.01.</li>
          <li>Approve 0.11 USDG, fund the room, wait until due, then settle.</li>
          <li>Open the Robinhood Blockscout transaction and payee-balance proof links.</li>
        </ol>
      </details>

      <div className="fund-links institutional-link">
        <a className="fund-link" href={PAXOS_MINT} target="_blank" rel="noreferrer">
          <span>Primary market</span>
          <strong>Paxos mint requirements ↗</strong>
        </a>
      </div>
      <p className="muted"><small>Direct Paxos minting is institutional; it is not the judge path.</small></p>
    </section>
  );
}

function TokenAddress({ address, network }: { address: Address; network: string }) {
  const [status, setStatus] = useState("");

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address);
      setStatus("Address copied.");
    } catch {
      setStatus("Copy failed. Try again.");
    }
  }

  return (
    <div className="token-address">
      <code title={address}>{shortAddress(address, 6)}</code>
      <button className="text-button" type="button" aria-label={`Copy ${network} USDG address`} onClick={copyAddress}>Copy</button>
      <span className="address-copy-status" role="status">{status}</span>
    </div>
  );
}

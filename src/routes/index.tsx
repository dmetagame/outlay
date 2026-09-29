import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { useChainId } from "wagmi";
import { DeployCard } from "../components/outlay/deploy-card";
import { FundUsdg } from "../components/outlay/fund-usdg";
import { Header } from "../components/outlay/header";
import { MainnetProof } from "../components/outlay/mainnet-proof";
import { OpenRoom } from "../components/outlay/open-room";
import { RoomList } from "../components/outlay/room-list";
import { UsdgStrip } from "../components/outlay/usdg-strip";
import { isSupportedChainId } from "../lib/outlay/chains";
import { readStoredContract } from "../lib/outlay/storage";

export const Route = createFileRoute("/")({ component: App });

function App() {
  const chainId = useChainId();
  const [contractAddress, setContractAddress] = useState<Address>();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setContractAddress(isSupportedChainId(chainId) ? readStoredContract(chainId) : undefined);
  }, [chainId]);

  return (
    <>
      <a className="skip-link" href="#desk">Skip to settlement desk</a>
      <Header />
      <main>
        <section className="hero shell" aria-labelledby="page-title">
          <div className="hero-intro">
            <p className="eyebrow"><span className="status-dot" aria-hidden="true" /> Scheduled USDG settlement</p>
            <h1 id="page-title">Set the payment.<br />Pay the settler.</h1>
            <p className="hero-copy">Lock USDG for a payee. When it’s due, anyone can settle the room. The payee gets paid. The caller earns the bounty.</p>
            <a className="primary button-link" href="#desk">Open a payout room <span aria-hidden="true">↗</span></a>
            <p className="hero-note">Canonical USDG. Wallet-signed. Permissionless settlement.</p>
          </div>
          <MainnetProof />
        </section>

        <section className="shell desk" id="desk" aria-labelledby="desk-title">
          <div className="section-heading">
            <div><p className="eyebrow">Workspace</p><h2 id="desk-title">Settlement desk</h2></div>
            <p>Configure a room. Fund it once.<br />Settle when the onchain clock is due.</p>
          </div>
          <UsdgStrip />
          <DeployCard contractAddress={contractAddress} onContractAddress={setContractAddress} />
          <div className="workspace-grid">
            <OpenRoom contractAddress={contractAddress} onRoomOpened={() => setRefreshKey((value) => value + 1)} />
            <RoomList contractAddress={contractAddress} refreshKey={refreshKey} />
          </div>
        </section>
        <div className="shell"><FundUsdg /></div>
      </main>
      <footer className="shell footer">
        <div><a className="footer-brand" href="#">outlay</a><span>Scheduled payments. Paid settlement.</span></div>
        <div className="footer-links">
          <a href="https://github.com/dmetagame/outlay/blob/main/proof/PROOF.md" target="_blank" rel="noreferrer">Proof record ↗</a>
          <a href="https://github.com/dmetagame/outlay" target="_blank" rel="noreferrer">Source code ↗</a>
        </div>
      </footer>
    </>
  );
}

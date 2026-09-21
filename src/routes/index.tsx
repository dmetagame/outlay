import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { useChainId } from "wagmi";
import { DeployCard } from "../components/outlay/deploy-card";
import { FundUsdg } from "../components/outlay/fund-usdg";
import { Header } from "../components/outlay/header";
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
    <main>
      <Header />
      <section className="hero shell">
        <div>
          <p className="eyebrow">ARBITRUM OPEN HOUSE · PROMISING PRODUCTS</p>
          <h1>Scheduled payouts.<br />Paid settlement.</h1>
          <p className="hero-copy">
            Lock canonical USDG for a different payee. When the room is due, anyone can settle it—and
            the caller earns the sender-funded bounty.
          </p>
        </div>
        <div className="loop-card" aria-label="Outlay money loop">
          <span>01 · FUND</span>
          <strong>USDG enters one isolated room</strong>
          <span>02 · WAIT</span>
          <strong>The onchain due time arrives</strong>
          <span>03 · SETTLE</span>
          <strong>Payee and caller are paid</strong>
        </div>
      </section>

      <UsdgStrip />

      <section className="shell workspace-grid">
        <div className="stack">
          <DeployCard contractAddress={contractAddress} onContractAddress={setContractAddress} />
          <OpenRoom
            contractAddress={contractAddress}
            onRoomOpened={() => setRefreshKey((value) => value + 1)}
          />
          <FundUsdg />
        </div>
        <RoomList contractAddress={contractAddress} refreshKey={refreshKey} />
      </section>

      <footer className="shell footer">
        <span>Outlay moves the asset. Explorer receipts are evidence, not the product.</span>
        <a href="https://github.com/dmetagame/outlay" target="_blank" rel="noreferrer">Public source ↗</a>
      </footer>
    </main>
  );
}


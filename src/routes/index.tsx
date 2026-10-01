import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAccount, useChainId, useConnect, usePublicClient } from "wagmi";
import { DeployCard } from "../components/outlay/deploy-card";
import { FundUsdg } from "../components/outlay/fund-usdg";
import { Header } from "../components/outlay/header";
import { MainnetProof } from "../components/outlay/mainnet-proof";
import { OpenRoom } from "../components/outlay/open-room";
import { RoomList } from "../components/outlay/room-list";
import { UsdgStrip } from "../components/outlay/usdg-strip";
import { isSupportedChainId } from "../lib/outlay/chains";
import { readStoredContract } from "../lib/outlay/storage";
import { verifyOutlayContract, type VerifiedOutlayContract } from "../lib/outlay/runtime";
import { readTransactionError } from "../lib/outlay/transactions";

export const Route = createFileRoute("/")({ component: App });

function App() {
  const { isConnected } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [verifiedContract, setVerifiedContract] = useState<VerifiedOutlayContract>();
  const [contractError, setContractError] = useState("");
  const contract = verifiedContract?.chainId === chainId ? verifiedContract : undefined;
  const contractAddress = contract?.address;
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setVerifiedContract(undefined);
    setContractError("");
    if (!publicClient || !isSupportedChainId(chainId)) return;
    const stored = readStoredContract(chainId);
    if (stored) {
      void verifyOutlayContract(publicClient, chainId, stored).then(
        (verified) => { if (!cancelled) setVerifiedContract(verified); },
        (cause) => { if (!cancelled) setContractError(readTransactionError(cause)); },
      );
    }
    return () => { cancelled = true; };
  }, [chainId, publicClient]);

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
            {!isConnected ? (
              <button
                className="primary"
                type="button"
                disabled={isPending || connectors.length === 0}
                onClick={() => connectors[0] && connect({ connector: connectors[0] })}
              >
                {isPending ? "Connecting…" : "Connect MetaMask"}
              </button>
            ) : contractAddress ? (
              <a className="primary button-link" href="#desk">Open a payout room</a>
            ) : (
              <button className="primary" type="button" disabled aria-describedby="hero-action-reason">Open a payout room</button>
            )}
            {isConnected && !contractAddress && <p className="control-hint hero-action-reason" id="hero-action-reason">Deploy or choose a contract to open a payout room.</p>}
            {!isConnected && error && <p className="error" role="alert">{error.message.split("\n")[0]}</p>}
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
          {contractError && !contract && <p className="error" role="alert">Stored contract could not be verified. {contractError}</p>}
          <DeployCard contract={contract} onContract={(verified) => { setContractError(""); setVerifiedContract(verified); }} />
          <div className="workspace-grid">
            <OpenRoom contract={contract} onRoomOpened={() => setRefreshKey((value) => value + 1)} />
            <RoomList contract={contract} refreshKey={refreshKey} />
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

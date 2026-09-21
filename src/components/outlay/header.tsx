import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { shortAddress } from "../../lib/outlay/format";
import { isSupportedChainId, supportedChains } from "../../lib/outlay/chains";

export function Header() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  return (
    <header className="header">
      <div className="header-inner shell">
        <a className="brand" href="/" aria-label="Outlay home">
          <span className="brand-mark">O</span>
          <span>OUTLAY</span>
        </a>
        <div className="wallet-cluster">
        {isConnected ? (
          <>
            <label className="sr-only" htmlFor="network">Network</label>
            <select
              id="network"
              className="network-select"
              value={chainId}
              disabled={isSwitching}
              onChange={(event) => {
                const nextChainId = Number(event.target.value);
                if (isSupportedChainId(nextChainId)) switchChain({ chainId: nextChainId });
              }}
            >
              {supportedChains.map((chain) => (
                <option key={chain.id} value={chain.id}>{chain.name}</option>
              ))}
            </select>
            <button className="secondary" type="button" title={address} onClick={() => disconnect()}>
              {address ? shortAddress(address, 5) : "Connected"}
            </button>
          </>
        ) : (
          <button
            className="primary"
            type="button"
            disabled={isPending || connectors.length === 0}
            onClick={() => connectors[0] && connect({ connector: connectors[0] })}
          >
            {isPending ? "Connecting…" : "Connect MetaMask"}
          </button>
        )}
        </div>
      </div>
    </header>
  );
}

import { useEffect, useState } from "react";
import { getAddress, isAddress, type Address, type Hash } from "viem";
import {
  useAccount,
  useChainId,
  useDeployContract,
  usePublicClient,
  useWaitForTransactionReceipt,
} from "wagmi";
import { outlayAbi, outlayBytecode } from "../../lib/outlay/artifact";
import {
  addressUrl,
  canonicalUsdg,
  isSupportedChainId,
  transactionUrl,
} from "../../lib/outlay/chains";
import { shortAddress } from "../../lib/outlay/format";
import { storeContract } from "../../lib/outlay/storage";

type Props = {
  contractAddress?: Address;
  onContractAddress: (address: Address) => void;
};

export function DeployCard({ contractAddress, onContractAddress }: Props) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [deploymentHash, setDeploymentHash] = useState<Hash>();
  const [existing, setExisting] = useState("");
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);
  const [error, setError] = useState("");
  const publicClient = usePublicClient();
  const { deployContractAsync, isPending } = useDeployContract();
  const receipt = useWaitForTransactionReceipt({ hash: deploymentHash });

  useEffect(() => {
    const address = receipt.data?.contractAddress;
    if (!address || !isSupportedChainId(chainId)) return;
    storeContract(chainId, address);
    onContractAddress(address);
  }, [chainId, onContractAddress, receipt.data?.contractAddress]);

  async function deploy() {
    if (!isSupportedChainId(chainId)) return;
    setError("");
    try {
      const hash = await deployContractAsync({
        abi: outlayAbi,
        bytecode: outlayBytecode,
        args: [canonicalUsdg(chainId)],
        chainId,
      });
      setDeploymentHash(hash);
    } catch (cause) {
      setError(readError(cause));
    }
  }

  async function useExisting() {
    if (!publicClient || !isSupportedChainId(chainId) || !isAddress(existing)) {
      setError("Enter a valid deployed Outlay contract address.");
      return;
    }
    const address = getAddress(existing);
    setError("");
    setIsCheckingExisting(true);
    try {
      const configuredToken = await publicClient.readContract({
        address,
        abi: outlayAbi,
        functionName: "usdg",
      });
      if (getAddress(configuredToken) !== canonicalUsdg(chainId)) {
        setError("That contract is not configured with canonical USDG on this network.");
        return;
      }
      storeContract(chainId, address);
      onContractAddress(address);
    } catch {
      setError("That address does not expose a readable Outlay USDG configuration.");
    } finally {
      setIsCheckingExisting(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="step">STEP 1</p>
          <h2>Deploy Outlay</h2>
        </div>
        <span className={contractAddress ? "badge success" : "badge"}>
          {contractAddress ? "READY" : "WALLET DEPLOY"}
        </span>
      </div>
      <p className="muted">
        Your connected wallet deploys the tested bytecode with canonical USDG as the immutable token.
        No server key is used.
      </p>

      {contractAddress ? (
        <div className="result-row">
          <div>
            <span className="label">Active contract</span>
            <code>{shortAddress(contractAddress, 8)}</code>
          </div>
          {isSupportedChainId(chainId) && (
            <a href={addressUrl(chainId, contractAddress)} target="_blank" rel="noreferrer">Explorer ↗</a>
          )}
        </div>
      ) : (
        <button className="primary full" type="button" disabled={!address || isPending || receipt.isLoading} onClick={deploy}>
          {isPending ? "Confirm in wallet…" : receipt.isLoading ? "Deploying…" : "Deploy from this wallet"}
        </button>
      )}

      {deploymentHash && isSupportedChainId(chainId) && (
        <a className="inline-link" href={transactionUrl(chainId, deploymentHash)} target="_blank" rel="noreferrer">
          Deployment transaction ↗
        </a>
      )}

      <details>
        <summary>Already deployed?</summary>
        <div className="inline-form">
          <input
            aria-label="Existing Outlay contract address"
            placeholder="0x…"
            value={existing}
            onChange={(event) => setExisting(event.target.value)}
          />
          <button type="button" className="secondary" disabled={isCheckingExisting} onClick={useExisting}>
            {isCheckingExisting ? "Checking…" : "Use address"}
          </button>
        </div>
      </details>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}

function readError(cause: unknown): string {
  if (cause instanceof Error) return cause.message.split("\n")[0];
  return "The wallet rejected or could not send the transaction.";
}

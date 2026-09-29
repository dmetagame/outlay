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
        bytecode: outlayBytecode.replace(/^0x(?:0x)+/, "0x") as `0x${string}`,
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
    <section className="contract-setup" aria-labelledby="contract-title">
      <div className="contract-overview">
        <div className="contract-copy">
          <h3 id="contract-title">{contractAddress ? "Contract ready" : "Choose your contract"}</h3>
          <p>{contractAddress ? "Your rooms are loaded from this contract." : "Deploy from your wallet, or use an existing Outlay address."}</p>
        </div>
        {contractAddress ? (
          <div className="result-row">
            <code title={contractAddress}>{shortAddress(contractAddress, 8)}</code>
            {isSupportedChainId(chainId) && <a href={addressUrl(chainId, contractAddress)} target="_blank" rel="noreferrer">View contract ↗</a>}
          </div>
        ) : (
          <div className="deploy-action">
            <button className="primary" type="button" disabled={!address || !isSupportedChainId(chainId) || isPending || receipt.isLoading} onClick={deploy}>
              {isPending ? "Confirm in wallet…" : receipt.isLoading ? "Deploying…" : "Deploy from this wallet"}
            </button>
            {!address && <span className="control-hint">Connect your wallet to deploy.</span>}
          </div>
        )}
      </div>
      <details className="existing-contract">
        <summary>{contractAddress ? "Use another contract" : "Use an existing contract"}</summary>
        <div className="inline-form">
          <div className="field">
            <label htmlFor="existing-contract">Outlay contract address</label>
            <input id="existing-contract" name="existing-contract" autoComplete="off" spellCheck={false} placeholder="0x…" value={existing} onChange={(event) => setExisting(event.target.value)} />
          </div>
          <button type="button" className="secondary" disabled={isCheckingExisting} onClick={useExisting}>{isCheckingExisting ? "Checking…" : "Use address"}</button>
        </div>
        <p className="control-hint">The address must use canonical USDG on the selected network.</p>
      </details>
      {deploymentHash && isSupportedChainId(chainId) && <a className="inline-link" href={transactionUrl(chainId, deploymentHash)} target="_blank" rel="noreferrer">Deployment transaction ↗</a>}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}

function readError(cause: unknown): string {
  if (cause instanceof Error) return cause.message.split("\n")[0];
  return "The wallet rejected or could not send the transaction.";
}

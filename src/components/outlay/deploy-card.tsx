import { useRef, useState } from "react";
import { getAddress, isAddress, type Hash } from "viem";
import {
  useAccount,
  useChainId,
  useDeployContract,
  usePublicClient,
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
import { knownOutlayRuntime, verifyOutlayContract, type VerifiedOutlayContract } from "../../lib/outlay/runtime";
import { readTransactionError, waitForSuccessfulReceipt } from "../../lib/outlay/transactions";

type Props = {
  contract?: VerifiedOutlayContract;
  onContract: (contract: VerifiedOutlayContract) => void;
};

export function DeployCard({ contract, onContract }: Props) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [deployment, setDeployment] = useState<{ hash: Hash; chainId: number }>();
  const [existing, setExisting] = useState("");
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);
  const [error, setError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const currentChain = useRef(chainId);
  currentChain.current = chainId;
  const publicClient = usePublicClient();
  const { deployContractAsync, isPending } = useDeployContract();
  const contractAddress = contract?.chainId === chainId ? contract.address : undefined;
  const runtimeKnown = Boolean(knownOutlayRuntime(chainId));

  async function deploy() {
    if (!publicClient || !isSupportedChainId(chainId) || !runtimeKnown) return;
    setError("");
    setIsConfirming(true);
    try {
      const hash = await deployContractAsync({
        abi: outlayAbi,
        bytecode: outlayBytecode.replace(/^0x(?:0x)+/, "0x") as `0x${string}`,
        args: [canonicalUsdg(chainId)],
        chainId,
      });
      setDeployment({ hash, chainId });
      const receipt = await waitForSuccessfulReceipt(publicClient, hash, "Deployment");
      if (!receipt.contractAddress) throw new Error("Deployment did not return a contract address.");
      const verified = await verifyOutlayContract(publicClient, chainId, receipt.contractAddress);
      if (currentChain.current !== chainId) return;
      storeContract(chainId, verified.address);
      onContract(verified);
    } catch (cause) {
      setError(readTransactionError(cause));
    } finally {
      setIsConfirming(false);
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
      const verified = await verifyOutlayContract(publicClient, chainId, address);
      if (currentChain.current !== chainId) return;
      storeContract(chainId, verified.address);
      onContract(verified);
    } catch (cause) {
      setError(readTransactionError(cause));
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
            <button className="primary" type="button" disabled={!address || !isSupportedChainId(chainId) || !runtimeKnown || isPending || isConfirming || isCheckingExisting} onClick={deploy}>
              {isPending ? "Confirm in wallet…" : isConfirming ? "Deploying…" : "Deploy from this wallet"}
            </button>
            {!address && <span className="control-hint">Connect your wallet to deploy.</span>}
            {!runtimeKnown && <span className="control-hint">Contract verification is available only on Robinhood Chain.</span>}
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
          <button type="button" className="secondary" disabled={isCheckingExisting || isConfirming || isPending} onClick={useExisting}>{isCheckingExisting ? "Checking…" : "Use address"}</button>
        </div>
        <p className="control-hint">Only verified Outlay contracts on the selected network can be used.</p>
      </details>
      {deployment && isSupportedChainId(deployment.chainId) && <a className="inline-link" href={transactionUrl(deployment.chainId, deployment.hash)} target="_blank" rel="noreferrer">Deployment transaction ↗</a>}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}

import { useMemo, useState } from "react";
import { getAddress, type Hash } from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { outlayAbi } from "../../lib/outlay/artifact";
import { canonicalUsdg, isSupportedChainId, transactionUrl, type SupportedChainId } from "../../lib/outlay/chains";
import { erc20Abi } from "../../lib/outlay/erc20";
import { formatUsdg } from "../../lib/outlay/format";
import { parseRoomFunding, validatePayee } from "../../lib/outlay/room-form";
import type { VerifiedOutlayContract } from "../../lib/outlay/runtime";
import { readTransactionError, waitForSuccessfulReceipt } from "../../lib/outlay/transactions";

type Props = {
  contract?: VerifiedOutlayContract;
  onRoomOpened: () => void;
};

export function OpenRoom({ contract, onRoomOpened }: Props) {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const contractAddress = contract?.chainId === chainId ? contract.address : undefined;
  const [payee, setPayee] = useState("");
  const [payout, setPayout] = useState("0.10");
  const [bounty, setBounty] = useState("0.01");
  const [periods, setPeriods] = useState("1");
  const [interval, setInterval] = useState("60");
  const [dueMode, setDueMode] = useState<"minute" | "now">("minute");
  const [approval, setApproval] = useState<{ hash: Hash; chainId: SupportedChainId }>();
  const [opening, setOpening] = useState<{ hash: Hash; chainId: SupportedChainId }>();
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<"approve" | "open">();
  const { writeContractAsync, isPending } = useWriteContract();

  const { parsed, fundingError } = useMemo(() => {
    try {
      return {
        parsed: parseRoomFunding(payout, bounty, periods, interval),
        fundingError: "",
      };
    } catch (cause) {
      return { parsed: undefined, fundingError: readTransactionError(cause) };
    }
  }, [bounty, interval, payout, periods]);

  const token = isSupportedChainId(chainId) ? canonicalUsdg(chainId) : undefined;
  const allowance = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && contractAddress ? [address, contractAddress] : undefined,
    query: { enabled: Boolean(token && address && contractAddress) },
  });
  const balance = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(token && address) },
  });

  const payeeError = validatePayee(payee, address, contractAddress, token);
  const needsApproval = Boolean(address && contractAddress && parsed && (allowance.data ?? 0n) < parsed.funded);
  const insufficientBalance = Boolean(parsed && balance.data !== undefined && balance.data < parsed.funded);

  async function approve() {
    if (!address || !publicClient || !parsed || !token || !contractAddress || !isSupportedChainId(chainId) || payeeError || confirming) return;
    setError("");
    setConfirming("approve");
    try {
      const hash = await writeContractAsync({
        address: token,
        abi: erc20Abi,
        functionName: "approve",
        args: [contractAddress, parsed.funded],
        chainId,
      });
      setApproval({ hash, chainId });
      await waitForSuccessfulReceipt(publicClient, hash, "USDG approval");
      await allowance.refetch();
    } catch (cause) {
      setError(readTransactionError(cause));
    } finally {
      setConfirming(undefined);
    }
  }

  async function openRoom() {
    if (!address || !publicClient || !parsed || !contractAddress || !isSupportedChainId(chainId) || payeeError || confirming) return;
    setError("");
    setConfirming("open");
    try {
      const nextRunAt = dueMode === "now" ? 1n : BigInt(Math.floor(Date.now() / 1_000) + 60);
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: outlayAbi,
        functionName: "openRoom",
        args: [
          getAddress(payee),
          parsed.amount,
          parsed.bounty,
          parsed.funded,
          nextRunAt,
          parsed.interval,
        ],
        chainId,
      });
      setOpening({ hash, chainId });
      await waitForSuccessfulReceipt(publicClient, hash, "Opening room");
      onRoomOpened();
    } catch (cause) {
      setError(readTransactionError(cause));
    } finally {
      setConfirming(undefined);
    }
  }

  return (
    <section className="composer" aria-labelledby="composer-title">
      <div className="panel-heading">
        <div><h3 id="composer-title">New payout room</h3><p>One payee. An isolated balance. A paid caller.</p></div>
      </div>
      <div className="amount-fields">
        <div className="field amount-field">
          <label htmlFor="payout">Payee receives</label>
          <div className="input-suffix"><input id="payout" name="payout" inputMode="decimal" autoComplete="off" aria-describedby="payout-hint" value={payout} onChange={(event) => setPayout(event.target.value)} /><span>USDG</span></div>
          <small id="payout-hint">Payout per settlement · USDG allows up to 6 decimal places.</small>
        </div>
        <div className="field amount-field">
          <label htmlFor="bounty">Caller earns</label>
          <div className="input-suffix"><input id="bounty" name="bounty" inputMode="decimal" autoComplete="off" aria-describedby="bounty-hint" value={bounty} onChange={(event) => setBounty(event.target.value)} /><span>USDG</span></div>
          <small id="bounty-hint">Sender-funded settler bounty · Up to 6 decimal places.</small>
        </div>
      </div>
      <div className="field payee-field">
        <label htmlFor="payee">Payee address</label>
        <input id="payee" name="payee" autoComplete="off" spellCheck={false} placeholder="0x…" value={payee} onChange={(event) => setPayee(event.target.value)} aria-invalid={Boolean(payee && payeeError)} aria-describedby={payee && payeeError ? "payee-hint payee-error" : "payee-hint"} />
        <small id="payee-hint">Use a different wallet address, never the Outlay or USDG contract.</small>
        {payee && payeeError && <span id="payee-error" className="field-error" aria-live="polite">{payeeError}</span>}
      </div>
      <fieldset className="due-options">
        <legend>First due time</legend>
        <div className="due-choices">
          <label><input type="radio" name="due" value="minute" checked={dueMode === "minute"} onChange={() => setDueMode("minute")} /><span>In 1 minute</span><small>From wallet request</small></label>
          <label><input type="radio" name="due" value="now" checked={dueMode === "now"} onChange={() => setDueMode("now")} /><span>Due now</span><small>Ready to settle</small></label>
        </div>
      </fieldset>
      <details className="schedule-options">
        <summary>Recurring schedule <span>{parsed?.count === 1 ? "One-shot" : `${periods} funded periods`}</span></summary>
        <div className="field-grid">
          <div className="field"><label htmlFor="periods">Funded periods</label><input id="periods" name="periods" inputMode="numeric" autoComplete="off" value={periods} onChange={(event) => setPeriods(event.target.value)} /></div>
          <div className="field"><label htmlFor="interval">Interval in seconds</label><input id="interval" name="interval" inputMode="numeric" autoComplete="off" disabled={parsed?.count === 1} value={interval} onChange={(event) => setInterval(event.target.value)} /></div>
        </div>
        <p className="control-hint">One period closes after settlement. Recurring rooms advance from the last settlement.</p>
      </details>
      <div className="lock-preview" aria-live="polite">
        <div><span>Total to lock</span><small>{parsed && parsed.count > 1 ? `(Payout + bounty) × ${parsed.count} periods` : "Payout + bounty · One settlement"}</small></div>
        <strong>{parsed ? formatUsdg(parsed.funded, 6) : "—"} <span>USDG</span></strong>
      </div>
      {fundingError && <p className="error" role="alert">{fundingError}</p>}
      {insufficientBalance && <p className="error" role="alert">Your wallet needs more USDG to fund this room. <a href="#funding">View funding routes</a>.</p>}
      {needsApproval ? (
        <button className="primary full" type="button" disabled={!address || !contractAddress || Boolean(payeeError) || isPending || Boolean(confirming) || insufficientBalance} onClick={approve}>
          {isPending ? "Confirm in wallet…" : confirming === "approve" ? "Approving USDG…" : `Approve ${parsed ? formatUsdg(parsed.funded, 6) : ""} USDG`}
        </button>
      ) : (
        <button className="primary full" type="button" disabled={!address || !isSupportedChainId(chainId) || !parsed || !contractAddress || Boolean(payeeError) || insufficientBalance || isPending || Boolean(confirming)} onClick={openRoom}>
          {isPending ? "Confirm in wallet…" : confirming === "open" ? "Opening room…" : "Fund and open room"}
        </button>
      )}
      {!contractAddress && <p className="control-hint">Choose a contract above before funding your room.</p>}
      <p className="bounty-note">The bounty pays the caller; profit is not guaranteed. For third-party settlement, price it above live gas cost.</p>
      {approval && <a className="inline-link" href={transactionUrl(approval.chainId, approval.hash)} target="_blank" rel="noreferrer">Approval transaction ↗</a>}
      {opening && <a className="inline-link" href={transactionUrl(opening.chainId, opening.hash)} target="_blank" rel="noreferrer">Room transaction ↗</a>}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}

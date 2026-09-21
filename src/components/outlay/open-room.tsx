import { useEffect, useMemo, useRef, useState } from "react";
import { getAddress, type Address, type Hash } from "viem";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { outlayAbi } from "../../lib/outlay/artifact";
import { canonicalUsdg, isSupportedChainId, transactionUrl } from "../../lib/outlay/chains";
import { erc20Abi } from "../../lib/outlay/erc20";
import { formatUsdg, parseUsdg } from "../../lib/outlay/format";
import { validatePayee } from "../../lib/outlay/room-form";

type Props = {
  contractAddress?: Address;
  onRoomOpened: () => void;
};

export function OpenRoom({ contractAddress, onRoomOpened }: Props) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [payee, setPayee] = useState("");
  const [payout, setPayout] = useState("0.10");
  const [bounty, setBounty] = useState("0.01");
  const [periods, setPeriods] = useState("1");
  const [interval, setInterval] = useState("60");
  const [dueMode, setDueMode] = useState<"minute" | "now">("minute");
  const [approvalHash, setApprovalHash] = useState<Hash>();
  const [openHash, setOpenHash] = useState<Hash>();
  const [error, setError] = useState("");
  const { writeContractAsync, isPending } = useWriteContract();
  const approvalReceipt = useWaitForTransactionReceipt({ hash: approvalHash });
  const openReceipt = useWaitForTransactionReceipt({ hash: openHash });
  const handledApproval = useRef<Hash | undefined>(undefined);
  const handledOpen = useRef<Hash | undefined>(undefined);

  const parsed = useMemo(() => {
    try {
      const amount = parseUsdg(payout);
      const callerBounty = parseUsdg(bounty);
      const count = Number.parseInt(periods, 10);
      const seconds = Number.parseInt(interval, 10);
      if (amount <= 0n || callerBounty <= 0n || !Number.isInteger(count) || count < 1) return undefined;
      if (count > 1 && (!Number.isInteger(seconds) || seconds < 1)) return undefined;
      return {
        amount,
        bounty: callerBounty,
        count,
        interval: count === 1 ? 0 : seconds,
        funded: (amount + callerBounty) * BigInt(count),
      };
    } catch {
      return undefined;
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

  useEffect(() => {
    if (!approvalReceipt.isSuccess || !approvalHash || handledApproval.current === approvalHash) return;
    handledApproval.current = approvalHash;
    void allowance.refetch();
  }, [allowance.refetch, approvalHash, approvalReceipt.isSuccess]);

  useEffect(() => {
    if (!openReceipt.isSuccess || !openHash || handledOpen.current === openHash) return;
    handledOpen.current = openHash;
    onRoomOpened();
  }, [onRoomOpened, openHash, openReceipt.isSuccess]);

  const payeeError = validatePayee(payee, address);
  const needsApproval = Boolean(address && contractAddress && parsed && (allowance.data ?? 0n) < parsed.funded);
  const insufficientBalance = Boolean(parsed && balance.data !== undefined && balance.data < parsed.funded);

  async function approve() {
    if (!parsed || !token || !contractAddress || !isSupportedChainId(chainId)) return;
    setError("");
    try {
      const hash = await writeContractAsync({
        address: token,
        abi: erc20Abi,
        functionName: "approve",
        args: [contractAddress, parsed.funded],
        chainId,
      });
      setApprovalHash(hash);
    } catch (cause) {
      setError(readError(cause));
    }
  }

  async function openRoom() {
    if (!parsed || !contractAddress || !isSupportedChainId(chainId) || payeeError) return;
    setError("");
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
      setOpenHash(hash);
    } catch (cause) {
      setError(readError(cause));
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="step">STEP 2</p>
          <h2>Open a payout room</h2>
        </div>
        <span className="badge">0.10 + 0.01</span>
      </div>

      <div className="field">
        <label htmlFor="payee">Payee address</label>
        <input
          id="payee"
          placeholder="A different address you control · 0x…"
          value={payee}
          onChange={(event) => setPayee(event.target.value)}
          aria-invalid={Boolean(payee && payeeError)}
        />
        <small>Payee must be a different address you control. The contract rejects the connected sender.</small>
        {payee && payeeError && <span className="field-error">{payeeError}</span>}
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="payout">Payout per period</label>
          <div className="input-suffix"><input id="payout" value={payout} onChange={(event) => setPayout(event.target.value)} /><span>USDG</span></div>
        </div>
        <div className="field">
          <label htmlFor="bounty">Settler bounty</label>
          <div className="input-suffix"><input id="bounty" value={bounty} onChange={(event) => setBounty(event.target.value)} /><span>USDG</span></div>
        </div>
        <div className="field">
          <label htmlFor="periods">Funded periods</label>
          <input id="periods" inputMode="numeric" value={periods} onChange={(event) => setPeriods(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="interval">Interval seconds</label>
          <input id="interval" inputMode="numeric" disabled={parsed?.count === 1} value={interval} onChange={(event) => setInterval(event.target.value)} />
        </div>
      </div>

      <fieldset className="segmented">
        <legend>First due time</legend>
        <label><input type="radio" name="due" checked={dueMode === "minute"} onChange={() => setDueMode("minute")} /> In 1 minute</label>
        <label><input type="radio" name="due" checked={dueMode === "now"} onChange={() => setDueMode("now")} /> Due now</label>
      </fieldset>

      <div className="lock-preview">
        <span>LOCK PREVIEW</span>
        <strong>{parsed ? `${formatUsdg(parsed.funded, 6)} USDG` : "Invalid amounts"}</strong>
        <small>(payout + bounty) × periods</small>
      </div>

      {insufficientBalance && <p className="error" role="alert">Wallet USDG balance is below the lock preview.</p>}
      {!contractAddress && <p className="notice">Deploy or enter an Outlay contract before funding a room.</p>}

      {needsApproval ? (
        <button className="primary full" type="button" disabled={!address || isPending || insufficientBalance} onClick={approve}>
          {isPending ? "Confirm in wallet…" : `Approve ${parsed ? formatUsdg(parsed.funded, 6) : ""} USDG`}
        </button>
      ) : (
        <button
          className="primary full"
          type="button"
          disabled={!parsed || !contractAddress || Boolean(payeeError) || insufficientBalance || isPending}
          onClick={openRoom}
        >
          {isPending ? "Confirm in wallet…" : "Fund and open room"}
        </button>
      )}

      {approvalHash && isSupportedChainId(chainId) && (
        <a className="inline-link" href={transactionUrl(chainId, approvalHash)} target="_blank" rel="noreferrer">Approval transaction ↗</a>
      )}
      {openHash && isSupportedChainId(chainId) && (
        <a className="inline-link" href={transactionUrl(chainId, openHash)} target="_blank" rel="noreferrer">Room transaction ↗</a>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}

function readError(cause: unknown): string {
  if (cause instanceof Error) return cause.message.split("\n")[0];
  return "The wallet rejected or could not send the transaction.";
}

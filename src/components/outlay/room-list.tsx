import { useEffect, useState } from "react";
import type { Address, Hash } from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { outlayAbi } from "../../lib/outlay/artifact";
import {
  canonicalUsdg,
  isSupportedChainId,
  transactionUrl,
  usdgHolderUrl,
} from "../../lib/outlay/chains";
import { erc20Abi } from "../../lib/outlay/erc20";
import { formatUsdg, shortAddress } from "../../lib/outlay/format";
import { useNow } from "../../lib/outlay/use-now";
import type { VerifiedOutlayContract } from "../../lib/outlay/runtime";
import { readTransactionError, waitForSuccessfulReceipt } from "../../lib/outlay/transactions";

type Props = {
  contract?: VerifiedOutlayContract;
  refreshKey: number;
};

type Room = {
  sender: Address;
  payee: Address;
  amount: bigint;
  bounty: bigint;
  remaining: bigint;
  nextRunAt: bigint;
  interval: number;
  settlements: number;
  active: boolean;
};

type PaymentProof = {
  hash: Hash;
  before: bigint;
  after: bigint;
};

export function RoomList({ contract, refreshKey }: Props) {
  const chainId = useChainId();
  const contractAddress = contract?.chainId === chainId ? contract.address : undefined;
  const count = useReadContract({
    address: contractAddress,
    abi: outlayAbi,
    functionName: "roomCount",
    query: { enabled: Boolean(contractAddress) },
  });

  useEffect(() => {
    if (contractAddress) void count.refetch();
  }, [contractAddress, count.refetch, refreshKey]);

  const roomCount = Number(count.data ?? 0n);
  const oldest = Math.max(1, roomCount - 19);
  const ids = Array.from({ length: roomCount - oldest + 1 }, (_, index) => BigInt(roomCount - index));

  if (!contractAddress || !contract) return <p className="rooms-empty">Choose a contract, then open a room to see its settlement here.</p>;
  if (count.isError) return <p className="error rooms-empty" role="alert">Rooms could not be read. Check your network and <button className="text-button" type="button" onClick={() => void count.refetch()}>try again</button>.</p>;
  if (count.isLoading) return <p className="rooms-empty" role="status">Reading rooms from the chain…</p>;
  if (roomCount === 0) return <p className="rooms-empty">No funded rooms yet; open the first room from this wallet.</p>;

  return (
    <section className="rooms-panel" aria-labelledby="rooms-title">
      <div className="panel-heading">
        <div>
          <h3 id="rooms-title">Settlement queue</h3>
        </div>
        <span className="badge">{roomCount} room{roomCount === 1 ? "" : "s"}</span>
      </div>
      <p className="muted">
        Settle a due room to pay its recipient and collect the caller bounty. Any wallet can call.
      </p>

      <div className="room-list">
        {ids.map((id) => (
          <RoomCard
            key={`${contractAddress}:${id}`}
            contract={contract}
            id={id}
            refreshKey={refreshKey}
            onChanged={() => void count.refetch()}
          />
        ))}
      </div>
    </section>
  );
}

function RoomCard({
  contract,
  id,
  refreshKey,
  onChanged,
}: {
  contract: VerifiedOutlayContract;
  id: bigint;
  refreshKey: number;
  onChanged: () => void;
}) {
  const { address } = useAccount();
  const chainId = useChainId();
  const contractAddress = contract.address;
  const publicClient = usePublicClient();
  const now = useNow();
  const [proof, setProof] = useState<PaymentProof>();
  const [settlementHash, setSettlementHash] = useState<Hash>();
  const [refundHash, setRefundHash] = useState<Hash>();
  const [error, setError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const { writeContractAsync, isPending } = useWriteContract();
  const roomRead = useReadContract({
    address: contractAddress,
    abi: outlayAbi,
    functionName: "getRoom",
    args: [id],
  });
  const room = roomRead.data as Room | undefined;

  useEffect(() => {
    void roomRead.refetch();
  }, [refreshKey, roomRead.refetch]);

  if (!room) return <article className="room-card skeleton">{roomRead.isError ? `Could not read room #${id.toString()}.` : `Loading room #${id.toString()}…`}{roomRead.isError && <button className="text-button" type="button" onClick={() => void roomRead.refetch()}>Try again</button>}</article>;

  const due = BigInt(now) >= room.nextRunAt;
  const senderConnected = Boolean(address && address.toLowerCase() === room.sender.toLowerCase());
  const supported = chainId === contract.chainId && isSupportedChainId(chainId);

  async function settle() {
    if (!address || !publicClient || !supported || isConfirming) return;
    setError("");
    setProof(undefined);
    setIsConfirming(true);
    try {
      const token = canonicalUsdg(chainId);
      const before = await publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [room!.payee],
      });
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: outlayAbi,
        functionName: "settle",
        args: [id],
        chainId,
      });
      setSettlementHash(hash);
      await waitForSuccessfulReceipt(publicClient, hash, "Settlement");
      const after = await publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [room!.payee],
      });
      setProof({ hash, before, after });
      await roomRead.refetch();
      onChanged();
    } catch (cause) {
      setError(readTransactionError(cause));
    } finally {
      setIsConfirming(false);
    }
  }

  async function refund() {
    if (!address || !publicClient || !supported || isConfirming) return;
    setError("");
    setIsConfirming(true);
    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: outlayAbi,
        functionName: "refund",
        args: [id],
        chainId,
      });
      setRefundHash(hash);
      await waitForSuccessfulReceipt(publicClient, hash, "Refund");
      await roomRead.refetch();
      onChanged();
    } catch (cause) {
      setError(readTransactionError(cause));
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <article className={`room-card ${room.active ? "" : "closed"}`}>
      <div className="room-title">
        <div>
          <span className="label">Room</span>
          <strong>#{id.toString()}</strong>
        </div>
        <span className={`badge ${room.active && due ? "due" : room.active ? "" : "closed-badge"}`}>
          {!room.active ? "Closed" : due ? "Due" : `In ${formatCountdown(Number(room.nextRunAt) - now)}`}
        </span>
      </div>

      <dl className="room-facts">
        <div><dt>Payee</dt><dd><code title={room.payee}>{shortAddress(room.payee, 6)}</code></dd></div>
        <div><dt>Payout</dt><dd>{formatUsdg(room.amount)} USDG</dd></div>
        <div><dt>Caller earns</dt><dd>{formatUsdg(room.bounty)} USDG</dd></div>
        <div><dt>Remaining</dt><dd>{formatUsdg(room.remaining)} USDG</dd></div>
        <div><dt>Interval</dt><dd>{room.interval === 0 ? "One-shot" : `${room.interval}s recurring`}</dd></div>
        <div><dt>Settlements</dt><dd>{room.settlements}</dd></div>
      </dl>

      <button className="primary full" type="button" disabled={!address || !supported || !room.active || !due || isPending || isConfirming} onClick={settle}>
        {isPending ? "Confirm in wallet…" : isConfirming ? "Confirming transaction…" : `Settle · earn ${formatUsdg(room.bounty)} USDG`}
      </button>
      {senderConnected && room.active && room.settlements === 0 && (
        <button className="text-button" type="button" disabled={!supported || isPending || isConfirming} onClick={refund}>
          Refund before first settlement
        </button>
      )}

      {proof && supported && (
        <div className="proof" role="status">
          <strong>Payee balance changed onchain</strong>
          <span>{formatUsdg(proof.before)} → {formatUsdg(proof.after)} USDG (+{formatUsdg(proof.after - proof.before)})</span>
          <div className="proof-links">
            <a href={transactionUrl(chainId, proof.hash)} target="_blank" rel="noreferrer">Settlement tx ↗</a>
            <a href={usdgHolderUrl(chainId, room.payee)} target="_blank" rel="noreferrer">Payee USDG balance ↗</a>
          </div>
        </div>
      )}
      {settlementHash && !proof && supported && (
        <a className="inline-link" href={transactionUrl(chainId, settlementHash)} target="_blank" rel="noreferrer">Settlement tx ↗</a>
      )}
      {refundHash && supported && (
        <a className="inline-link" href={transactionUrl(chainId, refundHash)} target="_blank" rel="noreferrer">Refund transaction ↗</a>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </article>
  );
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "0S";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}M ${remainder}S` : `${remainder}S`;
}

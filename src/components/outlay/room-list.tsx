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

type Props = {
  contractAddress?: Address;
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

export function RoomList({ contractAddress, refreshKey }: Props) {
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

  if (!contractAddress) return <p className="rooms-empty">Choose a contract, then open a room to see its settlement here.</p>;
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
            key={id.toString()}
            contractAddress={contractAddress}
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
  contractAddress,
  id,
  refreshKey,
  onChanged,
}: {
  contractAddress: Address;
  id: bigint;
  refreshKey: number;
  onChanged: () => void;
}) {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const now = useNow();
  const [proof, setProof] = useState<PaymentProof>();
  const [refundHash, setRefundHash] = useState<Hash>();
  const [error, setError] = useState("");
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
  const supported = isSupportedChainId(chainId);

  async function settle() {
    if (!publicClient || !supported) return;
    setError("");
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
      await publicClient.waitForTransactionReceipt({ hash });
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
      setError(readError(cause));
    }
  }

  async function refund() {
    if (!publicClient || !supported) return;
    setError("");
    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: outlayAbi,
        functionName: "refund",
        args: [id],
        chainId,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setRefundHash(hash);
      await roomRead.refetch();
      onChanged();
    } catch (cause) {
      setError(readError(cause));
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

      <button className="primary full" type="button" disabled={!address || !room.active || !due || isPending} onClick={settle}>
        {isPending ? "Confirm in wallet…" : `Settle · earn ${formatUsdg(room.bounty)} USDG`}
      </button>
      {senderConnected && room.active && room.settlements === 0 && (
        <button className="text-button" type="button" disabled={isPending} onClick={refund}>
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

function readError(cause: unknown): string {
  if (cause instanceof Error) return cause.message.split("\n")[0];
  return "The wallet rejected or could not send the transaction.";
}

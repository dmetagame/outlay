/** 1:1 accounting for Outlay.sol — used by tests. */

export type Room = {
  sender: string;
  payee: string;
  amount: bigint;
  bounty: bigint;
  remaining: bigint;
  nextRunAt: bigint;
  interval: number;
  settlements: number;
  active: boolean;
};

export class OutlayError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export function costOf(amount: bigint, bounty: bigint): bigint {
  if (amount === 0n || bounty === 0n) throw new OutlayError("BadArgs");
  return amount + bounty;
}

export function openRoom(args: {
  sender: string;
  payee: string;
  amount: bigint;
  bounty: bigint;
  funded: bigint;
  nextRunAt: bigint;
  interval: number;
}): Room {
  if (!args.payee || args.payee === args.sender) throw new OutlayError("BadArgs");
  if (args.nextRunAt === 0n) throw new OutlayError("BadArgs");
  const cost = costOf(args.amount, args.bounty);
  if (args.funded < cost) throw new OutlayError("BadArgs");
  return {
    sender: args.sender,
    payee: args.payee,
    amount: args.amount,
    bounty: args.bounty,
    remaining: args.funded,
    nextRunAt: args.nextRunAt,
    interval: args.interval,
    settlements: 0,
    active: true,
  };
}

export function settle(room: Room, now: bigint, settler: string): { leftover: bigint; still: boolean } {
  if (!room.active) throw new OutlayError("Inactive");
  if (now < room.nextRunAt) throw new OutlayError("NotDue");
  const cost = costOf(room.amount, room.bounty);
  if (room.remaining < cost) throw new OutlayError("Inactive");
  room.remaining -= cost;
  room.settlements += 1;
  const still = room.interval !== 0 && room.remaining >= cost;
  let leftover = 0n;
  if (still) {
    room.nextRunAt = now + BigInt(room.interval);
  } else {
    room.active = false;
    leftover = room.remaining;
    room.remaining = 0n;
  }
  void settler;
  return { leftover, still };
}

export function refund(room: Room, sender: string): bigint {
  if (sender !== room.sender) throw new OutlayError("NotSender");
  if (room.settlements !== 0) throw new OutlayError("AlreadyPaid");
  if (!room.active) throw new OutlayError("Inactive");
  const leftover = room.remaining;
  room.remaining = 0n;
  room.active = false;
  return leftover;
}

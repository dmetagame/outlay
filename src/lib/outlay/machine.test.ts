import assert from "node:assert/strict";
import test from "node:test";
import { costOf, openRoom, refund, settle, OutlayError } from "./machine.ts";

const sender = "0xS";
const payee = "0xP";
const settler = "0xK";

function room(over: Partial<Parameters<typeof openRoom>[0]> = {}) {
  return openRoom({
    sender,
    payee,
    amount: 100_000n,
    bounty: 10_000n,
    funded: 110_000n,
    nextRunAt: 1_000n,
    interval: 0,
    ...over,
  });
}

test("cost requires payout and bounty", () => {
  assert.equal(costOf(100n, 10n), 110n);
  assert.throws(() => costOf(0n, 10n), OutlayError);
  assert.throws(() => costOf(10n, 0n), OutlayError);
});

test("payee cannot be sender", () => {
  assert.throws(() => room({ payee: sender }), OutlayError);
});

test("funded must cover one payout plus bounty", () => {
  assert.throws(() => room({ funded: 109_999n }), OutlayError);
});

test("premature settle reverts", () => {
  const r = room();
  assert.throws(() => settle(r, 999n, settler), (e: OutlayError) => e.code === "NotDue");
});

test("one-shot settle pays once, returns leftover, then is final", () => {
  const r = room({ funded: 150_000n });
  const { leftover, still } = settle(r, 1_000n, settler);
  assert.equal(still, false);
  assert.equal(leftover, 40_000n);
  assert.equal(r.active, false);
  assert.equal(r.remaining, 0n);
  assert.equal(r.settlements, 1);
  assert.throws(() => settle(r, 2_000n, settler), (e: OutlayError) => e.code === "Inactive");
  assert.throws(() => refund(r, sender), (e: OutlayError) => e.code === "AlreadyPaid");
});

test("refund cannot follow a completed payout", () => {
  const r = room();
  settle(r, 1_000n, settler);
  assert.throws(() => refund(r, sender), (e: OutlayError) => e.code === "AlreadyPaid");
});

test("refund before any settlement returns the lock", () => {
  const r = room({ funded: 220_000n });
  assert.equal(refund(r, sender), 220_000n);
  assert.equal(r.active, false);
});

test("interval advances from settle time, not the original due", () => {
  const r = room({ interval: 60, funded: 330_000n });
  const first = settle(r, 1_050n, settler);
  assert.equal(first.still, true);
  assert.equal(r.nextRunAt, 1_110n);
  assert.equal(r.remaining, 220_000n);
  assert.throws(() => settle(r, 1_109n, settler), (e: OutlayError) => e.code === "NotDue");
  const second = settle(r, 1_110n, settler);
  assert.equal(second.still, true);
  assert.equal(r.nextRunAt, 1_170n);
  const third = settle(r, 1_170n, settler);
  assert.equal(third.still, false);
  assert.equal(r.active, false);
});

test("isolated remaining never borrows from another room", () => {
  const a = room({ funded: 110_000n });
  const b = room({ funded: 220_000n, interval: 10 });
  settle(a, 1_000n, settler);
  assert.equal(a.remaining, 0n);
  assert.equal(b.remaining, 220_000n);
});

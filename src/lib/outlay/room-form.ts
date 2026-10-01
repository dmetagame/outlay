import { getAddress, isAddress, zeroAddress, type Address } from "viem";
import { parseUsdg } from "./format";

export function validatePayee(
  payee: string,
  sender?: Address,
  contract?: Address,
  token?: Address,
): string {
  if (!payee) return "Enter the second wallet address.";
  if (!isAddress(payee)) return "Enter a valid EVM address.";
  const address = getAddress(payee);
  if (address === zeroAddress) return "Payee cannot be the zero address.";
  if (sender && address === getAddress(sender)) {
    return "Payee cannot be the connected sender.";
  }
  if (contract && address === getAddress(contract)) return "Payee cannot be the Outlay contract.";
  if (token && address === getAddress(token)) return "Payee cannot be the USDG token contract.";
  return "";
}

export function parseRoomFunding(payout: string, bounty: string, periods: string, interval: string) {
  const amount = parseUsdg(payout);
  const callerBounty = parseUsdg(bounty);
  const count = Number.parseInt(periods, 10);
  const seconds = Number.parseInt(interval, 10);
  if (amount <= 0n || callerBounty <= 0n || !Number.isInteger(count) || count < 1) {
    throw new Error("Enter positive payout and bounty amounts, with at least one funded period.");
  }
  if (count > 1 && (!Number.isInteger(seconds) || seconds < 1)) {
    throw new Error("Enter a positive recurring interval in seconds.");
  }
  return {
    amount,
    bounty: callerBounty,
    count,
    interval: count === 1 ? 0 : seconds,
    funded: (amount + callerBounty) * BigInt(count),
  };
}

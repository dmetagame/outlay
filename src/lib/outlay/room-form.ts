import { getAddress, isAddress, type Address } from "viem";

export function validatePayee(payee: string, sender?: Address): string {
  if (!payee) return "Enter the second wallet address.";
  if (!isAddress(payee)) return "Enter a valid EVM address.";
  if (sender && getAddress(payee) === getAddress(sender)) {
    return "Payee cannot be the connected sender.";
  }
  return "";
}

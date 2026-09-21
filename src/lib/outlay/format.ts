import { formatUnits, parseUnits } from "viem";

export const USDG_DECIMALS = 6;

export function parseUsdg(value: string): bigint {
  return parseUnits(value.trim(), USDG_DECIMALS);
}

export function formatUsdg(value: bigint, maximumFractionDigits = 2): string {
  const numeric = Number(formatUnits(value, USDG_DECIMALS));
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

export function shortAddress(value: string, size = 4): string {
  if (value.length < size * 2 + 2) return value;
  return `${value.slice(0, size + 2)}…${value.slice(-size)}`;
}


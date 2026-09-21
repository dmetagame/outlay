import type { Address } from "viem";

export function contractStorageKey(chainId: number): string {
  return `outlay.contract.${chainId}`;
}

export function readStoredContract(chainId: number): Address | undefined {
  if (typeof window === "undefined") return undefined;
  const value = window.localStorage.getItem(contractStorageKey(chainId));
  return value?.startsWith("0x") ? (value as Address) : undefined;
}

export function storeContract(chainId: number, address: Address): void {
  window.localStorage.setItem(contractStorageKey(chainId), address);
}


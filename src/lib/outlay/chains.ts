import { arbitrum, arbitrumSepolia } from "wagmi/chains";
import { defineChain, getAddress, isAddress, type Address, type Chain } from "viem";

export const USDG_BY_CHAIN = {
  [arbitrum.id]: getAddress("0x004B506865409877C9fA29bfb1ebA929984B9bbC"),
  4663: getAddress("0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168"),
  [arbitrumSepolia.id]: getAddress("0xFFC95faa3d63Cde504a05B567C600B78C0b41892"),
} as const satisfies Record<number, Address>;

export type SupportedChainId = keyof typeof USDG_BY_CHAIN;

export const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.mainnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: { name: "Robinhood Blockscout", url: "https://robinhoodchain.blockscout.com" },
  },
});

export const supportedChains = [robinhood, arbitrum, arbitrumSepolia] as const satisfies readonly [
  Chain,
  ...Chain[],
];

export function isSupportedChainId(chainId: number | undefined): chainId is SupportedChainId {
  return chainId !== undefined && chainId in USDG_BY_CHAIN;
}

export function canonicalUsdg(chainId: SupportedChainId): Address {
  return USDG_BY_CHAIN[chainId];
}

export function isCanonicalUsdg(chainId: SupportedChainId, token: string): boolean {
  return isAddress(token) && getAddress(token) === canonicalUsdg(chainId);
}

export function uniswapArbitrumUsdgUrl(): string {
  const token = canonicalUsdg(arbitrum.id);
  return `https://app.uniswap.org/swap?chain=arbitrum&outputCurrency=${token}`;
}

export function uniswapRobinhoodUsdgUrl(): string {
  const token = canonicalUsdg(robinhood.id);
  return `https://app.uniswap.org/swap?chain=robinhood&inputCurrency=ETH&outputCurrency=${token}`;
}

export function explorerBase(chainId: SupportedChainId): string {
  if (chainId === arbitrum.id) return "https://arbiscan.io";
  if (chainId === arbitrumSepolia.id) return "https://sepolia.arbiscan.io";
  return "https://robinhoodchain.blockscout.com";
}

export function transactionUrl(chainId: SupportedChainId, hash: string): string {
  return `${explorerBase(chainId)}/tx/${hash}`;
}

export function addressUrl(chainId: SupportedChainId, address: string): string {
  return `${explorerBase(chainId)}/address/${address}`;
}

export function usdgHolderUrl(chainId: SupportedChainId, holder: string): string {
  const base = explorerBase(chainId);
  const token = canonicalUsdg(chainId);
  if (chainId === robinhood.id) return `${base}/token/${token}?a=${holder}`;
  return `${base}/token/${token}?a=${holder}`;
}

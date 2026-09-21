import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";
import { robinhood, supportedChains } from "./lib/outlay/chains";

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [injected()],
  transports: {
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
    [robinhood.id]: http(robinhood.rpcUrls.default.http[0]),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}


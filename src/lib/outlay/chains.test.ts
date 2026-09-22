import { describe, expect, it } from "vitest";
import { arbitrum } from "wagmi/chains";
import {
  canonicalUsdg,
  isCanonicalUsdg,
  robinhood,
  supportedChains,
  uniswapArbitrumUsdgUrl,
  uniswapRobinhoodUsdgUrl,
} from "./chains";

describe("canonical USDG link", () => {
  it("pins the Paxos Arbitrum One token in the Uniswap inspection URL", () => {
    const token = canonicalUsdg(arbitrum.id);
    const url = new URL(uniswapArbitrumUsdgUrl());

    expect(token).toBe("0x004B506865409877C9fA29bfb1ebA929984B9bbC");
    expect(url.hostname).toBe("app.uniswap.org");
    expect(url.searchParams.get("chain")).toBe("arbitrum");
    expect(url.searchParams.get("outputCurrency")).toBe(token);
    expect(isCanonicalUsdg(arbitrum.id, url.searchParams.get("outputCurrency") ?? "")).toBe(true);
  });

  it("rejects a lookalike output token", () => {
    expect(isCanonicalUsdg(arbitrum.id, "0x0000000000000000000000000000000000000001")).toBe(false);
  });

  it("defaults new sessions to Robinhood Chain", () => {
    expect(supportedChains[0].id).toBe(robinhood.id);
  });

  it("pins native ETH and canonical Paxos USDG in the Robinhood Uniswap URL", () => {
    const token = canonicalUsdg(robinhood.id);
    const url = new URL(uniswapRobinhoodUsdgUrl());

    expect(token).toBe("0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168");
    expect(url.hostname).toBe("app.uniswap.org");
    expect(url.searchParams.get("chain")).toBe("robinhood");
    expect(url.searchParams.get("inputCurrency")).toBe("ETH");
    expect(url.searchParams.get("outputCurrency")).toBe(token);
    expect(isCanonicalUsdg(robinhood.id, url.searchParams.get("outputCurrency") ?? "")).toBe(true);
  });
});

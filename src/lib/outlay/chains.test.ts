import { describe, expect, it, vi } from "vitest";
import { getAddress, keccak256, type Address, type Hex } from "viem";
import { arbitrum } from "wagmi/chains";
import {
  canonicalUsdg,
  isCanonicalUsdg,
  robinhood,
  supportedChains,
  uniswapArbitrumUsdgUrl,
  uniswapRobinhoodUsdgUrl,
} from "./chains";
import { knownOutlayRuntime, verifyOutlayContract } from "./runtime";
import { readStoredContract } from "./storage";

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

describe("verified Outlay selection", () => {
  const address = "0xe1b5d2cf63c43103455abd802b6b241b959a530c" as Address;
  const impostor = "0x1111111111111111111111111111111111111111" as Address;
  const runtime = knownOutlayRuntime(4663)!;

  it("pins the independently verified published Robinhood runtime", () => {
    expect((runtime.length - 2) / 2).toBe(4113);
    expect(keccak256(runtime)).toBe("0x85a19056971ff2d270e7a32ee7ac27a47eb5969331914e6dd46f67206b732ee9");
    expect(knownOutlayRuntime(42161)).toBeUndefined();
    expect(knownOutlayRuntime(421614)).toBeUndefined();
  });

  it("accepts only matching code read on the selected chain", async () => {
    const getCode = vi.fn().mockResolvedValue(runtime);
    const verified = await verifyOutlayContract({ chain: { id: 4663 }, getCode }, 4663, address);
    expect(verified.address).toBe(getAddress(address));
    expect(verified.chainId).toBe(4663);
    expect(getCode).toHaveBeenCalledWith({ address: getAddress(address) });
  });

  it("rejects an impostor even when its usdg getter returns canonical USDG", async () => {
    const client = {
      chain: { id: 4663 },
      getCode: vi.fn().mockResolvedValue("0x60006000fd"),
      readContract: vi.fn().mockResolvedValue(canonicalUsdg(4663)),
    };
    await expect(verifyOutlayContract(client, 4663, impostor)).rejects.toThrow("not a verified Outlay contract");
    expect(client.getCode).toHaveBeenCalledWith({ address: impostor });
    expect(client.readContract).not.toHaveBeenCalled();
  });

  it.each([
    { kind: "missing", code: undefined },
    { kind: "empty", code: "0x" },
    { kind: "altered metadata", code: `${runtime.slice(0, -2)}00` },
  ])("rejects $kind runtime", async ({ code }) => {
    await expect(verifyOutlayContract({ chain: { id: 4663 }, getCode: vi.fn().mockResolvedValue(code) }, 4663, address))
      .rejects.toThrow("not a verified Outlay contract");
  });

  it("rejects a runtime with a different immutable token", async () => {
    const code = runtime.replace(canonicalUsdg(4663).slice(2).toLowerCase(), impostor.slice(2)) as Hex;
    expect(code).not.toBe(runtime);
    await expect(verifyOutlayContract({ chain: { id: 4663 }, getCode: vi.fn().mockResolvedValue(code) }, 4663, address))
      .rejects.toThrow("not a verified Outlay contract");
  });

  it.each([42161, 421614, 1])("fails closed when chain %i has no known runtime", async (chainId) => {
    const getCode = vi.fn().mockResolvedValue(runtime);
    await expect(verifyOutlayContract({ chain: { id: chainId }, getCode }, chainId, address))
      .rejects.toThrow("No verified Outlay runtime is known");
    expect(getCode).not.toHaveBeenCalled();
  });

  it("rejects checking the right code through a different network client", async () => {
    const getCode = vi.fn().mockResolvedValue(runtime);
    await expect(verifyOutlayContract({ chain: { id: 42161 }, getCode }, 4663, address))
      .rejects.toThrow("selected network");
    expect(getCode).not.toHaveBeenCalled();
  });

  it("treats stored addresses as untrusted candidates and rejects malformed storage", async () => {
    const getItem = vi.fn().mockReturnValue("0xnot-an-address");
    vi.stubGlobal("window", { localStorage: { getItem } });
    try {
      expect(readStoredContract(4663)).toBeUndefined();
      getItem.mockReturnValue(impostor);
      const stored = readStoredContract(4663)!;
      await expect(verifyOutlayContract({ chain: { id: 4663 }, getCode: vi.fn().mockResolvedValue("0x6000") }, 4663, stored))
        .rejects.toThrow("not a verified Outlay contract");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

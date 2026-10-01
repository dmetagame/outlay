import { describe, expect, it, vi } from "vitest";
import { zeroAddress, type Address, type Hash } from "viem";
import { parseRoomFunding, validatePayee } from "./room-form";
import { parseUsdg } from "./format";
import { readTransactionError, waitForSuccessfulReceipt } from "./transactions";

const sender = "0x00000000000000000000000000000000000000aa" as Address;
const contract = "0xe1b5d2cf63c43103455abd802b6b241b959a530c" as Address;
const token = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168" as Address;

describe("payee validation", () => {
  it("rejects the connected sender even when casing differs", () => {
    expect(validatePayee("0x00000000000000000000000000000000000000AA", sender)).toBe(
      "Payee cannot be the connected sender.",
    );
  });

  it("rejects empty and malformed addresses", () => {
    expect(validatePayee("", sender)).toBe("Enter the second wallet address.");
    expect(validatePayee("0xnot-an-address", sender)).toBe("Enter a valid EVM address.");
  });

  it("accepts a distinct address", () => {
    expect(validatePayee("0x00000000000000000000000000000000000000bb", sender, contract, token)).toBe("");
  });

  it.each([
    [zeroAddress, "Payee cannot be the zero address."],
    [contract, "Payee cannot be the Outlay contract."],
    [token.toLowerCase(), "Payee cannot be the USDG token contract."],
  ])("rejects payout destinations that cannot receive a room payment: %s", (payee, error) => {
    expect(validatePayee(payee, sender, contract, token)).toBe(error);
  });
});

describe("USDG funding validation", () => {
  it("preserves exact six-place amounts and approves only the typed room funding", () => {
    expect(parseUsdg(" 0.100001 ")).toBe(100001n);
    expect(parseRoomFunding("0.10", "0.01", "1", "60").funded).toBe(110000n);
    expect(parseRoomFunding("0.10", "0.01", "3", "60").funded).toBe(330000n);
    expect(parseRoomFunding("0.000001", "0.000001", "1", "60").funded).toBe(2n);
  });

  it.each(["0.1000009", "0.0000004", "0.0000006", "1.0000000"])("rejects %s before parseUnits can round it", (value) => {
    expect(() => parseUsdg(value)).toThrow("USDG allows at most 6 decimal places.");
  });

  it.each(["payout", "bounty"])("rejects unsupported precision in the %s field", (field) => {
    expect(() => parseRoomFunding(field === "payout" ? "0.1000009" : "0.10", field === "bounty" ? "0.0100009" : "0.01", "1", "60"))
      .toThrow("USDG allows at most 6 decimal places.");
  });

  it.each([["0", "0.01"], ["0.10", "0"], ["-1", "0.01"]])("rejects nonpositive funding %s / %s", (payout, bounty) => {
    expect(() => parseRoomFunding(payout, bounty, "1", "60")).toThrow("positive payout and bounty");
  });
});

describe("wallet receipt boundary", () => {
  const hash = `0x${"a1".repeat(32)}` as Hash;

  it.each(["USDG approval", "Opening room", "Settlement", "Refund"])("rejects a resolved reverted %s receipt before any success callback", async (action) => {
    const client = { waitForTransactionReceipt: vi.fn().mockResolvedValue({ status: "reverted" as const }) };
    const onSuccess = vi.fn();
    await expect(waitForSuccessfulReceipt(client, hash, action).then(onSuccess))
      .rejects.toThrow(`${action} reverted onchain.`);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(client.waitForTransactionReceipt).toHaveBeenCalledWith({ hash });
  });

  it("returns a successful receipt to allow completion", async () => {
    const receipt = { status: "success" as const, transactionHash: hash };
    expect(await waitForSuccessfulReceipt({ waitForTransactionReceipt: vi.fn().mockResolvedValue(receipt) }, hash, "Opening room"))
      .toBe(receipt);
  });

  it("propagates receipt lookup failures instead of treating them as success", async () => {
    const onSuccess = vi.fn();
    await expect(waitForSuccessfulReceipt({ waitForTransactionReceipt: vi.fn().mockRejectedValue(new Error("RPC unavailable")) }, hash, "Settlement").then(onSuccess))
      .rejects.toThrow("RPC unavailable");
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("keeps wallet rejection messages visible", () => {
    expect(readTransactionError(new Error("User rejected the request.\nDetails: wallet rejection")))
      .toBe("User rejected the request.");
    expect(readTransactionError(undefined)).toContain("wallet rejected");
  });
});

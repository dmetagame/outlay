import { describe, expect, it } from "vitest";
import type { Address } from "viem";
import { validatePayee } from "./room-form";

const sender = "0x00000000000000000000000000000000000000aa" as Address;

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
    expect(validatePayee("0x00000000000000000000000000000000000000bb", sender)).toBe("");
  });
});

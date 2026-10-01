import type { Hash, TransactionReceipt } from "viem";

export async function waitForSuccessfulReceipt<T extends Pick<TransactionReceipt, "status">>(
  client: { waitForTransactionReceipt: (parameters: { hash: Hash }) => Promise<T> },
  hash: Hash,
  action: string,
): Promise<T> {
  const receipt = await client.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`${action} reverted onchain. View the transaction for details.`);
  }
  return receipt;
}

export function readTransactionError(cause: unknown): string {
  if (cause instanceof Error) return cause.message.split("\n")[0];
  return "The wallet rejected or could not send the transaction.";
}

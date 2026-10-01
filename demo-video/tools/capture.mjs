// Isolated browser recording. Wallet methods and the entire RPC endpoint are
// intercepted; only the separate published-evidence request is read-only RPC.
import { chromium } from "playwright";
import { createPublicClient, http, decodeFunctionData, encodeFunctionResult, parseAbi } from "viem";
import { outlayAbi } from "../../src/lib/outlay/artifact.ts";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeSource = await readFile(path.join(root, "../src/lib/outlay/runtime.ts"), "utf8");
const pinnedRuntime = runtimeSource.match(/const ROBINHOOD_OUTLAY_RUNTIME = "(0x[a-f0-9]+)"/)[1];
const url = "https://outlay-theta.vercel.app/";
const rpc = "https://rpc.mainnet.chain.robinhood.com";
const contract = "0xe1b5d2cf63c43103455abd802b6b241b959a530c";
const sender = "0xee3ea6f858ae84dd6959f241dfc257a2f8fa3f53";
const payee = "0x4157e84fa929f797cc244d28fd9d48b4c6d43df0";
const token = "0x5fc5360d0400a0fd4f2af552add042d716f1d168";
const hash = "0x8463c5c7a56df5781d443981558f3149f8199740b6aeb6569f8a60059c8cdb12";
const erc20 = parseAbi(["function allowance(address,address) view returns (uint256)", "function balanceOf(address) view returns (uint256)", "function approve(address,uint256) returns (bool)"]);
const client = createPublicClient({transport: http(rpc)});
const receipt = await client.getTransactionReceipt({hash});
const room = await client.readContract({address: contract, abi: outlayAbi, functionName: "getRoom", args: [1n]});
if (receipt.status !== "success" || room.active || room.remaining !== 0n || room.settlements !== 1) throw Error("Published proof differs from expected record");
await mkdir(path.join(root, "public/raw"), {recursive: true});
await mkdir(path.join(root, "public/screens"), {recursive: true});
await writeFile(path.join(root, "src/evidence.json"), JSON.stringify({capturedAt: new Date().toISOString(), chainId: 4663, contract, token, sender, payee, hash, receipt, room}, (_, value) => typeof value === "bigint" ? value.toString() : value, 2) + "\n");

const state = {approved: false, opened: false, settled: false, sends: []};
const browser = await chromium.launch({headless: true, executablePath: process.env.OUTLAY_BROWSER || "/home/rouma/.cache/ms-playwright/chromium-1246/chrome-linux64/chrome", args: ["--no-sandbox", "--disable-dev-shm-usage"]});
const context = await browser.newContext({viewport: {width: 1600, height: 800}, colorScheme: "light", recordVideo: {dir: path.join(root, "public/raw"), size: {width: 1600, height: 800}}});
await context.exposeFunction("outlayDemoWalletSend", async (tx) => {
  const target = tx.to?.toLowerCase();
  const call = decodeFunctionData({abi: target === token ? erc20 : outlayAbi, data: tx.data});
  if (!((target === token && call.functionName === "approve") || (target === contract && ["openRoom", "settle"].includes(call.functionName)))) throw Error("Recording blocks every other wallet request");
  state.sends.push({method: call.functionName, destination: target, intercepted: true});
  await new Promise(resolve => setTimeout(resolve, 900));
  if (call.functionName === "approve") state.approved = true;
  if (call.functionName === "openRoom") state.opened = true;
  if (call.functionName === "settle") state.settled = true;
  return "0x" + ({approve: "a1", openRoom: "a2", settle: "a3"}[call.functionName]).padStart(64, "0");
});
await context.addInitScript(({sender}) => {
  let connected = false;
  const events = {};
  window.ethereum = {
    isMetaMask: true,
    on: (event, callback) => {(events[event] ||= []).push(callback);},
    removeListener: (event, callback) => {events[event] = (events[event] || []).filter(fn => fn !== callback);},
    request: async ({method, params}) => {
      if (method === "eth_requestAccounts") {connected = true; return [sender];}
      if (method === "eth_accounts") return connected ? [sender] : [];
      if (method === "eth_chainId") return "0x1237";
      if (method === "net_version") return "4663";
      if (method === "eth_sendTransaction") return window.outlayDemoWalletSend(params[0]);
      if (method === "wallet_switchEthereumChain") return null;
      const error = new Error("Wallet method blocked in recording: " + method); error.code = 4200; throw error;
    },
  };
  localStorage.clear();
  // A visible cursor is part of the browser capture, rather than invented UI.
  addEventListener("DOMContentLoaded", () => {
    const pointer = document.createElement("div");
    pointer.id = "outlay-recording-pointer";
    pointer.innerHTML = '<svg width="27" height="34" viewBox="0 0 27 34"><path d="M2 2v25l7-7 5 12 5-2-5-11h10Z" fill="#14251d" stroke="white" stroke-width="2"/></svg>';
    pointer.style.cssText = "position:fixed;z-index:2147483647;pointer-events:none;left:40px;top:60px;";
    document.body.append(pointer);
    addEventListener("mousemove", event => {pointer.style.left = event.clientX + "px"; pointer.style.top = event.clientY + "px";});
  });
}, {sender});

function reply(request) {
  const {method, params = []} = request;
  let result;
  if (method === "eth_chainId") result = "0x1237";
  else if (method === "eth_blockNumber") result = "0x4840000";
  else if (method === "eth_getCode") result = params[0].toLowerCase() === contract ? pinnedRuntime : "0x";
  else if (method === "eth_getBalance") result = "0x2386f26fc10000";
  else if (method === "eth_call") {
    const tx = params[0];
    const abi = tx.to.toLowerCase() === token ? erc20 : outlayAbi;
    const call = decodeFunctionData({abi, data: tx.data});
    if (call.functionName === "allowance") result = encodeFunctionResult({abi, functionName: "allowance", result: state.approved ? 110000n : 0n});
    else if (call.functionName === "balanceOf") result = encodeFunctionResult({abi, functionName: "balanceOf", result: call.args[0].toLowerCase() === payee ? (state.settled ? 100000n : 0n) : 326841n});
    else if (call.functionName === "roomCount") result = encodeFunctionResult({abi, functionName: "roomCount", result: state.opened ? 1n : 0n});
    else if (call.functionName === "getRoom") result = encodeFunctionResult({abi, functionName: "getRoom", result: {sender, payee, amount: 100000n, bounty: 10000n, remaining: state.settled ? 0n : 110000n, nextRunAt: 1n, interval: 0, settlements: state.settled ? 1 : 0, active: !state.settled}});
    else throw Error("Unhandled call: " + call.functionName);
  } else if (method === "eth_getTransactionReceipt") result = {transactionHash: params[0], transactionIndex: "0x0", blockHash: "0x" + "11".repeat(32), blockNumber: "0x4840000", from: sender, to: contract, cumulativeGasUsed: "0x186a0", gasUsed: "0x186a0", effectiveGasPrice: "0x13e2690", logs: [], logsBloom: "0x" + "00".repeat(256), status: "0x1", type: "0x2", contractAddress: null};
  else if (method === "eth_getTransactionByHash") result = null;
  else throw Error("Blocked RPC method in recording: " + method);
  return {jsonrpc: "2.0", id: request.id, result};
}
await context.route(rpc + "**", async route => {
  try {
    const payload = route.request().postDataJSON();
    await route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify(Array.isArray(payload) ? payload.map(reply) : reply(payload))});
  } catch (error) {console.error(error.message); await route.abort();}
});
const recordingStart = Date.now();
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
await page.goto(url, {waitUntil: "networkidle"});
await page.evaluate(() => document.fonts.ready);
await page.addStyleTag({content: "body { zoom: 1.12; }"});
const start = recordingStart;
const clips = [];
const hold = ms => page.waitForTimeout(ms);
async function scene(id, action) {
  const from = (Date.now() - start) / 1000;
  await action();
  await page.screenshot({path: path.join(root, "public/screens", id + ".jpg"), type: "jpeg", quality: 90});
  clips.push({id, from, duration: (Date.now() - start) / 1000 - from});
  console.log("Captured " + id);
}
async function move(locator) {
  const box = await locator.boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {steps: 18});
}
await scene("intro", async () => {await hold(6000);});
await scene("contract", async () => {
  await page.getByRole("button", {name: "Connect MetaMask", exact: true}).first().click();
  await hold(1200);
  await page.locator("#desk").scrollIntoViewIfNeeded();
  await page.getByText("Use an existing contract", {exact: true}).click();
  await page.locator("#existing-contract").pressSequentially(contract, {delay: 55});
  await hold(1200);
  await page.getByRole("button", {name: "Use address", exact: true}).click();
  await page.getByText("Contract ready", {exact: true}).waitFor();
  await page.locator(".existing-contract summary").click();
  await hold(3200);
});
await scene("configure", async () => {
  await page.locator("#payee").pressSequentially(payee, {delay: 65});
  await page.getByRole("radio", {name: /Due now/}).check();
  await page.locator(".lock-preview").scrollIntoViewIfNeeded();
  await move(page.locator(".lock-preview"));
  await hold(6500);
});
await scene("approve", async () => {
  const button = page.getByRole("button", {name: "Approve 0.11 USDG", exact: true});
  await button.scrollIntoViewIfNeeded(); await move(button); await hold(1200); await button.click();
  await page.getByRole("button", {name: "Fund and open room", exact: true}).waitFor();
  await hold(6000);
});
await scene("fund", async () => {
  const button = page.getByRole("button", {name: "Fund and open room", exact: true});
  await move(button); await hold(1600); await button.click();
  await page.locator(".room-card").waitFor();
  await page.locator(".rooms-panel").scrollIntoViewIfNeeded();
  await hold(6000);
});
await scene("settle", async () => {
  const button = page.getByRole("button", {name: "Settle · earn 0.01 USDG", exact: true});
  await move(button); await hold(2200); await button.click();
  await page.getByText("Payee balance changed onchain", {exact: true}).waitFor();
  await hold(8000);
});
await scene("proof", async () => {await page.evaluate(() => scrollTo({top: 0, behavior: "smooth"})); await hold(4500); await move(page.locator(".receipt-split")); await hold(3500);});
await scene("recurring", async () => {
  await page.locator(".schedule-options").scrollIntoViewIfNeeded();
  await page.locator(".schedule-options summary").click();
  await page.locator("#periods").fill("3");
  await page.locator("#interval").fill("60");
  await move(page.locator(".lock-preview"));
  await hold(7000);
});
await scene("outro", async () => {await page.evaluate(() => scrollTo({top: 0, behavior: "smooth"})); await hold(4000);});
if (errors.length) throw Error("Browser errors: " + errors.join("; "));
if (state.sends.length !== 3 || !state.settled) throw Error("Expected three intercepted wallet requests");
const raw = await page.video().path();
await context.close();
await browser.close();
await writeFile(path.join(root, "public/raw/manifest.json"), JSON.stringify({raw, clips, sends: state.sends, broadcastCount: 0, viewport: {width: 1600, height: 800}, zoom: 1.12, recordedAt: new Date().toISOString()}, null, 2) + "\n");
console.log("Finished recording. All three wallet requests intercepted; no broadcasts.");

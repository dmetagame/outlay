import {chromium} from "playwright";
import path from "node:path";
import {fileURLToPath} from "node:url";

// A fresh context has no wallet provider, injected fixtures, or RPC interception.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browser = await chromium.launch({headless: true, executablePath: process.env.OUTLAY_BROWSER || "/home/rouma/.cache/ms-playwright/chromium-1246/chrome-linux64/chrome"});
try {
  const page = await browser.newPage({viewport: {width: 1600, height: 800}, colorScheme: "light"});
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto("https://outlay-theta.vercel.app/", {waitUntil: "networkidle"});
      break;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.waitForTimeout(1000);
    }
  }
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({content: "body { zoom: 1.12; }"});
  const proof = await page.locator("#mainnet-proof").innerText();
  for (const expected of ["0.11", "0.10", "0.01", "75738431", "The sender settled this room", "Blockscout verification is incomplete"]) {
    if (!proof.includes(expected)) throw Error("Missing published proof: " + expected);
  }
  await page.screenshot({path: path.join(root, "public/screens/published-proof.jpg"), type: "jpeg", quality: 95});
  console.log("Published proof captured from a fresh, unconnected browser.");
} finally { await browser.close(); }

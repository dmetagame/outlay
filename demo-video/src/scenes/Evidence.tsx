import { interpolate, useCurrentFrame } from "remotion";
import { Frame } from "../Frame";
import evidence from "../evidence.json";
import type { SceneData } from "../types";

const deployment = "0xc0cd9fcba279c431dec9756b865994c127a3727fc2aedd77b400a7cfcef5e432";
const opening = "0xfb921ebeccb21e342e4dee63f518da14ca721f9d1ecf94b46cb84c9d902e4633";
export const Evidence: React.FC<{scene: SceneData}> = ({scene}) => {
  const frame = useCurrentFrame();
  return <Frame scene={scene}>
    <div style={{padding: "50px 70px", color: "#1d2b23", height: "100%", boxSizing: "border-box"}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div><div style={{fontSize: 21, color: "#50775e", letterSpacing: 1}}>PUBLIC PAYMENT RECORD</div><h1 style={{fontWeight: 500, fontSize: 57, margin: "12px 0 32px"}}>Room 1 · Settlement confirmed</h1></div>
        <div style={{fontSize: 24, color: "#2d6a4f", padding: "12px 18px", background: "#e7efe4"}}>✓ Success · Block {evidence.receipt.blockNumber}</div>
      </div>
      <div style={{display: "flex", gap: 44, marginBottom: 33}}>
        {[["PAYEE RECEIVED", "0.10 USDG"], ["CALLER RECEIVED", "0.01 USDG"], ["ROOM REMAINING", "0 USDG"]].map(([label, value], index) => <div key={label} style={{flex: 1, borderTop: "2px solid #2d6a4f", paddingTop: 17, opacity: interpolate(frame, [index * 7, index * 7 + 10], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>
          <div style={{fontSize: 20, color: "#69766c"}}>{label}</div><div style={{fontSize: 51, fontFamily: "IBM Plex Mono", marginTop: 5}}>{value}</div>
        </div>)}
      </div>
      <div style={{borderTop: "1px solid #d4dcd2"}}>
        {[["Deploy", deployment], ["Open room", opening], ["Settle", evidence.hash]].map(([label, hash]) => <div key={label} style={{display: "flex", alignItems: "center", gap: 25, padding: "18px 0", borderBottom: "1px solid #d4dcd2"}}><div style={{width: 138, fontSize: 24}}>{label}</div><div style={{fontFamily: "IBM Plex Mono", fontSize: 23, letterSpacing: -0.6}}>{hash}</div></div>)}
      </div>
      <div style={{display: "flex", gap: 46, marginTop: 28, lineHeight: 1.55, fontSize: 24}}>
        <div style={{flex: 1}}><strong style={{fontWeight: 500}}>Token transfer logs</strong><div style={{color: "#657467"}}>Payee {evidence.payee.slice(0, 10)}… · 100,000 units<br/>Caller {evidence.sender.slice(0, 10)}… · 10,000 units</div></div>
        <div style={{flex: 1}}><strong style={{fontWeight: 500}}>Source verification</strong><div style={{color: "#657467"}}>Sourcify exact match<br/>Blockscout verification incomplete</div></div>
      </div>
      <div style={{marginTop: 24, fontSize: 21, color: "#657467"}}>Sender-settled proof · Canonical USDG has 6 decimals · github.com/dmetagame/outlay/blob/main/proof/PROOF.md</div>
    </div>
  </Frame>;
};

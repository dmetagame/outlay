import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import type { ReactNode } from "react";
import type { SceneData } from "./types";

export const Frame: React.FC<{scene: SceneData; children: ReactNode}> = ({scene, children}) => {
  const frame = useCurrentFrame();
  const proof = scene.kind === "proof";
  return <AbsoluteFill style={{background: "#103b2e", fontFamily: "IBM Plex Sans", color: "#f6f7f3"}}>
    <AbsoluteFill style={{background: "radial-gradient(ellipse at 10% 15%, #527a5833 0%, transparent 48%), radial-gradient(ellipse at 90% 90%, #84a58c33 0%, transparent 55%), linear-gradient(120deg, #09271c 0%, #164b3b 55%, #0c3325 100%)"}} />
    <div style={{position: "absolute", width: 800, height: 800, top: -490, right: -210, border: "1px solid #d6e7d51c", borderRadius: "50%"}} />
    <div style={{position: "absolute", top: 27, left: 106, fontSize: 23, letterSpacing: 0.5, color: "#d2dfd6"}}>{scene.chapter}</div>
    <div style={{position: "absolute", top: 25, right: 106, padding: "6px 15px", fontSize: 20, border: "1px solid #afc7b73b", borderRadius: 6, background: proof ? "#e5eee4" : "#09281ea6", color: proof ? "#225a3d" : "#e0e8e0"}}>
      {scene.kind === "reconstruction" ? "Reconstructed workflow · no new transactions" : proof ? "Published onchain evidence" : "outlay"}
    </div>
    <div style={{position: "absolute", left: 104, top: 86, width: 1712, height: 900, borderRadius: 17, overflow: "hidden", boxShadow: "0 25px 80px #04170e80", background: "#fafbf8", opacity: interpolate(frame, [0, 9], [0, 1], {extrapolateRight: "clamp"}), translate: `0px ${interpolate(frame, [0, 16], [12, 0], {extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)})}px`}}>
      <div style={{height: 44, background: "#eff2ec", borderBottom: "1px solid #d8ddd4", display: "flex", alignItems: "center", padding: "0 21px", gap: 9}}>
        {["#a7b6a9", "#bdc7b9", "#cad2c6"].map(color => <span key={color} style={{height: 9, width: 9, borderRadius: "50%", background: color}} />)}
        <div style={{margin: "0 auto", fontSize: 19, fontFamily: "IBM Plex Mono", color: "#627369"}}>{scene.id === "evidence" ? "proof/PROOF.md · Robinhood 4663" : "outlay-theta.vercel.app"}</div>
        <span style={{width: 39}} />
      </div>
      <div style={{position: "relative", width: "100%", height: 856, overflow: "hidden"}}>{children}</div>
    </div>
    <div style={{position: "absolute", bottom: 0, height: 3, background: "#97b998", width: `${interpolate(frame, [0, scene.durationInFrames], [0, 100])}%`}} />
  </AbsoluteFill>;
};

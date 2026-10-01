import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import type { SceneData } from "../types";

export const Outro: React.FC<{scene: SceneData}> = ({scene}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{fontFamily: "IBM Plex Sans", background: "linear-gradient(120deg, #0b291d, #1c503c)", color: "#f4f7ef", padding: "120px 160px", boxSizing: "border-box"}}>
    <div style={{fontSize: 45, letterSpacing: -2, fontWeight: 500}}>outlay</div>
    <div style={{marginTop: 100, fontSize: 110, letterSpacing: -3, lineHeight: 1.13, maxWidth: 1400, opacity: interpolate(frame, [0, 14], [0, 1], {extrapolateRight: "clamp"}), translate: `0px ${interpolate(frame, [0, 20], [22, 0], {extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)})}px`}}>{scene.title.split(". ").map((line, index) => <div key={line}>{line}{index === 0 ? "." : ""}</div>)}</div>
    <div style={{marginTop: 79, paddingTop: 31, borderTop: "1px solid #b0c6ac55", display: "flex", gap: 130}}>
      <div><div style={{fontSize: 21, letterSpacing: 1, color: "#b3c9b4"}}>EXPLORE THE APP</div><div style={{fontFamily: "IBM Plex Mono", fontSize: 34, marginTop: 13}}>outlay-theta.vercel.app</div></div>
      <div><div style={{fontSize: 21, letterSpacing: 1, color: "#b3c9b4"}}>SOURCE + PAYMENT PROOF</div><div style={{fontFamily: "IBM Plex Mono", fontSize: 34, marginTop: 13}}>github.com/dmetagame/outlay</div></div>
    </div>
  </AbsoluteFill>;
};

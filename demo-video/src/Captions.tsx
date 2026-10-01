import { createTikTokStyleCaptions } from "@remotion/captions";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { Caption } from "@remotion/captions";
import { useMemo } from "react";

export const Captions: React.FC<{captions: Caption[]}> = ({captions}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps * 1000 - 350;
  const {pages} = useMemo(() => createTikTokStyleCaptions({captions, combineTokensWithinMilliseconds: 2500}), [captions]);
  const page = pages.find((page, index) => time >= page.startMs && time < (pages[index + 1]?.startMs ?? page.startMs + page.durationMs + 250));
  if (!page) return null;
  return <div style={{position: "absolute", bottom: 25, left: 210, right: 210, display: "flex", justifyContent: "center", fontFamily: "IBM Plex Sans"}}>
    <div style={{fontSize: 31, lineHeight: 1.3, color: "#f7faf4", padding: "10px 22px", borderRadius: 8, background: "#08251dea", textAlign: "center", maxWidth: 1400, boxShadow: "0 4px 16px #071c1833"}}>
      {page.tokens.map(token => <span key={token.fromMs} style={{color: token.fromMs <= time && token.toMs > time ? "#c1e2b0" : "#f7faf4", whiteSpace: "pre-wrap"}}>{token.text}</span>)}
    </div>
  </div>;
};

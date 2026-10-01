import { CanvasImage, staticFile } from "remotion";
import { Frame } from "../Frame";
import type { SceneData } from "../types";
export const Proof: React.FC<{scene: SceneData}> = ({scene}) => <Frame scene={scene}>
  <CanvasImage src={staticFile("screens/published-proof.jpg")} style={{width: "100%", height: "100%", objectFit: "cover"}} />
</Frame>;

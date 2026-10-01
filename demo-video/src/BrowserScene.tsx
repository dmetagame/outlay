import { Video } from "@remotion/media";
import { staticFile } from "remotion";
import { Frame } from "./Frame";
import type { SceneData } from "./types";

export const BrowserScene: React.FC<{scene: SceneData}> = ({scene}) => <Frame scene={scene}>
  <Video src={staticFile(`footage/${scene.id}.mp4`)} muted style={{width: "100%", height: "100%"}} objectFit="cover" />
</Frame>;

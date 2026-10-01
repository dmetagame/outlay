import { BrowserScene } from "../BrowserScene";
import type { SceneData } from "../types";
export const Intro: React.FC<{scene: SceneData}> = props => <BrowserScene {...props} />;

import { BrowserScene } from "../BrowserScene";
import type { SceneData } from "../types";
export const Configure: React.FC<{scene: SceneData}> = props => <BrowserScene {...props} />;

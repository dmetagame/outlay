import { BrowserScene } from "../BrowserScene";
import type { SceneData } from "../types";
export const Contract: React.FC<{scene: SceneData}> = props => <BrowserScene {...props} />;

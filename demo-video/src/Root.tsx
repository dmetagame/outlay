import { Composition, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { OutlayDemo } from "./Composition";
import timeline from "./timeline.json";

void loadFont({family: "IBM Plex Sans", url: staticFile("fonts/ibm-plex-sans-latin.woff2")});
void loadFont({family: "IBM Plex Mono", url: staticFile("fonts/ibm-plex-mono-latin-400.woff2"), weight: "400"});

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="OutlayDemo" component={OutlayDemo} durationInFrames={timeline.reduce((sum, scene) => sum + scene.durationInFrames, 0)} fps={30} width={1920} height={1080} />
    </>
  );
};

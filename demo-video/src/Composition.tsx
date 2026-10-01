import { Audio } from "@remotion/media";
import { Sequence, staticFile } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { Captions } from "./Captions";
import timeline from "./timeline.json";
import { Intro } from "./scenes/Intro";
import { Contract } from "./scenes/Contract";
import { Configure } from "./scenes/Configure";
import { Approve } from "./scenes/Approve";
import { Fund } from "./scenes/Fund";
import { Settle } from "./scenes/Settle";
import { Proof } from "./scenes/Proof";
import { Evidence } from "./scenes/Evidence";
import { Recurring } from "./scenes/Recurring";
import { Outro } from "./scenes/Outro";

const components = {intro: Intro, contract: Contract, configure: Configure, approve: Approve, fund: Fund, settle: Settle, proof: Proof, evidence: Evidence, recurring: Recurring, outro: Outro};
export const OutlayDemo: React.FC = () => <TransitionSeries>
  {timeline.map(scene => {
    const Component = components[scene.id as keyof typeof components];
    return <TransitionSeries.Sequence key={scene.id} durationInFrames={scene.durationInFrames} name={scene.chapter}>
      <Component scene={scene} />
      <Sequence from={11}><Audio src={staticFile(`voice/${scene.id}.mp3`)} /></Sequence>
      <Captions captions={scene.captions} />
    </TransitionSeries.Sequence>;
  })}
</TransitionSeries>;

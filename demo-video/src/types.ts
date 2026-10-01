import type { Caption } from "@remotion/captions";
export type SceneData = {
  id: string; chapter: string; title: string; kind: string; text: string;
  audioDuration: number; durationInFrames: number; captions: Caption[];
};

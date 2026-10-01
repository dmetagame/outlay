# Outlay demo video

An editable 1920 × 1080, 30 fps product walkthrough, 2:44.93 long. It uses the live Outlay interface, a forest-green frame, generated English narration, timed captions, and an evidence panel.

The visual pacing follows the [Kovrell reference](https://x.com/MystiqueMide/status/2105303495444246574). The framing and typography use Outlay's own palette and self-hosted IBM Plex fonts. No reference footage or audio is included.

The approve/open/settle and recurring chapters are **reconstructions**. Their browser wallet requests and RPC responses are intercepted, and a persistent label identifies them. No wallet is signed and no new transaction is broadcast. The published-proof chapter is captured separately in a fresh browser with no wallet or RPC fixtures. The evidence chapter uses the real receipt and room read saved in [src/evidence.json](src/evidence.json).

The public proof records 0.11 USDG funded, 0.10 paid to the payee, and 0.01 paid to the sender/caller at block 75738431. The sender settled this room. The video preserves the incomplete Blockscout verification and keeper-profit caveats. The original application, contract, runtime, verification kit, and proof files are unchanged.

## Files

- `outlay-demo.mp4`: final H.264 / AAC export, with captions burned in.
- `outlay-demo.srt`: separate timed subtitle file.
- `transcript.txt` and `script.json`: narration text.
- `src/timeline.json`: scene durations and Remotion Caption records.
- `public/footage/`, `public/voice/`, `public/screens/`: reusable recording assets.
- `recording.json` and `verification.json`: capture and verification evidence.
- `src/scenes/`: editable scene components.

## Preview and render

This project is isolated from the wallet application's dependencies and environment files.

```bash
cd demo-video
npm ci
npm run dev -- --no-open
npm run lint
npm run verify
npm run render
```

Remotion can obtain its supported browser automatically. An existing Chrome binary can instead be supplied with `--browser-executable=/absolute/path/to/chrome`. The first export used Remotion 4.0.532 and Chrome for Testing 154.0.8037.0 from the existing Playwright cache.

The generated narration uses `en-GB-RyanNeural` through [edge-tts](https://github.com/rany2/edge-tts), with loudness normalization and a modest tempo adjustment. The audio and exact word-boundary captions are committed; no speech service or key is needed to render them.

## Re-record or change narration

Requires Python with `edge-tts`, FFmpeg/FFprobe, and the root app's installed dependencies for its ABI and viem. Set `OUTLAY_BROWSER` to a local Chrome path when re-recording on another machine.

```bash
npm run voiceover
npm run capture
npm run verify
npm run lint
npm run render
```

Only public narration text is sent to the speech service. Recording scripts never load environment files. `capture.mjs` accepts only intercepted approve/open/settle calls. Published evidence uses read-only RPC. Raw capture is disposable; the edited clips and recording manifest are preserved. To update just the subtitle/transcript exports after changing timed captions, run `python3 tools/prepare.py --subtitles-only`.

Application: https://outlay-theta.vercel.app/

Payment record: https://github.com/dmetagame/outlay/blob/main/proof/PROOF.md

Exact source verification: https://repo.sourcify.dev/4663/0xe1B5d2cF63C43103455ABD802B6B241b959a530c

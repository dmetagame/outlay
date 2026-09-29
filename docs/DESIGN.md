# Outlay settlement desk

Outlay serves judges checking a real payment and operators scheduling the next one. The first
screen explains the contract, shows its completed payment, and leads to the working desk.

## Sources and precedence

Applied installed skills (relative to `~/.agents/skills/`):

- `frontend-design/SKILL.md`: subject-led composition and explicit visual hierarchy.
- `swiss-design/SKILL.md`: IBM Plex Sans, stone neutrals, forest accent, 12-column grid and 8px spacing.
- `dammyjay93-interface-design/SKILL.md`: product navigation, native controls, compact operational
  density, clear transaction states, and semantic tokens.
- `jakubkrehel-better-typography/SKILL.md`: tabular numbers, legible labels, wrapping, loaded font weights.
- `design-engineering/SKILL.md`: purposeful state feedback and accessible form controls.
- `polish/SKILL.md`: final browser, mobile, keyboard, and state checks.

MystiqueMide references: [Ovryth](https://github.com/Mystiquemide/ovryth/blob/main/docs/DESIGN.md)
uses one real financial object and separates UI typography from transaction data;
[Tesrune](https://github.com/Mystiquemide/tesrune/blob/master/docs/DESIGN.md) puts a fixed-order
operator workflow beside its outcomes. These inform structure, not claims of using his private skills.

Specific product requirements override decorative examples: no numbered feature cards, tiny form
labels, gradients, glass, serif, Inter, animated reveals, or invented metrics. Plain CSS remains the
styling system; introducing Tailwind or a component library is unnecessary. Fonts are served locally.

## Visual system

- Canvas: stone-50 `#fafaf9`; working surfaces: stone-100 `#f5f5f4`; rules: stone-200 `#e7e5e4`.
- Text: stone-900 `#1c1917`; supporting text uses that same color at 72%, readable on both surfaces.
- Accent: Swiss forest `#2d6a4f`, used for primary actions and paid/due states. Error states use
  explicit words and a strong border; meaning never depends on color alone.
- Dark mode: stone-950 `#0c0a09`, stone-900 panels, stone-800 rules, stone-50 text; the forest hue is
  lightened for AA contrast. The browser color scheme and native controls follow system preference.
- Typography: IBM Plex Sans 300/400/500/600 for UI; IBM Plex Mono 400/500 for amounts and addresses.
  H1 48–64px desktop / 40px mobile, section titles 32px, panel titles 24px, body 16px, metadata 14px.
  Inputs stay at least 16px. Headings use 300/400; numeric fields and ledger values are tabular.
- Space: 8px base; 8/16/24/32/48/64px steps. Maximum shell 1152px. Hero 6/6; desk 8/4.
  Section gaps are 64px; operator controls use 16–32px grouping rather than marketing padding.
- Depth: surface changes and hairlines only. Structural radius 2px. No drop shadows.
- Interaction: 48px controls, visible 2px focus ring, native links/buttons/details/radios, no custom
  keyboard widgets. Brief button press feedback only, removed for reduced motion.

## Composition and component intent

The signature is the settlement receipt: 0.11 USDG splits into 0.10 for the payee and 0.01 for the
caller. A proportional strip supports labelled amounts; it never pretends to be a live chart.
The same payout/bounty/total order appears in the composer and room records.

- Header: product name, desk/funding navigation, wallet connection; no event branding.
- Hero: the settlement proposition and next action alongside the completed receipt. Actual block,
  contract, settlement and Sourcify links stay inspectable. Both verification/settler caveats remain.
- Contract setup: a horizontal working row with deployment and existing-address selection.
- Composer: payout and bounty lead; payee, due time, recurring options, funding total, then action.
- Settlement queue: room state and earned bounty are easy to find. Empty state gives the next step;
  a closed room keeps its facts visible. Reads that fail display an error rather than an empty success.
- Funding: full-width rows with clear network eligibility; Robinhood route, Arbitrum One warning,
  and official Sepolia faucet remain available before connection.
- Mobile: single column with real reading order, full addresses wrap, no clipped errors or values.

## Invariants

Contract, ABI/bytecode bytes, canonical token addresses, proof facts, and transaction arguments are
unchanged. The deployed proof is a reference, never automatically selected as the user's contract.
The sender settled the proven room. Blockscout verification is incomplete; Sourcify has an exact match.

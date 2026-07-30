<!-- omd:deprecated
replaced_at: 2026-07-29
replaced_by: ./DESIGN.md (bootstrapped from user-provided Slash reference screenshot)
reason: pivot from claude-style test bootstrap to Slash's actual dark/neon brand
-->
---
omd: 0.1
brand: "Project"
bootstrapped_from: claude
bootstrapped_at: "2026-07-29"
source:
  reference_id: claude
  reference_name: "Claude (Anthropic)"
  reference_path: .claude/data/references/claude/DESIGN.md
  homepage: "https://claude.com"
  builder_config_url: "https://oh-my-design.kr/builder?step=preview&ref=claude&cfg=Y2xhdWRlfHx8fHwwfGJ1dHRvbixpbnB1dCx0YWJsZSxjYXJkLGJhZGdlLHRhYnMsZGlhbG9n"
tokens:
  source: reconciled
  extracted: "2026-07-13"
  note: "Selector-backed observations from Anthropic marketing, Claude product overview, and public pricing are retained as separate surface domains. No authenticated chat UI, documentation chrome, or declared-only font asset is represented as a token."
  colors:
    primary: "#c96442"
    canvas: "#f5f4ed"
    surface: "#ffffff"
    foreground: "#141413"
    muted: "#5e5d59"
    surface-dark: "#30302e"
    hairline: "#f0eee6"
    warm-sand: "#e8e6dc"
  typography:
    family: { ui: "Anthropic Sans", display: "Anthropic Serif" }
    display: { size: 64, weight: 500, lineHeight: 1.10, use: "Observed Claude public-route h1" }
    heading: { size: 52, weight: 500, lineHeight: 1.20, use: "Observed Claude public-route h2" }
    body: { size: 20, weight: 400, lineHeight: 1.60, use: "Repeated public-route body and list text" }
    control: { size: 15, weight: 400, lineHeight: 1.60, use: "Observed public-route button and input text" }
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, 3xl: 48 }
  rounded: { sm: 6, md: 8, lg: 12, card: 24, media: 32 }
  components:
    overview-tab: { type: tab, bg: "#ffffff", fg: "#141413", radius: "12px", padding: "8px 16px 8px 12px", font: "20px/400 Anthropic Sans", states: "selected, hover, and pressed observed on the public overview tabs", use: "Selected tab on the public Claude overview" }
    model-card: { type: card, bg: "#ffffff", border: "1px solid #f0eee6", radius: "32px", padding: "48px", use: "Public Claude overview model card" }
    pricing-card: { type: card, bg: "#ffffff", border: "1px solid #f0eee6", radius: "24px", padding: "32px", use: "Public Claude pricing card" }
  components_harvested: true
---

# Design System Inspiration of Claude (Anthropic)

## 1. Visual Theme & Atmosphere

Claude is Anthropic’s public AI product: the official product overview describes it as a conversational tool for bringing together documents, tools, and web knowledge, while Anthropic describes its broader work as building reliable, interpretable, and steerable AI systems. On the supplied public surfaces, that practical role is expressed through a restrained warm-neutral system rather than a generic blue software palette. The Claude overview and pricing pages repeatedly use `#f5f4ed` canvas areas, near-black `#141413` text, white cards, and a mix of loaded Anthropic Sans and Anthropic Serif. Serif display text gives the public product pages an editorial cadence; Sans carries repeated navigation, body, tab, and control text. The capture also records `#c96442` on the overview, but it is a low-frequency observed accent, not evidence that every Claude action is terracotta.

The public system is not a proxy for every Anthropic surface. This reference separates Anthropic’s marketing home, the Claude overview, and public pricing; it does not assert equivalence with authenticated chat, Help Center/documentation chrome, or internal product UI. Components below are only the selector-backed public examples recorded in the supplied capture.

**Key characteristics:**

- Warm public canvas and near-black text: `#f5f4ed` and `#141413`.
- White public cards bounded by the quiet `#f0eee6` hairline.
- Loaded Anthropic Serif for editorial display and loaded Anthropic Sans for public UI/body rhythm.
- Rounded public tabs (12px), pricing cards (24px), and model cards (32px), each tied to a separate selector.
- A limited observed `#c96442` accent, without a universal-action claim.

## 2. Color Palette & Roles

### Selector-backed public colors

- **Near Black** (`#141413`): repeated text, border, and dark-surface value across all three supplied public routes.
- **Parchment Canvas** (`#f5f4ed`): observed overview and pricing background value; it is not claimed as an authenticated-chat canvas.
- **White Surface** (`#ffffff`): selected public tabs and recorded model/pricing cards.
- **Muted Warm Gray** (`#5e5d59`): repeated public overview/pricing text and border value.
- **Dark Surface** (`#30302e`): observed on the public product/pricing surfaces.
- **Hairline Cream** (`#f0eee6`): recorded border and background value, including the public card borders below.
- **Warm Sand** (`#e8e6dc`): recorded public-pricing background value and the overview appearance-toggle ring treatment.
- **Terracotta Accent** (`#c96442`): a low-frequency overview background observation. Treat it as an observed public accent, not a complete action scale.

### Surface boundary

The capture contains no evidence that these values govern Claude’s signed-in conversation UI, support-documentation chrome, or every Anthropic corporate page. It also includes a blue-tinted featured pricing-card variant; that single route-local card is not promoted to the general palette.

## 3. Typography Rules

### Evidence classes

| Evidence class | Family and boundary |
|---|---|
| Official product-use | No first-party typography guide or font license assigning a general product role was found in the reviewed official context sources. The live-font evidence below is the basis for UI-family tokens. |
| Live computed surface-use | **Anthropic Sans** is loaded/high with 1,493 computed uses across the supplied routes; **Anthropic Serif** is loaded/high with 65. Both have computed-family usage plus FontFaceSet/source-URL corroboration in the supplied artifact. |
| Official distributed brand asset | No separate official font-distribution or license page was located in this pass. The browser-served WOFF2 URLs establish delivery on the captured public routes, not a license grant for reuse. |
| Declared-only | `anthropicMono` and JetBrains Mono have captured `@font-face` source URLs but zero visible computed usage. They remain declared-only and are excluded from `tokens.typography.family`. |
| System / unresolved | Arial and Georgia appear only as CSS fallbacks in observed stacks. They are not substitutes for, or tokens representing, Anthropic Sans or Anthropic Serif. |

### Captured hierarchy

| Role | Family | Size | Weight | Line Height | Evidence boundary |
|---|---|---:|---:|---:|---|
| Public h1 | Anthropic Serif | 64px | 500 | 70.4px | two public-route h1 occurrences |
| Public h2 | Anthropic Serif | 52px | 500 | 62.4px | five public-route h2 occurrences |
| Public h3 | Anthropic Serif | 36px | 500 | 46.8px | four public-route h3 occurrences |
| Repeated body/list | Anthropic Sans | 20px | 400 | 32px | public overview/pricing text and list items |
| Public control | Anthropic Sans | 15px | 400 | 24px | observed buttons and inputs; preserve selector-specific geometry |
| Public tab | Anthropic Sans | 20px | 400 | 32px | overview and pricing tab controls |

Do not render a system fallback as a named Anthropic typeface. Anthropic Mono is useful as a declared asset record, but no visible use was captured, so this reference does not claim a mono scale.

## 4. Component Stylings

### Public product navigation

**Selected Overview Tab**
- Background: `#ffffff`
- Text: `#141413`
- Radius: 12px
- Padding: 8px 16px 8px 12px
- Font: 20px / 400 / Anthropic Sans
- Use: `surface-2::[data-omd-capture="5"]`, the selected tab on `https://claude.com/product/overview`.

**Unselected Overview Tab — pressed sample**
- Text: `#5d5c58`
- Radius: 12px
- Padding: 8px 16px 8px 12px
- Font: 20px / 400 / Anthropic Sans
- Pressed: `surface-2::[data-omd-capture="6"]::state-pressed` records `rgba(255, 255, 255, 0.004)` background and `#5d5c58` text.
- Use: Public overview tab; this is the observed pressed state, not a universal hover or focus rule.

### Public cards

**Model Card — overview**
- Background: `#ffffff`
- Text: `#141413`
- Border: 1px solid `#f0eee6`
- Radius: 32px
- Padding: 48px
- Font: 20px / 400 / Anthropic Sans
- Use: `surface-2::div.card_model_wrap.u-theme-white`; four observed overview cards.

**Pricing Card — standard**
- Background: `#ffffff`
- Text: `#141413`
- Border: 1px solid `#f0eee6`
- Radius: 24px
- Padding: 32px
- Font: 20px / 400 / Anthropic Sans
- Use: `surface-3::div.card_pricing_wrap.u-theme-white`; two observed public pricing cards.

**Pricing Card — featured**
- Background: `#ffffff`
- Border: 1px solid `color(srgb 0.415686 0.607843 0.8 / 0.2)`
- Radius: 24px
- Padding: 32px
- Shadow: `rgba(98, 158, 218, 0.16) 0px 4px 20px 0px`
- Use: `surface-3::div.card_pricing_wrap.w-variant-e2cc9fd4-13af-f05c-3a0a-f9943311e113`; one featured public pricing-card variant only.

### Public appearance control

**Appearance Toggle Tile**
- Background: `#e8e6dc` (computed as `color(srgb 0.909804 0.901961 0.862745)`)
- Text: `#4d4c48`
- Radius: 16px
- Shadow: `#e8e6dc 0px 0px 0px 0px, #d1cfc5 0px 0px 0px 1px`
- Font: 16px / 400 / Anthropic Sans
- Use: `surface-2::div.button_toggle_wrap.w-variant-ab355ea0-b722-2f23-3507-f0290f710e57`; one overview control. No selected/disabled variant was captured.

Only tab selection, tab pressed, and tab-panel expansion were observed as interactions. No generic modal, toast, menu, error, disabled, or hover system is inferred from the supplied artifact.

## 5. Layout Principles

### Captured spacing and shape observations

- The artifact clusters 4px, 8px, 12px, 16px, 24px, 32px, and 48px spacing values. This is an observed public-style inventory, not a declared global spacing scale.
- Recorded public radii include 6px, 8px, 12px, 16px, 24px, and 32px. The 12px tab, 24px pricing card, and 32px model card have selector-backed component use above.
- The supplied capture has no mobile viewport, container-width, or responsive-breakpoint measurement. Do not derive breakpoints or a universal grid from this packet.

## 6. Depth & Elevation

The standard public model and pricing card samples are flat white surfaces with `#f0eee6` borders and no computed shadow. One featured pricing card alone uses a cool translucent border and `rgba(98, 158, 218, 0.16) 0px 4px 20px 0px` shadow; the overview appearance control uses a one-pixel warm ring. These are selector-specific observations, not a general elevation scale.

## 7. Do's and Don'ts

### Do

- Use only the selector-backed public values above when recreating these particular public card and tab patterns.
- Keep Anthropic Sans and Anthropic Serif distinct when their browser-loadable sources are available.
- Preserve the selected-tab and featured-pricing treatments as route-local variants.

### Don't

- Don't use Arial, Georgia, Inter, or a system stack while labeling the result Anthropic Sans, Anthropic Serif, or Anthropic Mono.
- Don't generalize the featured pricing-card blue shadow to ordinary cards or product surfaces.
- Don't invent chat composer, error, toast, menu, disabled, or responsive variants that this packet did not observe.

## 8. Responsive Behavior

No responsive breakpoint or mobile-surface evidence was supplied. The reference intentionally has no breakpoint, collapse, or touch-target token claims.

## 9. Agent Prompt Guide

Use the public Claude overview pattern only where the evidence fits: a `#f5f4ed` canvas, near-black text, a white card with the route-specific 24px or 32px radius, and loaded Anthropic Sans/Serif. Treat the values as public-web observations, not as a complete implementation kit for the authenticated chat product.

## 10. Voice & Tone

Official Anthropic sources frame the company as an AI safety and research company building systems people can rely on, and describe Claude’s intended behavior as helpful, honest, thoughtful, and caring. This supports a source-informed public-content voice that is direct, careful about uncertainty, and oriented to practical help; it does not prove a universal copywriting ban list or an app-wide tone specification.

| Context | Source-informed guidance |
|---|---|
| Product explanation | Explain the user outcome and the relevant capability plainly, as the official Claude overview does for conversation, documents, tools, and web knowledge. |
| Safety or policy | Name the tradeoff and intent directly; the Constitution explains both broad safety and genuine helpfulness rather than reducing the topic to a slogan. |
| Company communication | Prefer specific, accountable language about reliable, interpretable, and steerable systems. |

### Do

- State what the product can help a person or organization do.
- Keep safety and helpfulness in the same explanation when both materially affect the outcome.
- Distinguish an intention or policy from an observed product behavior.

### Don't

- Don't present the Constitution’s intended values as a guarantee about every response.
- Don't turn the public product-page tone into an undocumented rule for support, legal, or signed-in surfaces.

<!-- omd:limitation Reference §11 requires project-specific facts (this project's own brand narrative). Replace before shipping; do not fabricate. Philosophy Layer input was skipped at bootstrap time (2026-07-29). -->
## 11. Brand Narrative

[FILL IN: this project's own brand narrative — what it is, who makes it, and why it exists. Do not reuse Anthropic/Claude's company narrative as this project's identity; it is retained above only as design-system inspiration.]

<!-- omd:limitation Reference §12 requires project-specific facts. Replace before shipping; do not fabricate. -->
## 12. Principles

[FILL IN: this project's own product principles, 3-5 bullets with a one-line UI implication each.]

<!-- omd:limitation Reference §13 requires project-specific facts. Replace before shipping; do not fabricate. -->
## 13. Personas

[FILL IN: this project's own user personas/archetypes, 2-4 short entries.]

## 14. States

The supplied capture records only selected/tab-selected and pressed tab behavior, plus tab-panel expansion on the public overview and pricing pages. It does not provide selector-backed empty, loading, error, success, skeleton, or disabled treatments. Those state categories are intentionally left unspecified rather than populated with plausible Claude-like patterns.

## 15. Motion & Easing

No duration, easing, reduced-motion, streaming, or page-transition value was captured. The only interaction evidence is tab selection/pressed state and tab-panel expansion; it establishes neither an animation curve nor a motion scale.

---

**Bootstrapped:** 2026-07-29, via `omd:init` from reference `claude` (mode: inspired). Builder config: `https://oh-my-design.kr/builder?step=preview&ref=claude&cfg=Y2xhdWRlfHx8fHwwfGJ1dHRvbixpbnB1dCx0YWJsZSxjYXJkLGJhZGdlLHRhYnMsZGlhbG9n` (attribution only, not fetched).
**Reference verified:** 2026-07-13
**Tier 1 sources:** https://www.anthropic.com/ (marketing); https://claude.com/product/overview (public product overview); https://claude.com/pricing (public pricing); supplied raw artifact `artifacts/reference-evidence/claude.json`.
**Tier 2 sources:** https://getdesign.md/claude (directory page; no canonical numeric values promoted); https://styles.refero.design/?q=Anthropic → https://styles.refero.design/style/d469cba4-c448-4a43-a033-883f8bfcdc42 (independent analysis; conflicts recorded in `.verification.md`).
**Context sources:** https://www.anthropic.com/company; https://www.anthropic.com/constitution; https://www.anthropic.com/news/claude-new-constitution.
**Conflicts unresolved:** none
**Previous project DESIGN.md:** preserved as `DESIGN_DEPRECATED.md`.

---

## Included Components

The following components are part of this design system:

- Button
- Input
- Table
- Card
- Badge
- Tabs
- Dialog

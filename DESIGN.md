---
omd: 0.1
brand: "Slash"
bootstrapped_from: user-provided reference screenshot (home_design1.png, slash.app dark mode) + product brief
bootstrapped_at: "2026-07-29"
mode: inspired
evidence_note: >
  Dark-theme tokens below are visually estimated from a single static
  screenshot, not a live-computed DOM capture — best-effort reads, not
  pixel-sampled ground truth, verify against real design files/Figma before
  treating any single value as exact. Light-theme tokens are a designed
  extension (no light-mode screenshot was supplied) built to the same
  structure, decided together with the user on 2026-07-29: dark stays flat
  with the brand gradient confined to shapes/lines (the mark, the focus
  ring); light carries the same gradient as a soft background wash instead.
  The earlier blurred/neon glow treatment (blurred halo behind the mark,
  box-shadow glow on focus) was tried and then deliberately removed at the
  user's request — don't reintroduce blur-based glow.
logo:
  type: raster
  path: public/logo.png
  source: "user-provided app icon (slash_gradiant_1 1.png), rounded-square, white '/' on a red→orange→yellow→green→blue→purple gradient"
  use: "Header wordmark icon, favicon. This exact gradient is the brand mark — reserved for the logo, the hero '/' illustration, and the search bar's focus ring only, not for general UI accents."
provider-marks:
  - { id: claude, path: "public/models/claude.svg", source: "simple-icons 'anthropic' slug (CC0)" }
  - { id: chatgpt, path: "public/models/chatgpt.svg", source: "simple-icons 'openai' slug (CC0)" }
  - { id: gemini, path: "public/models/gemini.svg", source: "simple-icons 'googlegemini' slug (CC0)" }
  - { id: antigravity, path: null, source: "no official SVG mark found — the model picker falls back to a generic lucide Rocket icon. Swap in a real asset if/when one is sourced; don't treat the rocket as Google's actual mark." }
tokens:
  colors:
    dark:
      canvas: "#0a0c14"
      surface: "#12141f"
      surface-raised: "#181b2a"
      hairline: "rgba(255,255,255,0.08)"
      focus: "rgba(93,143,255,0.55)"
      foreground: "#f2f4f8"
      muted: "#8b8fa3"
    light:
      canvas: "#f7f7fb"
      surface: "#ffffff"
      surface-raised: "#eef0f6"
      hairline: "rgba(10,12,20,0.08)"
      focus: "rgba(59,130,246,0.5)"
      foreground: "#14151a"
      muted: "#6b7280"
    shared:
      accent-blue: "#5b8cff"
      accent-purple: "#9b6bff"
      accent-green: "#34d399"
  brand-gradient:
    note: "Multi-hue mark gradient, matched to the app-icon's slash bar (2026-07-30 re-match — dropped the earlier purple end-stop, this reference has none). Reserved for the logo/hero '/' and the search bar's focus ring — feature icons above keep their own single-hue accent-blue/purple/green, don't repaint them with this gradient."
    stops: ["#ff4d4d 0%", "#ff9a3d 25%", "#ffd23d 45%", "#4ade80 68%", "#3b82f6 100%"]
    angle: "160deg"
    dark-mode-use: "Confined to shapes/lines only — the hero mark's fill, and a 1.5px gradient ring on the search bar's focused state. No blur/glow."
    light-mode-use: "A soft, low-opacity multi-stop radial wash across the page background (see components.page-background-light), in addition to the same shape/line uses as dark."
  typography:
    family: { ui: "Pretendard Variable", fallback: "-apple-system, system-ui, Segoe UI, Roboto, sans-serif" }
    display: { size: 40, weight: 700, lineHeight: 1.25, use: "Hero heading ('무엇을 도와드릴까요, 사장님?')" }
    body: { size: 16, weight: 400, lineHeight: 1.6, use: "Hero subheading, feature descriptions" }
    control: { size: 15, weight: 500, lineHeight: 1.4, use: "Search input, chips, buttons" }
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, 3xl: 48 }
  rounded: { sm: 8, md: 12, lg: 16, pill: 9999, media: 24 }
  components:
    search-bar: { type: input, bg: "surface", border: "1.5px solid hairline", borderFocus: "1.5px brand-gradient ring (via padding-box trick, not box-shadow)", radius: "9999px (grows to 28px rounded-rect when attachments are present)", padding: "14px 20px" }
    attachment-thumb: { type: card, size: "64px square", radius: "12px", border: "1px solid hairline", use: "Image/file/screenshot preview — lives inside the search bar's own bordered container (top row), not floating above it. Remove (X) button top-right." }
    mock-command-results: { type: panel, bg: "surface", border: "1px solid hairline", radius: "12px", use: "Renders below the search bar when the input matches a registered `/네임스페이스/액션 쿼리` chain (src/lib/mockCommands.ts) — e.g. `/파일/검색 <query>`. Hardcoded result data, clearly logged as mock in the header row. Placeholder for a real backend command-execution API; see §9 for the file-system-access limitation this stands in for." }
    suggestions-dropdown: { type: panel, bg: "surface", border: "1px solid hairline", radius: "12px", use: "Type '/' to browse the command tree (src/lib/commandTree.ts). Highlighted row = foreground/8% bg, driven by ArrowUp/ArrowDown + mouse hover (kept in sync — hovering a row updates the same highlight index keyboard nav uses). Enter selects; a selected namespace re-opens with a trailing '/' to keep browsing its children, a selected leaf appends a trailing space to start the query (except `/모델`, which has no query and opens its own panel instead)." }
    model-picker-panel: { type: panel, bg: "surface", border: "1px solid hairline", radius: "12px", use: "Two-level picker opened by typing exactly `/모델`. Level 1: service list (Claude/ChatGPT/Gemini/Antigravity, each with a brand-mark icon rendered via CSS mask+currentColor so it recolors with the theme — see logo note below). Level 2: that service's model list (e.g. Claude -> Fable 5/Opus 5/Sonnet 5/Haiku 4.5), reached by Enter or click, with a back row to return to level 1. Keyboard: ↑/↓ move, Enter or → drills in / confirms, ← or Esc backs out (Esc at level 1 clears the input). Same highlight-sync-on-hover as the suggestions dropdown. **Picking a model at level 2 ends the interaction** (2026-07-31): it clears the input, which closes the panel and hands focus back to an empty search bar ready for the question — level 2 is the end of the tree, so Enter there means 'done', not 'go deeper', and Esc shouldn't have to double as the way out of a completed choice. Mouse click does the same. The inline picker inside `/모델/검색` only collapses itself, since clearing there would throw away the question already typed. Selection state and model names are mock — no real provider switching exists yet." }
    model-search-chip: { type: panel, bg: "surface", border: "1px solid hairline", radius: "12px", use: "Renders for `/모델/검색 <query>` (real chain, registered in mockCommands' REAL_CHAINS). Shows the currently selected service+model (icon + label) plus a '모델 변경' button, so which model will answer is visible the whole time the user is typing the query — not just at selection time. Clicking '모델 변경' swaps the chip for the same model-picker-panel (opened pre-drilled into the current service/model), without touching the typed query; picking a new model collapses back to the chip. No real API call exists yet — the panel shows a 'mock, 실제 API 연동 전' confirmation line instead of a fabricated answer." }
    file-trash-panel: { type: panel, bg: "surface", border: "1px solid hairline", radius: "12px", use: "Opened by typing exactly `/파일/휴지통`. Each `/파일/검색` result row also gets a Trash2 delete icon. Delete is real (useLocalFileSearch.deleteFile) but is NOT the same as OS trash — the web platform has no API to move a file into the OS trash/recycle bin, so 'delete' copies the file into a `.slash-trash` subfolder of the same granted directory, then removes the original (copy+removeEntry, since the API has no cross-directory move). Trash panel offers 복원 (restore, reverses the copy) and 완전 삭제 (permanent — calls `trashDir.removeEntry`, truly unrecoverable). '완전 삭제' and '휴지통 비우기' both gate on `window.confirm(...)` first — never call them without that confirmation, this is real data loss." }
    tooltip: { type: popover, bg: "surface-raised", border: "1px solid hairline", radius: "8px", font: "12px", offset: "8px below trigger", use: "Hover/focus label for every icon-only button (mic, voice-mode, +, submit, sidebar collapse). Not needed where a visible text label already exists." }
    mic-settings-popover: { type: popover, width: "256px", bg: "surface-raised", radius: "12px", border: "1px solid hairline", anchor: "top-full right-0, mt-2 (opens downward, matching the '+' add-menu's anchor direction — not a drawer; a bottom-sheet Drawer was tried 2026-07-30 and reverted same day)", use: "Opens from a small chevron-down icon that fades in to the left of the mic button on hover. Live input-level meter + audio-input device list (real, via enumerateDevices/getUserMedia) + a '길게 눌러 녹음' hold-vs-toggle switch (real, changes the mic button's interaction model). Thumb position is an explicit left-0.5 base + translate-x-0/translate-x-4 (not an implicit/undefined static position) — off sits left-inset, on sits right-inset, both provably inside the track. Device selection does NOT change what the Web Speech API transcribes — that API has no device parameter; only the popover's own live meter honors the selected device." }
    suggestion-chip: { type: pill, bg: "surface", border: "1px solid hairline", radius: "9999px", padding: "10px 16px", font: "14px/500 Pretendard" }
    feature-badge: { type: icon-badge, size: "56px", radius: "9999px", bgOpacity: 0.14, use: "Web search / AI answers / Safe search column icons" }
    page-background-light: { type: background, layers: "4 low-opacity radial-gradient washes (red/yellow/blue/green corners) over solid canvas", use: "Light theme only — dark theme's canvas stays flat." }
    hero-mark: { status: "removed 2026-07-30 (same day it was demoted to an inline glyph)", use: "The H1 no longer carries any gradient glyph at all — `SlashMark` component was deleted. The brand gradient's only remaining UI use is the search bar's focus ring (see search-bar below); the logo (`public/logo.png`) is a separate raster asset, not this CSS gradient." }
    sidebar: { type: panel, widthExpanded: "260px", widthCollapsed: "68px", bg: "surface", border: "1px solid hairline (right)", use: "App-shell nav — layout pattern only, borrowed from Claude's shell, not its content/colors." }
    settings-dialog: { type: modal, width: "max-w-3xl", height: "min(640px,85vh)", bg: "surface", radius: "16px", scrim: "black/50", use: "Two-pane: category list (left) + active pane (right). Appearance (system/light/dark) control lives here, not as a header quick-toggle." }
components_harvested: false
---

# Design System — Slash

## 1. Visual Theme & Atmosphere

Slash is a natural-language + slash-command AI agent: users either type a plain question and get an LLM-backed answer, or prefix a query with `/` to invoke explicit command/search control (files, web, generative AI, local PC actions). The visual language mirrors that duality — a calm canvas that puts full attention on one focal object (the `/` mark) and one input, with almost no chrome competing for attention.

Slash ships **both a dark and a light theme**, switched by the header's theme toggle and persisted client-side. The two themes place the brand gradient in different roles rather than just inverting the same palette:

- **Dark** (default): flat near-black canvas; the brand gradient appears only as a **shape/line** — a thin gradient ring around the search bar when it's focused (its only remaining use since the hero mark was removed, see below). No blur, no glow.
- **Light**: the same gradient instead washes softly across the **page background** (low-opacity radial tints in the corners), while surfaces go to white/near-white cards. The focus ring stays the same shape/line treatment as dark.

**Key characteristics:**

- Dark canvas is near-black navy (`#0a0c14`), not pure black; light canvas is near-white (`#f7f7fb`) with the soft gradient wash described above.
- **No hero mark** (removed 2026-07-30): the page no longer carries a standalone or inline gradient glyph at all — the H1 is plain text, no icon. The gradient's only remaining UI surface is the search bar's focus ring.
- The logo itself (`public/logo.png`) is a rounded-square app icon: a white `/` on that same multi-hue gradient. It appears small in the sidebar wordmark and as the favicon — a fixed raster asset, not the CSS gradient the focus ring uses.
- Flat surfaces (search bar, chips) sit one step lighter/darker than canvas with a hairline border — depth comes from that one-step contrast, not shadow or glow.
- The search bar's focused state swaps its hairline border for a 1.5px **brand-gradient ring** (a padding-box trick, not a blurred box-shadow) — this is the only strong interactive affordance on the screen.
- A restrained 3-accent system: blue (web/search), purple (AI/reasoning), green (safety/privacy) — each used only in its own small icon badge, never as a general UI color. This is separate from the brand gradient, which is now scoped to the logo asset + the focus ring only.
- Generous negative space; the page reads top-to-bottom as logo (sidebar) → greeting heading → input → examples → reassurance.

## 2. Color Palette & Roles

| Role | Dark | Light |
|---|---|---|
| Canvas | `#0a0c14` | `#f7f7fb` (+ soft gradient wash, see below) |
| Surface (search bar, chips) | `#12141f` | `#ffffff` |
| Surface Raised (hover) | `#181b2a` | `#eef0f6` |
| Hairline border | `rgba(255,255,255,0.08)` | `rgba(10,12,20,0.08)` |
| Focus accent (non-gradient fallback) | `rgba(93,143,255,0.55)` | `rgba(59,130,246,0.5)` |
| Foreground (text) | `#f2f4f8` | `#14151a` |
| Muted (placeholder/help text) | `#8b8fa3` | `#6b7280` |

Shared across both themes:

- **Accent Blue** (`#5b8cff`): web-search iconography.
- **Accent Purple** (`#9b6bff`): AI/answer iconography.
- **Accent Green** (`#34d399`): safety/privacy iconography.
- **Brand Gradient** (`#ff4d4d → #ff9a3d → #ffd23d → #4ade80 → #3b82f6`, 160deg): the logo, the hero `/` mark, and the search bar's focus ring. In light mode it additionally appears as a soft low-opacity background wash — see `tokens.brand-gradient` in the frontmatter.

**Third-party brand marks are exempt from the palette** (2026-07-31): the "Google로 계속하기" button's `G` icon (`LoginPage.tsx`) renders Google's official four-color mark (`#4285F4`/`#34A853`/`#FBBC05`/`#EA4335`) as-is. Unlike the model-picker's service icons (§4, recolored to `currentColor` via CSS mask), Google's mark is trademarked in these exact colors and can't be reskinned to the app palette — this is standard OAuth-button practice, not a palette violation. Don't extend this exemption to marks that don't require it.

### Do

- Reserve the three single-hue accents for their one assigned concept each (blue=search, purple=AI, green=safety); don't reuse them as generic UI decoration elsewhere.
- Reserve the multi-hue brand gradient for the logo/hero mark/focus ring (+ light-mode background wash); don't repaint the feature-icon badges, chips, or buttons with it.
- Keep the canvas/surface contrast subtle in both themes (one step, not a jump to pure black-on-white-card).

### Don't

- Don't add more accent hues beyond the brand gradient and the 3 semantic accents — the restraint is the point.
- Don't reintroduce blur-based glow (halos, box-shadow bloom) — it was tried and deliberately removed. Depth/emphasis comes from the gradient's shape/line placement and the one-step surface contrast, not from blur.

## 3. Typography Rules

Family: **Pretendard Variable** (fallback `-apple-system, system-ui, Segoe UI, Roboto, sans-serif`) — the de facto standard for mixed Korean/Latin product UI; assumed from letterforms in the reference, not confirmed via computed `font-family`. Verify against the actual webfont before shipping.

| Role | Size | Weight | Line height | Use |
|---|---:|---:|---:|---|
| Hero heading | 40px | 700 | 1.25 | "무엇을 도와드릴까요, 사장님?" |
| Hero subheading | 16px | 400 | 1.6 | "파일·웹 검색, 생성형 AI, PC 제어까지 한 번에." |
| Control (input/chips/buttons) | 15px | 500 | 1.4 | Search input text, chip labels |
| Feature title | 16px | 600 | 1.4 | "웹 검색" / "AI 답변" / "안전한 검색" |
| Feature description | 14px | 400 | 1.5 | Muted one-line support copy |

Numbers/labels stay left-aligned inside components; hero copy is center-aligned on the page.

**The whole type scale is user-scalable** (2026-07-31): 설정 > 환경설정 > 글씨 크기 offers 보통 / 크게 / 매우 크게 (×1 / ×1.15 / ×1.3), persisted like the theme and applied as `data-font-size` on the root. Every size above is the 보통 value. It works by redefining the `--text-*` variables that Tailwind's `text-*` utilities already reference, multiplied by one `--font-scale` — **not** by raising the root `font-size`, which would drag the rem-based spacing and sizing along with it and turn a text setting into a page zoom. Spacing and radius (§5) stay fixed at every step, and so do icon sizes (they're px props on lucide components, not CSS). Consequences for new work: **use the type tokens, never a raw px font size** — an arbitrary `text-[15px]` opts that text out of the setting. Two tokens exist for sizes Tailwind lacks: `text-control` (15px, the Control row above) and `text-2xs` (10px, badges and thumbnail filenames). Adding a new step to the scale means adding it to the `@theme` block in `index.css` too, or it silently won't scale.

## 4. Component Stylings

**Search Bar (primary)**
- Shape: full pill (`border-radius: 9999px`) when empty; grows to a 28px-radius rounded rectangle when it's carrying attachments (see Attachment Row below) — height ~64px either way.
- Background: `surface`; default state has a 1.5px `hairline` border (implemented as a 1.5px padding wrapper so the border and the focus treatment share one structure).
- Focus state (or any text present): the wrapper's fill switches from `hairline` to the **brand gradient**, producing a thin gradient ring — no box-shadow, no blur.
- Trailing controls, left to right: mic (always visible, muted; press-and-hold *or* click-to-toggle recording depending on the mic-settings popover's switch — see below) → a conditional slot that shows the `AudioLines` voice-mode icon when the input is empty, or a circular submit button once there's text → a "+" (`Plus`) button opening the add-menu (파일/사진 추가, 스크린샷 캡처하기 — the earlier "웹 검색" toggle item was removed 2026-07-30, it duplicated the `/검색` command tree with no clear distinct purpose).
- **Attachment Row** (2026-07-30): when a screenshot or file is attached, its thumbnail renders *inside* the search bar's own bordered container — a row of `attachment-thumb` cards above the text-input row, sharing the same background/border/gradient-ring as the input. This mirrors a reference chat composer's pattern (attachments live inside the input's own box) rather than floating a detached preview row above the pill.
  - "스크린샷 캡처하기": calls `navigator.mediaDevices.getDisplayMedia`, captures one frame to a canvas, immediately stops the stream (so it behaves like a screenshot, not an ongoing share), and adds it as a thumbnail.
  - "파일 또는 사진 추가": opens a real hidden `<input type="file" multiple>`; images get an object-URL thumbnail, other file types show a generic file-icon card with the filename.
- **Voice input**: mic is real speech-to-text via the browser's Web Speech API (`SpeechRecognition`/`webkitSpeechRecognition`, `lang: ko-KR`), writing the live transcript into the input as you speak. A small `ChevronDown` icon fades in to the left of the mic on hover and opens a **mic-settings popover**: a live input-level meter + real audio-input device list (`enumerateDevices`) with a checkmark on the selected one, and a "길게 눌러 녹음" switch that toggles the mic button between hold-to-record and click-to-toggle (the tooltip label updates to match: "길게 눌러 녹음" vs "클릭해서 녹음"). Note the device picker only drives the popover's own live meter — the Web Speech API itself has no device parameter, so the actual transcription always uses the browser's default input regardless of which device is "selected." Don't imply otherwise in copy.
- **Placeholder hints at both input modes** (2026-07-30 — the nickname greeting moved to the H1 instead, see §1/§11): default placeholder is "무엇이든 물어보세요 · '/'로 명령어도 가능해요", naming both the free-text and slash-command paths up front rather than just a generic "search" prompt. While actively recording, the placeholder switches to "듣고 있어요...". The nickname constant (`src/lib/user.ts`, mock "사장님", already carries its own honorific) is now used by the H1 instead of the placeholder.
- **IME-safe Enter — defer, don't drop (2026-07-30, revised same day)**: the input tracks Hangul/Japanese/Chinese composition via `onCompositionStart`/`onCompositionEnd` (a ref, not state — no need to re-render). An Enter that arrives while `isComposing` is true (or within a ~50ms grace window after composition ends, since some browsers report `isComposing: false` on the very keydown that confirms the last syllable) must **not** run selection/submit inline — doing so double-typed the last syllable, because that one Enter was both confirming the composition and triggering our logic. The first fix simply dropped those Enters, which was wrong in the other direction: since Korean always leaves the final syllable composing, **every** Korean command needed two Enter presses to select or submit. The fix now *defers* instead of dropping — the keydown sets `pendingEnterRef` and the matching **keyup** runs the action, by which point the composition is committed. keyup is used deliberately rather than a timer or effect: it still counts as a user gesture, so `window.open` doesn't trip the popup blocker. All Enter behaviour lives in one `runEnterAction()` so both paths stay identical. Don't reintroduce an early `return` for composing Enters.
  - **A deferred Enter must not outlive its key press (2026-07-31).** The keyup that was supposed to consume `pendingEnterRef` sometimes never arrives — the IME can swallow the keyup of the very Enter that commits a composition. The flag then sat there until some *later* Enter's keyup picked it up, and that Enter ran `runEnterAction()` twice: once on its own keydown, once on the stale flag. In `/모델` that read as one Enter skipping the model list entirely — it entered the service and immediately picked that service's first model, closing the panel. Every keydown now clears the flag before anything else, so a deferred Enter survives only until the next key. Worst case a swallowed keyup costs one extra Enter press; it must never cost a double action.
- **Below-pill panels are an absolute-positioned overlay, not flow layout (2026-07-30 fix)**: suggestions/model-picker/file-search/model-search-chip/trash/hint-text all live inside one `absolute inset-x-0 top-full mt-2` wrapper on the search bar's `relative` root, instead of being normal document-flow siblings. Reason: the whole hero block is vertically centered (`justify-center` on `<main>`), so any panel appearing/growing/shrinking in normal flow changed the hero's total height and re-centered it — visibly shifting the search bar itself, not just the content below it. As an overlay, these panels can appear/disappear freely without moving anything else on the page. They still don't render at all while recording (see IME/interim-transcript note above) — that was a second, independent cause of the same visible symptom.
- **Input-mode coloring — command (`/`) only, never free-text (2026-07-30 correction):**
  - **Idle** (empty): `/` badge = `foreground` on `foreground/8%`; submit slot shows the muted `AudioLines` icon; no helper text.
  - **Free-text** (has text, no leading `/` → goes to the model picked in `/모델`): `/` badge stays the same **neutral** idle style, submit button is a neutral `foreground/12%` circle — deliberately *not* colored. Helper text appears in **`muted`** gray and echoes the actual typed text back (2026-07-30 — was a generic "자연어 질문 모드" line, now names what's being sent): `'{query}'이(가) {모델}에 요청됩니다.` The model name is the live selection, not a fixed string (2026-07-31 — it read "로컬 LLM으로" regardless of what `/모델` had picked, which made the picker look like it changed nothing). **This line is the only place a `/모델` choice is visible outside the picker itself**, so it has to name the real destination. `{모델}` collapses to just the model label when the label already starts with the service name (`Gemini · Gemini 3 Flash` → `Gemini 3 Flash`). Particles stay in the both-forms `이(가)` style throughout the sentence: model labels end in anything from `5` to `o3` to `Flash`, so no single particle is correct.
  - **Command** (leading `/` → explicit web-search/command control): `/` badge and the submit button both go solid **`accent-blue`**; helper text in **`accent-blue`**: "명령어 모드 — Slash 명령으로 웹 검색을 직접 제어해요."
  - Rationale: giving free-text its own accent color (an earlier version used `accent-purple`) made *both* states read as "slash is doing something." Only literal `/`-command mode should look active; free-text must look like the neutral default, just with a (gray) explanatory hint.
- **Command pill + operand input — every command that takes a value (2026-07-31, generalized from 길찾기):** the command never stays in the input as text. The moment a registered command is followed by a space (`/네이버 `, `/구글 `, `/파일 `) — typed, pasted, picked from the dropdown, or clicked as a home-screen example chip — the command moves into an `accent-blue` pill **inside** the search bar and the input is left empty to receive only the value, with the placeholder naming what's wanted (`검색어 입력` / `파일 이름 입력` / `장소 입력` / `출발지 입력`). **The reason is the backend contract, not just looks:** the request carries the command and the query as two separate fields, so the UI must never merge them into one string it would have to re-split. `commandTree.ts` is the single source of truth — a node's `operands: string[]` names the values it takes (`/네이버/길찾기` → `['출발지','도착지']`), and a node without that field takes no value at all (`/모델`, `/파일/휴지통` open panels and stay plain text).
  - **One value** (most commands): the value stays live text in the input — typing updates the helper line, Enter runs the command (deep link) or does nothing if it's still 준비 중. Never chipped.
  - **Two or more values** (`/네이버/길찾기`): each Enter confirms one value into its own pill (`출발지 서울`) with an `X`, because splitting free text can't express multi-word place names (`서울역 롯데월드 타워` — where does it break?). The helper line keeps naming the value being collected until all are in, then reads `{값} → {값} · 아직 준비 중이에요.` — 길찾기 goes through the backend (§9), so the UI's job ends at collecting unambiguous operands and nothing is dispatched yet.
  - `Backspace` on an empty input walks back one step at a time — last value → … → the command text itself (`/네이버/길찾기`, restored **without** the trailing space or it would immediately re-enter the mode), so you can never get stuck inside the mode. Clearing a pill also drops every pill after it — order is meaning, so no gaps.
  - `Escape` is **two-stage** (2026-07-31): it clears the typed value first and leaves the command pill standing, and only exits the mode when the input is already empty. One key to drop a long query without holding `Backspace`, and no way to lose the command while fixing a typo. `⌥ Backspace` (word-wise delete) is the browser's own and works here too — both are listed in the 명령어 가이드 dialog.
  - This keeps the "two modes, one box" principle (§12.2) — still one input, no form panel — and reuses the in-bar pill idea from the attachment row.
- **Submit (2026-07-30, extended 2026-07-31):** until 2026-07-30 the submit button and Enter did nothing at all — there was no submit path in the component. It exists for the deep-link commands only — `/네이버`, `/네이버/지도`, and `/구글` open a new tab (see §9). Everything else — free-text and every other command — still has no submit action, so don't read the button's presence as "every input submits somewhere." Because these hand the user off to another site, their helper text replaces the generic 명령어-모드 line and says so up front, in `accent-blue`: "새 탭에서 네이버 검색으로 열려요." / "새 탭에서 네이버 지도 검색으로 열려요." / "새 탭에서 구글 검색으로 열려요."

**Suggestion Chip**
- Shape: full pill, `padding: 10px 16px`, `gap: 8px` between icon and label.
- Background `#14172a`, `1px solid rgba(255,255,255,0.08)` border.
- Leading icon: small (≈20px) colored badge/emoji specific to the example (e.g. a tech-stack logo for a dev question, a plane for a travel question) — chips double as a gallery of "things you can ask."
- Label is prefixed with a muted `/`, echoing the input's own leading glyph even though these are example free-text queries, not literal commands.

**Feature Badge + Column** (3-up row: 웹 검색 / AI 답변 / 안전한 검색)
- Icon sits in a circular badge, ~56px, background = accent color at ~14% opacity, icon stroke = the accent color itself (blue/purple/green respectively).
- Title bold, 16px, foreground color; description 14px muted, directly beneath.
- Column content is center-aligned; three columns are evenly spaced with generous horizontal gap (no card border/background — this row stays flat, unlike the search bar and chips).

**Sidebar (app shell)**
- Structural pattern only — borrowed from Claude's app shell layout (sidebar collapse behavior, settings-as-modal access), not its colors/copy/content. Own tokens throughout (surface/hairline/foreground/muted).
- **Two different behaviors by width** (2026-07-31): at `md` and up (≥768px) the sidebar is inline — expanded 260px, collapsed to a 68px icon-only rail via its header toggle, content transitions with no reflow jank. Below that it is an off-canvas drawer: hidden entirely, opened by a single `PanelLeft` button pinned at the top-left of the main pane, closed by the scrim, `Escape`, the sidebar's own header toggle, or navigating anywhere. **The 68px rail does not exist on mobile** — a rail earns its place by leaving room for content beside it, which a phone doesn't have, so the only states there are open and closed. The breakpoint lives in JS too (`DESKTOP_QUERY` in `Sidebar.tsx`) because whether to offer the rail is a render decision, not just a style; it must stay equal to Tailwind's `md:`.
- Header row: logo (`public/logo.png`, small) + "Slash" wordmark (hidden when collapsed) on the left, collapse-toggle icon button on the right.
- Primary action: a "새 검색" (new search) button, icon+label, pinned near the top.
- Nav: icon+label rows (히스토리 / 대시보드 / 즐겨찾기 / 파일 / 일정) — only 히스토리 and 대시보드 route anywhere; the rest are named but inert, same as the settings categories (§4 Settings). Muted by default, foreground on hover, no gradient here (gradient stays reserved for the mark/focus-ring/wash per §2).
- Below nav: a "최근" (recent) list of past query strings, plain-text rows, truncate with ellipsis, hidden entirely when collapsed (not just visually squeezed).
- Footer: a profile row (avatar + name + plan label) pinned to the bottom via a border-top hairline; clicking it is how Settings is opened — **there is no separate settings gear in the main content area**, this is the one entry point (mirrors the reference's "settings via profile," not a persistent header icon).
- Surface: `surface` background, `hairline` right border — a distinct flat panel from the main content area (which sits on `canvas`, with the gradient wash in light mode).

**Settings (modal, not a page)**
- Centered overlay dialog, `bg-black/50` scrim, click-outside-to-close.
- Two-pane layout: a left category list (일반/계정/개인정보 보호/결제/사용량/연동 — icon+label, active state = `foreground/10` bg) and a right content pane for the active category.
- 일반 (General) is the only fully-built pane for now: avatar, 성명/닉네임 inputs, a free-text instructions textarea, then a `hairline` divider, then "환경설정" — the **모양** (appearance) control lives here as a 3-icon segmented control (시스템/라이트/다크 — `Monitor`/`Sun`/`Moon`), then **글씨 크기** (보통/크게/매우 크게 — see §3; a matching segmented control, but with word labels since size has no icon that reads unambiguously, and the labels scale with the setting so the choice previews itself), plus a static 검색 결과 글꼴 (result font) dropdown that still does nothing — it now sits next to two live controls, so it reads more like a bug than a placeholder. Other categories render a plain "준비 중이에요" placeholder — present in the nav (for structural fidelity) but intentionally not fleshed out yet.
- This is where theme actually changes — don't add a redundant quick-toggle elsewhere in the UI.
- **Appearance applies to every route, signed in or not** (2026-07-31). `AppearanceProvider` (theme + font size) wraps the router in `App.tsx`, not `AppShell` — the login screen has no shell, so while these hooks lived there it rendered with no `data-theme` at all and fell back to the CSS default (dark) even for someone whose system is set to light. Anything that styles the whole document belongs above the router; anything that needs the sidebar belongs in the shell.

**File search (`/파일`)**
- **Where to search is a setting, not part of the search** (2026-07-31). Folders are added once in 설정 > 일반 > 파일 검색 폴더 (add / remove / 재연결, plus the read-only top-level folder escape hatch and the Chrome-blocks-sensitive-folders warning). The search panel itself only searches. Picking folders inline meant every search asked for two decisions — where, then what — and the rarely-changing one was in the way of the frequent one.
- The results list behaves like the rest of the command surfaces: `↑ ↓` move a highlight, hover moves the same highlight (never two cursors), Enter opens the highlighted file — **not** submit, since for file search the results are the answer, not a step toward one. The panel says so in a footer line rather than leaving it to be discovered.
- **Ten rows, then the rest on request** (2026-07-31): a folder can hold hundreds of matches, and a panel that tall covers the very input you'd use to narrow the search. The footer becomes a `ChevronDown` + "{n}개 더 보기"; expanding scrolls inside a `max-h-64` list rather than growing further. `↓` on the last collapsed row expands and continues to the 11th — the keyboard must be able to reach everything the mouse can. A new query collapses it again, and the highlighted row scrolls itself into view.
- With no folders configured, the panel says so the moment `/파일` opens, with a button that opens the setting — not after the user has typed a query into a search that had nowhere to look.
- One `useLocalFileSearch` instance is shared app-wide through `FileSearchProvider` (`hooks/fileSearchContext.tsx`). Folders are granted in the settings modal and used in the search bar; separate hook instances would mean a folder that exists in one and not the other. It also keeps the folder indexing to one pass.

**Chat detail (`/chat/:id`)**
- Header row (title + 공유) → alternating message column → the same `SearchBar`, sticky at the bottom. The title is the conversation's own one-liner; for a command conversation that line *is* the command (`/파일 견적서`), the same string the history rows show.
- User messages are right-aligned bubbles on `surface`; assistant messages are bare text in the column with no bubble, so the answer reads as the page's content rather than as a reply card. A command conversation puts the command in the same `accent-blue` pill the search bar uses, above the value — the split between command and value survives into the transcript instead of being flattened back into one string.
- **An answer is not always prose.** The assistant block carries an optional typed payload rendered under the text, one of: `web-results` (bordered cards, domain + title + snippet), `file-results` (rows with a file icon and path), `route-steps` (a bordered list with an `accent-blue` summary line on top — for 길찾기, where order is the meaning), `code` (a `pre` on `surface`, horizontally scrollable), `download` (a file card with a 내려받기 button). Add a payload type when a real answer shape needs one; don't dress prose up as a card.
- Downloads are real: the mock file's text content becomes a Blob and downloads under its own name, so a `.csv` is genuine CSV. Mock data should not hand out a file that isn't what its extension claims.
- Mock conversations live in `src/features/chat/mockThreads.ts` and are the **single source for the history/최근/dashboard lists** — those lists are derived from the threads, so every row opens a conversation that exists. Five threads cover the cases worth showing (3 command / 2 free-text) rather than a longer list of rows that lead nowhere. An unknown `:id` gets a plain "이 대화를 찾을 수 없어요" with a way back to /new.

## 5. Layout Principles

- **App shell**: fixed-height sidebar (§4) + a flex-1 scrollable main pane. The main pane **vertically centers** its content (2026-07-30, matches the reference's greeting+input block sitting mid-viewport rather than pinned to the top) — single column, horizontally centered: gradient glyph + heading (inline, one row) → subheading → search bar → suggestion chips → feature row. No "scroll for more" hint — removed at the user's request (2026-07-29); the feature row is the natural end of the page, not a teaser for more content below.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48px — matches the observed gaps between the hero block, input, chip row, and feature row.
- Radius scale: 8px (small controls) / 12–16px (badges) / full-pill (search bar, chips, submit button). Don't use Tailwind's bare `rounded-md`/`rounded-sm` defaults (6px/4px) since they fall outside this scale — use the arbitrary-value form (e.g. `rounded-[8px]`) to stay on-token.
- No responsive/breakpoint evidence in the reference; treat mobile layout as unspecified and design it conservatively (stack the 3-column feature row, keep the search bar full-pill, and the sidebar likely wants to become an overlay/drawer rather than push content — not yet built) rather than inventing a breakpoint system.

## 6. Depth & Elevation

This system has no shadow and no blur/glow elevation scale — depth reads through **flat one-step surface contrast** and the brand gradient's shape/line placement, nothing else:
- The hero `/` mark is a flat gradient-filled shape. No halo, no blur.
- The search bar's focus state swaps its border for a flat 1.5px gradient ring (padding-box trick). No box-shadow bloom.
- Flat surfaces (chips, header) use a 1px hairline border only.
- In light mode, the one exception is the page background itself, which carries a soft low-opacity gradient wash — that wash is background texture, not an elevation/glow effect on a component.

Don't introduce conventional drop-shadows on cards, and don't reintroduce blur-based glow (an earlier version had a blurred halo + box-shadow glow; it was removed at the user's request on 2026-07-29). If something needs to feel "raised," lighten/darken its background one step (`surface` → `surface-raised`).

## 7. Do's and Don'ts

### Do
- Support both dark (default) and light themes via the header toggle; keep every token theme-aware (reference the `dark`/`light` values in `tokens.colors`, never hardcode a raw white/black for surfaces or text).
- Let the `/` glyph recur as a small motif (header logo, search bar leading icon, chip label prefix) — it's the product's namesake and its command trigger, so repetition reinforces both brand and function.
- Keep every semantic accent color scoped to one meaning (blue=search, purple=AI, green=safety).

### Don't
- Don't add drop-shadows to cards/chips, and don't add blur-based glow anywhere — flat shape/line/background gradient placement only (see §6).
- Don't turn the 3-accent system into a larger categorical palette.

## 8. Responsive Behavior

No breakpoint or mobile-viewport evidence was supplied with the reference. Treat responsive behavior as unspecified: build mobile-first with the same component shapes (full-pill input, stacked feature columns) rather than asserting a specific breakpoint set as canonical.

The one breakpoint that now exists is the sidebar's (§4 Sidebar): `md` / 768px, dividing "sidebar sits beside the content" from "sidebar covers the content." It was picked as Tailwind's default rather than measured from a reference — if a real mobile design arrives, this is the number to check first.

## 9. Agent Prompt Guide

When building Slash UI: flat canvas (dark navy or light near-white per active theme), one gradient-filled focal shape per screen (don't repeat the full hero-mark treatment on every page), full-pill search input with a gradient-ring focus state as the primary action, hairline-bordered flat surfaces elsewhere, and the `/` glyph used sparingly as a recurring brand/function motif — never as generic decoration. No blur, no box-shadow glow, in either theme.

**Platform constraint (2026-07-30):** Slash ships as a static web app (Vite → S3/CloudFront, no server, no desktop shell). A pure website **cannot** search or manage the user's whole local filesystem by name — that's outside the browser sandbox. `/파일/검색` (and now delete/restore, see file-trash-panel above) are real, but scoped to one folder the user explicitly grants via the File System Access API's picker each session — not the whole PC. Chrome also hard-blocks granting "sensitive" top-level folders (home dir, Desktop, system folders) regardless of what the user clicks; there's no permission that unlocks those, only picking a more specific subfolder works. Two things the web platform genuinely cannot do, with no permission-based workaround: (1) search/access outside a granted folder, and (2) move a file into the **OS** trash/recycle bin — our "휴지통" is our own `.slash-trash` subfolder, not the real system trash. Whole-PC access needs a native companion process the site talks to over localhost, i.e. a desktop wrapper (Electron/Tauri) or a separate installed agent, not just this website.

**Naver results cannot be embedded (2026-07-30, issue #6):** `search.naver.com` and `map.naver.com` both send `X-Frame-Options: DENY` + `frame-ancestors 'none'`, so there is no way to render Naver inside an in-app split panel or iframe — and Chrome's real side panel is `chrome.sidePanel`, an extension-only API a static site can't call. So `/네이버/지도` is a **deep link that leaves the app** in a new tab (called "방식 1" in the issue), not an in-app result; `window.open` must be called inside the user gesture (click/Enter) or the popup is blocked. Verified: `map.naver.com/p/search/{query}` fully works, and for 검색 the bare `search.naver.com/search.naver?query={q}` is enough — `where`/`sm`/`fbm`/`ie`/`ackey` are entry-point tracking and can be dropped.

`/네이버` (통합검색) was also meant to go through the backend ("방식 2"), but since the deep link needs nothing but the URL above, it ships as one (2026-07-31) — same behavior as `/구글`, and the backend path can take it over later. Understand the trade: a deep link leaves the app, so nothing about that search lands in the thread/history, which is the whole reason 방식 2 exists. `/네이버/길찾기` stays "준비 중" and backend-bound. **`/날씨` left the 네이버 subtree entirely (2026-07-31)** — Naver's weather is itself a repackaged external feed, so asking the user which service should fetch it is a question with no meaningful answer. It's a top-level command whose values the backend takes to a weather API directly; no deep link, no provider child. Two findings drove that and should not be re-litigated: the Naver open API needs a Client Secret that can't ship in a public bundle, and **`map.naver.com/p/directions/{point}/{point}/-/transit` only computes a route when each point carries coordinates** (`{lng},{lat},{name},,`) — names alone (`,,{name},,`) merely prefill the 출발지/도착지 inputs, and a POI type field like `ADDRESS_POI` does not trigger geocoding. Naver's own encoded points are `base62(round((coord + 200) × 10⁷))` over the alphabet `0-9a-zA-Z`, but plain decimal coordinates in the same slot produce an identical route, so that encoding is never required. Also note Naver's Directions API is **car-only — there is no public-transit routing API**, so a transit route cannot be reproduced from Naver's API at all.

## 10. Voice & Tone

Korean-first copy, short and direct ("무엇을 도와드릴까요, 사장님?" / "How can I help, boss?"). The hero heading was briefly "무엇이든 말해보세요." (2026-07-30) — chosen over "검색하세요" since "검색하세요" presumes a known query and Slash also covers the case where the user doesn't know exactly what to search for yet — then changed again the same day to a nickname-greeting form once the gradient glyph was pulled out of the H1; the reasoning about "말하다 not 검색하다" still holds for whatever the exact heading wording is. The example queries mix developer topics (Kubernetes, Spring Boot) with everyday ones (weather, travel), so voice should read as competent-but-approachable — helpful to both technical and non-technical users, never jargon-gatekeeping.

### Do
- Keep primary CTAs and headlines short, direct, and outcome-first ("무엇을 도와드릴까요, 사장님?", not "저희 서비스로 검색해보세요").
- Let example/suggestion copy be genuinely specific (real tool names, real questions), not generic placeholders.

### Don't
- Don't pad reassurance copy ("안전한 검색" / "개인정보는 안전하게") with vague marketing language — keep it as short and concrete as the reference.

## 11. Brand Narrative

Slash (`/`) is an AI agent product: users interact through natural language or explicit `/` slash-commands to search files and the web, invoke generative AI, and control the local PC. The `/` is simultaneously the product's name, its logo, and its literal command trigger — the brand mark and the product mechanic are the same symbol.

## 12. Principles

1. **One symbol does triple duty.** The `/` is name, logo, and command trigger. *UI implication:* reuse the glyph deliberately across header, input, and chips rather than treating logo and functional icon as separate design problems.
2. **Two modes, one box.** The same input accepts free-text (→ LLM answer) and `/`-prefixed commands (→ explicit control). *UI implication:* the input's affordances (leading `/` badge, placeholder copy) must communicate both modes without needing a mode switch or extra chrome.
3. **Calm canvas, one bright moment.** A flat, quiet background with a single gradient-filled focal mark (plus, in light mode, a soft gradient wash behind everything). *UI implication:* resist spreading the gradient to more elements — the mark's intensity only works because it's the exception.
4. **Serve technical and non-technical users equally.** Example queries span Kubernetes to travel planning. *UI implication:* copy and iconography should never assume only a developer audience.

## 13. Personas

**Developer/operator.** Uses Slash for quick technical lookups (Kubernetes, Spring Boot config) and expects `/`-command precision when they want it.

**Everyday user.** Uses Slash like a general assistant (weather, travel planning) via plain natural language, likely unaware of or uninterested in the command syntax until they need it.

**Privacy-conscious user.** The "안전한 검색" pillar suggests a segment who needs explicit reassurance that local-PC-control and personal data handling are safe before they'll grant Slash system-level actions.

## 14. States

Only the search bar's **default** and **focused** (gradient-ring) states are evidenced by the reference. Three input-content states were added per the product brief — idle / free-text / command — see §4 Search Bar for the exact color rules (command = accent-blue, free-text = neutral + gray helper text, never a second accent color). Not observed/specified: empty, loading, error, and success states for search results or command execution — build these conservatively (reuse the surface/border tokens above) and flag any invented state clearly rather than presenting it as verified.

## 15. Motion & Easing

No duration/easing value was captured from the static reference. Reasonable defaults consistent with the "calm, flat canvas" principle: keep motion subtle — a quick (~150–200ms) color/background transition on search-bar focus (border → gradient ring) and on theme toggle; no bouncy/playful easing, no glow fade-ins.

**Exception:** the mic-settings popover's live input-level meter transitions at `75ms`, faster than the 150–200ms UI-motion default. This is intentional — it's a real-time audio visualization, not a state transition, and needs to track the signal closely to read as "live." Don't generalize 75ms to other UI motion.

Treat this section as a starting default, not verified brand motion.

---

**Bootstrapped:** 2026-07-29, from a user-provided reference screenshot + product brief (no live URL/catalog reference — this is a from-scratch brand, not a hybrid variation of an existing catalog entry).
**Revised:** 2026-07-29 (same day) — added the real app-icon logo (`public/logo.png`) and its multi-hue gradient as the brand mark; added a light theme (background-wash gradient) alongside dark (shape/line-only gradient); removed the initial blurred/neon glow treatment at the user's request.
**Revised again:** 2026-07-29 — slimmed the hero mark (was too thick/boxy vs. the logo); restructured the screen into an app shell (collapsible sidebar + settings-as-modal), a layout pattern borrowed from Claude's product shell per the user's reference screenshots — colors/copy/tokens throughout stay Slash's own, only the sidebar-collapse and settings-access *structure* was borrowed. The old persistent header (logo/theme-toggle/help/settings/avatar row in main content) is gone; that content moved into the sidebar and the settings dialog.
**Revised again:** 2026-07-30 — demoted the hero mark to a small inline glyph directly in front of the H1 (no more standalone hero block); re-matched the brand gradient's hex stops to the actual app-icon reference (dropped the purple end-stop); main content now vertically centers instead of pinning to the top; added mic/voice-mode/submit swap in the search bar's trailing controls plus a "+" add-menu (파일/사진 추가, 스크린샷, 웹 검색 toggle); corrected the input-mode coloring so only literal `/`-command mode gets an accent color — free-text no longer gets its own accent (a same-day purple attempt was reverted since any second accent still read as "slash active").
**Revised again:** 2026-07-30 (later same day) — added a reusable `Tooltip` (hover/focus label, 8px radius, `surface-raised`) on every icon-only control; attachments (screenshot capture, file upload) now render inside the search bar's own bordered container instead of floating above it, growing the pill to a 28px-radius rounded rect; added real mic recording (Web Speech API) with a hold-vs-click toggle and a chevron-triggered mic-settings control (live level meter + device list); placeholder now greets by a mock nickname ("사장님").
**Revised again:** 2026-07-30 (later still) — briefly tried converting mic-settings from an anchored dropdown to a bottom-sheet Drawer, then reverted the same day back to the anchored popover (256px, `surface-raised`) after review; added "대시보드" to the sidebar nav between 히스토리 and 즐겨찾기.
**Revised again:** 2026-07-30 (later still) — added "명령어 가이드" to the sidebar nav (opens a dialog listing every registered slash command + shortcut; it reads `commandTree.ts` directly, so new commands appear there with no separate edit); folder-picker now surfaces a real error message when Chrome refuses a "sensitive" top-level folder instead of failing silently; mic-settings popover now opens downward (`top-full`, matching the '+' add-menu) instead of upward, and its toggle thumb uses an explicit left-anchored translate instead of an implicit/undefined static position; `/모델` is now a real two-level picker (service -> that service's models, e.g. Claude -> Fable 5/Opus 5/Sonnet 5/Haiku 4.5) with real brand-mark icons (`public/models/*.svg`, from simple-icons) recolored via CSS mask, plus keyboard (Arrow keys/Enter/Escape) and mouse-hover navigation kept in sync. No official Antigravity mark was available — its icon is a generic Rocket placeholder, not a real logo.
**Revised again:** 2026-07-30 (later still) — added `/네이버` (날씨/검색/지도) and `/구글/검색` to the command tree; generalized the mock-placeholder logic to a `REAL_CHAINS` allowlist so any newly registered chain is automatically "준비 중" without touching that file again; model picker gained ←/→ as alternates for Enter/Escape (→ drills into the highlighted service, ← backs out — both mirrored in the command guide's shortcut list); hero heading changed from "무엇이든 검색하세요." to "무엇이든 말해보세요." (+ subheading now names all three pillars — 파일·웹 검색/생성형 AI/PC 제어) since "검색하세요" presumes the user already knows what to search for, which isn't always true.
**Revised again:** 2026-07-30 (later still) — added `/모델/검색 <query>` as a real chain: it shows which service+model will answer *while the query is still being typed* (not just at selection time) via a persistent chip with a '모델 변경' button that reopens the model-picker pre-drilled into the current service, without clearing the typed query. Command guide's "슬래시 명령어" list stopped flattening the tree into a single flat list of full paths — it now renders one bordered group per top-level namespace (e.g. `/파일`) with its children indented underneath (e.g. `/파일/검색`), so the actual hierarchy is visible instead of every command reading as the same flat level.
**Revised again:** 2026-07-30 (later still) — restructured `/네이버` and `/구글` from service-first to **action-first**: `/네이버/날씨`, `/네이버/검색`, `/네이버/지도`, `/구글/검색` became `/날씨/네이버`, `/검색/네이버`, `/검색/구글`, `/지도/네이버`, plus new `/길찾기/네이버`. Rationale — 날씨/검색/지도/길찾기 aren't unique to one service (both 네이버 and 구글 can plausibly do them), so the action belongs on top with "which service" as the child; this is what let `길찾기` slot in cleanly regardless of whether someone thinks "네이버 위에 길찾기" or "길찾기 위에 네이버" first. `파일` and `모델` stay domain-first since those really are domain-unique, not a shared action across providers — **don't force one convention tree-wide; pick per-node based on whether the action is genuinely provider-agnostic.**
**Revised again:** 2026-07-30 (later still) — fixed an IME double-character bug: pressing Enter right as the last Hangul syllable of a query (e.g. "검색") finished composing could duplicate that syllable, because Enter was both confirming the IME composition and triggering our own suggestion/submit handling. Fixed via composition-tracking refs + a short post-composition grace window in `handleInputKeyDown` — see §4 Search Bar.
**Revised again:** 2026-07-30 (later still) — the file-search folder-picker's empty state now proactively warns "홈 폴더나 바탕화면 같은 최상위 폴더는 브라우저가 막아요" *before* the user clicks "폴더 선택," instead of only explaining it reactively after Chrome's native dialog rejects the folder.
**Revised again:** 2026-07-30 (later still) — removed the hero gradient glyph entirely (`SlashMark` component deleted; brand gradient's only remaining UI use is the search bar's focus ring). H1 changed from "무엇이든 말해보세요." to a nickname greeting, "무엇을 도와드릴까요, 사장님?" — the mock `NICKNAME` constant moved out of `SearchBar.tsx` into a shared `src/lib/user.ts` so both the H1 and (previously) the placeholder could use it. Search bar placeholder changed to "무엇이든 물어보세요 · '/'로 명령어도 가능해요" now that it no longer carries the greeting, naming both input modes instead. Free-text helper text changed from a generic "자연어 질문 모드" label to echoing the actual typed text: `'{query}'이(가) 로컬 LLM으로 요청됩니다.`
**Revised again:** 2026-07-30 (later still) — added real file delete/restore: `/파일/검색` results get a Trash2 icon that moves a file into a `.slash-trash` subfolder (`useLocalFileSearch.deleteFile`, requests `readwrite` permission on the granted folder); a new `/파일/휴지통` command lists trashed files with 복원 (restore) and 완전 삭제 (permanent, `window.confirm`-gated) actions, plus a confirm-gated "휴지통 비우기". Removed the add-menu's "웹 검색" toggle item (redundant with the `/검색` command tree, no clear separate purpose). Platform-constraint note in §9 rewritten — file search/delete are real now (previously described as mocked), and the OS-trash limitation (no web API can move a file to the real system trash) is now documented alongside the folder-access limitation.
**Revised again:** 2026-07-30 (later still) — fixed a layout-jump bug: while recording, the live interim transcript was written into `value` on every syllable, which could flip `isFreeText` true and pop the "자연어 질문 모드"/results panels in and out, growing/shrinking the area below the pill mid-speech. Fixed by hiding all of suggestions/file-search/model-search/trash/hint panels while `isRecording` is true — they reappear once recording stops and the transcript is final, which is a single expected layout change rather than one per syllable.
**Revised again:** 2026-07-30 (later still) — the recording-height-jump bug turned out to have a second, independent cause beyond the interim-transcript one: even outside recording, every below-pill panel was a normal-flow element, so its appearance/disappearance changed the vertically-centered hero block's total height and moved the search bar itself. Fixed by converting all of them to one `absolute` overlay on the search bar's `relative` root (see §4 Search Bar) — panels can now show/hide without shifting anything else on the page.
**Revised again:** 2026-07-30 (later still) — `/네이버/지도` became real as a new-tab deep link (`src/lib/naverDeepLinks.ts`), which required building the search bar's **first submit path** — the button and Enter had been inert until now (see §4 Submit). Naver refuses framing (`frame-ancestors 'none'` on desktop search, mobile search, and map alike — confirmed by actually framing it, not just reading headers) so in-app rendering was never an option. `/네이버` 통합검색, `/네이버/길찾기`, `/네이버/날씨` stay "준비 중": the first two go through the backend, and the last has no Naver weather API at all. Decision record: issue #6.
**Revised again:** 2026-07-30 (later still) — `/네이버/길찾기` takes 출발지·도착지 as two stepped operands with in-bar pills instead of splitting one query string (§4 Stepped input), and stops there — collecting operands for the backend rather than opening anything. Also decided **against** `/네이버/지도/길찾기`: `parseCommandChain` is two-level only so a three-level command parses to `null` and would appear in the dropdown while doing nothing on Enter; Naver's own URLs treat `/p/search` and `/p/directions` as siblings, not parent/child; and re-nesting undoes the flattening decided a few revisions earlier.
**Revised again:** 2026-07-30 (later still) — fixed the flip side of the IME Enter guard: dropping composing Enters meant Korean input needed two Enter presses for every selection/submit. Now deferred to keyup instead of dropped, with all Enter behaviour consolidated into one `runEnterAction()` (§4 IME-safe Enter). Also checked whether Naver could be shown inside the app after all: 통합검색 stays impossible (`frame-ancestors 'none'`, confirmed by framing it and reading the browser's own refusal), but `ko.dict.naver.com`, `kin.naver.com`, and `section.blog.naver.com` **do** render in an iframe — they send no framing header. That is an absence of a header, not a promise, and the frame stays cross-origin (unreadable, so no LLM post-processing), and `search.shopping.naver.com` frames but serves a bot-block page. Treat in-app Naver surfaces as opportunistic, never load-bearing.
**Revised again:** 2026-07-30 (later still) — `/구글 <검색어>` became a real new-tab deep link (`google.com/search?q={q}`, nothing else needed), and `naverDeepLinks.ts` was renamed to the provider-neutral `deepLinks.ts` now that it serves more than Naver. Google cannot be embedded either: `/search` sends `X-Frame-Options: SAMEORIGIN`, and while the undocumented `igu=1` parameter does drop that header, Google then serves a reCAPTCHA "비정상적인 트래픽" page instead of results — not a foundation to build on, and not something to work around.
**Revised again:** 2026-07-31 — the stepped in-bar pill input, until now special-cased for `/네이버/길찾기`, became **how every command that takes a value works** (§4 Command pill + operand input): `/네이버 배구구` no longer sits in the input as one string. Driven by the backend contract — the request sends the command and the query as two fields, so the UI holds them apart from the first keystroke instead of re-splitting a joined string. `commandTree.ts` gained `operands: string[]` per node (which also replaced `defaultAction`, which had meant the same "this node takes a query" in a less useful shape), and the home-screen example chips now carry `{ path, operands }` instead of a pre-joined string. One-value commands keep their value as live text (Enter runs it); only multi-value commands chip each confirmed value, so 길찾기's flow is unchanged.
**Revised again:** 2026-07-31 (later same day) — `/네이버 <검색어>` became a real new-tab deep link (`search.naver.com/search.naver?query={q}`), so 통합검색 now behaves exactly like `/구글` instead of showing "준비 중" (§9). The URL was already verified last session; re-verified in headless Chrome that it renders real results with no bot-block and no redirect. This is an interim stand-in for the backend path, not a reversal of it — `/네이버/길찾기` and `/네이버/날씨` still have no deep link (no coordinates / no Naver weather API).
**Revised again:** 2026-07-31 (later still) — picking a model in `/모델` now ends the interaction (clears the input, closing the panel back to an empty search bar) instead of only moving a checkmark, and the free-text helper line names the **selected** model instead of the fixed "로컬 LLM" (§4). The two were one problem: `/모델` had no visible effect anywhere, because the only surface that ever named a model was `/모델/검색`'s chip — and that command is not in `commandTree.ts` and never was (checked back to the first commit `0ea4bd1`; it's registered in `REAL_CHAINS` only), so it is reachable solely by typing the whole path by hand. Open question left standing: whether free text really goes to the picked cloud model or to a local LLM. The copy now says the former; if the latter is right, `/모델` needs a 로컬 option and this line flips back.
**Revised again:** 2026-07-31 (later still) — 설정 > 환경설정 gained **글씨 크기** (보통/크게/매우 크게), making the whole type scale user-scalable (§3). Scaling is done on the `--text-*` variables rather than the root `font-size`, so text grows while the spacing and radius scales stay exactly where the brand put them. The 10 hardcoded `text-[15px]`/`text-[10px]`/`text-[11px]` usages became the new `text-control`/`text-2xs` tokens — a raw px font size is now the one way to accidentally opt out of the setting (the 11px plan label moved to 10px in the process, since two micro-tokens one pixel apart is not a distinction worth keeping).
**Revised again:** 2026-07-31 (later still) — `/chat/:id` finally reads its `:id` (§4 Chat detail): the page rendered one hardcoded thread, so all three lists routed correctly and then showed the same conversation. Mock conversations became the single source the history/최근/dashboard lists derive from, which cut the lists from 10 rows to 5 — a row that opens nothing is worth less than one that opens the right thing. The five cover 3 slash-command cases and 2 free-text ones, and each returns a different shape (web results / file results + download / route steps / code / download), because "the answer is text" was never the whole product.
**Revised again:** 2026-07-31 (later still) — `/네이버/날씨` became top-level `/날씨` (§9). Naver only repackages an external weather feed, so "which service fetches it" isn't a question worth asking the user; the backend calls a weather API directly and returns the value. This is the per-node rule from the 2026-07-30 action-first note applied in the one direction it actually holds: 지도 and 길찾기 stay under 네이버 because the provider genuinely changes the answer, 날씨 doesn't. Don't read it as a return to an action-first tree.
**Revised again:** 2026-07-31 (later still) — `/파일`'s folder picking moved out of the search panel into 설정 > 일반 (§4 File search), and the results list became keyboard-driven (↑↓ + Enter opens). Searching had been asking for two decisions at once — which folders, then which file — with the one that almost never changes sitting in front of the one that always does. The hook is now shared through `FileSearchProvider` since the two halves live in different components.
**Revised again:** 2026-07-31 (later still) — theme and font size moved from `AppShell` to an `AppearanceProvider` around the router, because the login screen isn't inside the shell and was therefore stuck on dark regardless of the OS setting (§4 Settings). Same session: `/파일` results collapse to 10 with a "{n}개 더 보기" chevron, expanding into a scrollable list — `↓` past the last visible row expands rather than dead-ending, since a keyboard user has to be able to reach row 11. `MAX_RESULTS` went 20 → 100 now that the list isn't obliged to show them all at once.
**Revised again:** 2026-07-31 (later still) — the sidebar became an off-canvas drawer below `md` (§4 Sidebar, §8): hidden by default, opened by one button at the top-left of the content, closed by the scrim / Escape / navigation. Collapsing to the 68px rail stays a desktop-only idea — the rail exists so content can sit beside it, which is exactly what a phone doesn't have. First real breakpoint in the project.
**Superseded bootstrap material:** this project was first bootstrapped from a claude-style test reference, then pivoted to Slash's own brand on 2026-07-29. Those two files (`DESIGN_DEPRECATED.md`, `DESIGN_DEPRECATED_claude.md`) were deleted on 2026-07-30 — a competing palette sitting in the repo root was more likely to be grepped by mistake than to be useful. They remain in git history at commit `0ea4bd1` if ever needed.

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

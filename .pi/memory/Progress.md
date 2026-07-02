# Progress

## In Progress

## Completed (this session)

- [x] Phase 1 — Foundations (tag `mvp-1-foundations`): Tauri v2 + React + TS scaffold, frameless draggable macOS window, strict TS + `@/*` aliases, parchment App.tsx, structured logger (10 tests, tsc clean)
  - [x] 1.1–1.7 Scaffold, frameless window, strict config, App.tsx, logger (10 tests), git, drag-region fix (user-verified)

- [x] Phase 2 — Canvas (tag `mvp-2-canvas`): React Flow 12.11.1, sensory theme + SVG grain, pan/zoom, coordinate/theme helpers — 21 canvas tests + 1 App shell test (32 total)
  - [x] 2.1 `canvasHelpers.ts` — clampZoom, viewportContains, canvasToScreen/screenToCanvas (10 tests)
  - [x] 2.2 `canvasTheme.ts` — CINE_THEME tokens, injectCSSVars, injectGrainFilter (10 tests)
  - [x] 2.3 `CanvasRoot.tsx` + `ImageNode.tsx` — wired in flex:1 below the drag strip, empty canvas with grid background
  - [x] 2.4 Data model types (`FilmFrame`, `CanvasImageData`, etc.) in `src/search/types.ts`
  - [x] 2.5 Adaptations: PanOnScrollMode enum (v12), local ImageNodeData type (keeps pure types.ts isolated)
  - [x] 2.6 Phase 2 correction: make the canvas visually distinct from Phase 1 with major/minor React Flow backgrounds, visible canvas class, Space/middle/right pan config, disabled double-click zoom, `onlyRenderVisibleElements`, and CanvasRoot render coverage (21 canvas tests)
  - [x] 2.7 Phase 2 polish/performance correction: moved the macOS drag strip to a transparent absolute overlay above a full-height canvas; removed the full-window SVG filter overlay that made panning laggy; kept cheap CSS texture + React Flow backgrounds; added App shell regression coverage

- [x] Phase 3 — SearchEngine: hybrid CLIP (text int8) + Orama + color search (no UI): `@orama/orama` 3.1.18 + `@huggingface/transformers` 4.2.0, vector/color helpers, injectable CLIP text embedder, Orama title/director boost, §4.3 fusion weights — 38 search tests (70 total), tsc/build clean
  - [x] 3.1 `vectorMath.ts` — dot product, magnitude, normalization, cosine similarity (12 focused tests)
  - [x] 3.2 `colorUtils.ts` — strict HEX parsing, RGB distance, normalized color similarity (10 focused tests)
  - [x] 3.3 `searchEngine.ts` — idempotent ingest, `search`, `searchByColor`, `embedText`, stats/reset, no-throw search failures, offline CLIP model path `/models/`

- [x] Phase 4 — Spotlight: `Cmd+F` opens a pointer-positioned spotlight, arrow navigation wraps, Escape closes, Enter drops the selected result as a React Flow image node; `static_index.json` loads quietly when present; SearchEngine is lazy-loaded after frames exist — 26 new Phase 4 tests (96 total), tsc/build clean
  - [x] 4.1 `spotlightReducer.ts` — open/close/query/navigation/result-count state transitions
  - [x] 4.2 `useCanvasDrop.ts` — image node creation, max 400px width, aspect ratio preserved, unique ids
  - [x] 4.3 `Spotlight.tsx` + `CanvasRoot.tsx` wiring — keyboard open/search/nav/confirm, canvas drop through `screenToFlowPosition`, covered by a mocked user-flow drop test
  - [x] 4.4 `staticIndex.ts` — loads `public/static_index.json` when available and returns empty on absent/invalid index

## Backlog (next up)

- [ ] Phase 5 — Graph: AnnotationStore + ConnectionStore
- [ ] Phase 6 — Manipulation: rotate/scale/grayscale/duplicate, local import/paste, marquee, align/pack/unify, groups
- [ ] Phase 7 — Audio & Motion (Framer Motion spring, Web Audio sprite)
- [ ] Phase 8 — Export (PNG) + always-on-top pin
- [ ] Phase 9a — Crawler (`pnpm crawl` → raw_catalog.json)
- [ ] Phase 9b — Ingest (`pnpm ingest` → static_index.json + thumbs)

## Blocked

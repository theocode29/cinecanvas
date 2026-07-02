# Progress

## In Progress

## Completed

- [x] Phase 1 — Foundations (tag `mvp-1-foundations`): Tauri v2 + React + TS scaffold, frameless draggable macOS window, strict TS + `@/*` aliases, parchment App.tsx, structured logger (10 tests, tsc clean)
  - [x] 1.1–1.7 Scaffold, frameless window, strict config, App.tsx, logger (10 tests), git, drag-region fix (user-verified)

- [x] Phase 2 — Canvas (tag `mvp-2-canvas`): React Flow 12.11.1, sensory theme + SVG grain, pan/zoom, coordinate/theme helpers — 20 tests (30 total)
  - [x] 2.1 `canvasHelpers.ts` — clampZoom, viewportContains, canvasToScreen/screenToCanvas (10 tests)
  - [x] 2.2 `canvasTheme.ts` — CINE_THEME tokens, injectCSSVars, injectGrainFilter (10 tests)
  - [x] 2.3 `CanvasRoot.tsx` + `ImageNode.tsx` — wired in flex:1 below the drag strip, empty canvas with grid background
  - [x] 2.4 Data model types (`FilmFrame`, `CanvasImageData`, etc.) in `src/search/types.ts`
  - [x] 2.5 Adaptations: PanOnScrollMode enum (v12), local ImageNodeData type (keeps pure types.ts isolated)

## Backlog (next up)

- [ ] Phase 3 — SearchEngine: hybrid CLIP (text int8) + Orama + color search (no UI)
- [ ] Phase 4 — Spotlight: `Cmd+F` → results strip → React Flow canvas drop
- [ ] Phase 5 — Graph: AnnotationStore + ConnectionStore
- [ ] Phase 6 — Manipulation: rotate/scale/grayscale/duplicate, local import/paste, marquee, align/pack/unify, groups
- [ ] Phase 7 — Audio & Motion (Framer Motion spring, Web Audio sprite)
- [ ] Phase 8 — Export (PNG) + always-on-top pin
- [ ] Phase 9a — Crawler (`pnpm crawl` → raw_catalog.json)
- [ ] Phase 9b — Ingest (`pnpm ingest` → static_index.json + thumbs)

## Blocked

# Progress

## In Progress

## Completed

- [x] Phase 1 — Foundations (tag `mvp-1-foundations`): Tauri v2 + React + TS scaffold, frameless draggable macOS window, strict TS + `@/*` aliases, parchment App.tsx, structured logger (10 tests, tsc clean)
  - [x] 1.1 Scaffold via `create-tauri-app` react-ts (Tauri v2)
  - [x] 1.2 Frameless window (titleBarStyle Overlay, hiddenTitle, trafficLightPosition)
  - [x] 1.3 Strict tsconfig + `@/*` aliases + vite/vitest config
  - [x] 1.4 App.tsx parchment div (#F2EDE4)
  - [x] 1.5 `src/lib/logger.ts` + 10 vitest tests
  - [x] 1.6 git init + commits + tag mvp-1-foundations
  - [x] 1.7 Drag-region fix — 32px `data-tauri-drag-region` strip + `core:window:allow-start-dragging` capability (tauri#9503); **user-verified working** (`pnpm tauri dev`)

## Backlog (next up)

- [ ] Phase 2 — Canvas: `@xyflow/react`, sensory theme + grain, pan/zoom, canvasHelpers + canvasTheme tests
- [ ] Phase 3 — SearchEngine: hybrid CLIP (text int8) + Orama + color search (no UI)
- [ ] Phase 4 — Spotlight: `Cmd+F` → results strip → React Flow canvas drop
- [ ] Phase 5 — Graph: AnnotationStore + ConnectionStore
- [ ] Phase 6 — Manipulation: rotate/scale/grayscale/duplicate, local import/paste, marquee, align/pack/unify, groups
- [ ] Phase 7 — Audio & Motion (Framer Motion spring, Web Audio sprite)
- [ ] Phase 8 — Export (PNG) + always-on-top pin
- [ ] Phase 9a — Crawler (`pnpm crawl` → raw_catalog.json)
- [ ] Phase 9b — Ingest (`pnpm ingest` → static_index.json + thumbs)

## Blocked

# Brief — cinecanvas

## Stack

- **Desktop shell**: Tauri v2 (frameless macOS window: `titleBarStyle: Overlay`, `hiddenTitle: true`, `decorations: true`)
- **Frontend**: React + TypeScript 5.8 + Vite · **Tests**: Vitest 4 + jsdom
- **Canvas engine**: `@xyflow/react` (React Flow) — MIT, infinite canvas, marquee select, NodeResizer (not yet installed)
- **Full-text boost**: Orama · **Runtime search**: `@huggingface/transformers` v3+ (CLIP text int8, browser Wasm)
- **Ingest**: CLIP vision fp32 (Node, onnxruntime-node) · **Motion**: Framer Motion · **Audio**: Web Audio API sprite · **Export**: html-to-image
- **Crawl/Ingest (dev-only)**: undici + cheerio + cli-progress + tsx + sharp
- **Model**: `Xenova/clip-vit-base-patch32` (text int8 in-browser, vision fp32 in Node ingest)

> **Version note:** scaffold installed React **19**, Vite **7**, vitest **4**, @types/node 26, TS 5.8.3 (spec said React 18 / Vite 5). Accepted — React Flow works on React 19; revisit only if a later phase breaks.

## Architecture

Personal, local-first, 100% offline film-still moodboard canvas (PureRef-inspired + semantic search).

- **Window**: frameless macOS, native traffic lights only, `Cmd+Shift+P` always-on-top pin. Empty parchment canvas on launch.
- **Canvas**: unbounded React Flow space, pan/zoom [0.05,8], virtualization up to 200 nodes.
- **Search**: `Cmd+F` spotlight at pointer → CLIP text (int8) cosine + Orama boost + optional HEX color filter → fused score → drop image on Enter.
- **Sources**: film-grab.com catalog (crawled+ingested pre-distribution into `static_index.json` + `public/thumbs/`); local file drag/paste (placement-only, never indexed).
- **Per-image toolkit**: non-destructive rotate/scale (CSS transform), grayscale (G), duplicate (Cmd+D), annotations (T/Enter), SVG connectors w/ direction+style.
- **Layout**: marquee select, align/pack/unify, groups (behavior-only, no chrome). **Persistence**: canvas state local; PNG export via html-to-image.

Data model: `FilmFrame` (indexed), `LocalImage` (not indexed), `CanvasImageData` (wraps source + rotation/grayscale/groupId). See spec §8.
Phases (spec §15): 1 Foundations → 2 Canvas → 3 SearchEngine → 4 Spotlight → 5 Graph → 6 Manipulation → 7 Audio → 8 Export → 9a Crawl → 9b Ingest.

## Conventions

- Path alias `@/*` → `./src/*` (tsconfig + vite + vitest).
- Strict TS: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` (so optional props must be omitted, not set to `undefined`).
- Logging: `createLogger(featureId, subModule)` → structured JSON. Never `console.log` directly.
- Tests: Vitest, jsdom, ≥10 atomic tests/module, TDD.
- Theme tokens `--cc-*` (spec §6). `--cc-bg` `#F2EDE4`, accent `#C96B3A`.
- Commits: `feat(PHASE-N)/feat(FEAT-NNN)/feat(SCRIPTS): ...`. Git tags: `mvp-1-foundations` … `mvp-9b-ingest`.
- Non-destructive transforms: never re-encode source thumbnails — CSS `transform`/`filter` only.

## Contraintes

- 100% offline at runtime; no network after install.
- Performance guaranteed up to 200 nodes (React Flow virtualization).
- film-grab.com crawled once by dev pre-distribution; ~4k films MVP, ~200k full (local-dev only).
- CLIP: vision fp32 in Node (onnxruntime-node lacks quantized ConvInteger), text int8 in browser. Same 512-dim latent space — validate drift empirically (assumption A7).
- **`pnpm tauri dev` requires a GUI display + compiles Rust (slow first build). Never run inside subagents/non-GUI contexts.**
- Crawler rate limits: 1200ms/API page, 800ms/HTML page. ~2 req/film.

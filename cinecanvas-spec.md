# CineCanvas — Master Spec

---

## 1. Purpose

Let filmmakers and screenwriters compose film ideas visually on an open canvas, finding and placing cinematic reference stills through semantic search (CLIP) and color search. Source catalog: [film-grab.com](https://film-grab.com), indexed locally once by the developer prior to distribution.

The product direction is explicitly modeled on **PureRef**: a single unbounded canvas, near-zero chrome, and every interaction reachable from the keyboard. CineCanvas keeps PureRef's "stay out of your way" philosophy and adds local, offline semantic search as its one deliberate addition. Nothing is displayed unless it is useful at the moment it's needed.

---

## 2. Sources

### 2.1 Film-Grab (primary catalog)

Film-Grab is an archive of ~4,000 films (~120,000–200,000 stills). The site runs on WordPress with the **Best WordPress Gallery (BWG)** plugin.

#### Structure

Each film is a WP post. Title format: `"Film Title [Director • Year]"`. Stills live in a BWG gallery rendered client-side — they do not appear in the WP API's `content.rendered` field.

#### Two complementary access paths

```
1. WP REST API (metadata + slug)
   GET https://film-grab.com/wp-json/wp/v2/posts
     ?per_page=100 &page=N &_fields=id,title,slug,link,date

2. Post page HTML (actual stills)
   GET https://film-grab.com/2026/06/28/space-sweepers/
   → parse <a href="...wp-content/uploads/photo-gallery/...jpg?bwg=...">
```

Still URLs live in the gallery's `<a href>` attributes, not in `<img src>`. Typical pattern:

```
https://film-grab.com/wp-content/uploads/photo-gallery/Space_Sweepers_01.jpg?bwg=1705681494
```

The `?bwg=...` query string is stripped to obtain the clean URL.

#### Legal position

Film-Grab publishes under educational fair use. CineCanvas is a personal, local, non-commercial tool that redistributes nothing. This is documented in the README.

### 2.2 Local import (secondary source)

Beyond the indexed catalog, the user can drag any image file from Finder — or paste one from the clipboard — directly onto the canvas (see §4.4). Locally imported images are placed exactly like PureRef reference images: no indexing, no embedding, no semantic search. They exist purely as canvas content. This resolves the "catalog is read-only" limitation without adding any network dependency or background processing.

---

## 3. Users & Use Cases

- **Filmmaker building a moodboard** — searches by scene description or mood.
- **Writer outlining a script** — places reference images, connects them to map story beats.
- **Director preparing a pitch** — filters by color to match a visual palette.
- **Anyone in creative flow** — triggers a search without losing their position on the canvas.
- **Returning user** — layout, annotations, and connections persist across sessions.

---

## 4. Requirements

### 4.1 Window Chrome

- Frameless macOS window: native traffic lights only, no title text, no toolbar, no menu bar visible in-window.
- `tauri.conf.json`: `"titleBarStyle": "Overlay"`, `"hiddenTitle": true`, `"decorations": true` (required on macOS for the traffic lights to exist), custom `"trafficLightPosition"` inset to sit comfortably over the canvas background.
- The overlay titlebar strip remains natively draggable (standard macOS overlay behavior) — no custom drag region needed. Everything below it is normal, interactive canvas.
- On first launch: an empty canvas at `--cc-bg`. No onboarding, no empty-state illustration, no toolbar. The interface teaches itself through the same handful of shortcuts used throughout.
- `Cmd+Shift+P` toggles **always-on-top** (PureRef's signature "pin" behavior), so the board can float above Photoshop, Blender, or a script editor while the user works elsewhere.

### 4.2 Canvas

- Unbounded 2D space, smooth pan/zoom at 60+ FPS **up to 200 nodes** (guaranteed performance threshold).
- `Space + Drag` or `Middle-Click + Drag` to pan. `Cmd + Scroll` to zoom. Range `[0.05, 8]`.
- Nodes outside the viewport are not rendered (native React Flow virtualization).

### 4.3 Search

- `Cmd+F` opens an input centered on the current pointer position.
- Navigation `← →`. Confirm with `Enter`. Cancel with `Escape`.
- On confirm: image dropped at the trigger coordinates, search closes.
- Triggering search while one is already open repositions it — never duplicates it.
- Text query + optional HEX color filter, combinable.
- **Text-only search:** CLIP text embedding (int8, in-browser) + cosine similarity across all frames. Orama boosts results whose title/director match.
- **Color-only search:** ranked by RGB distance on `dominantColors[0]`.
- **Combined text + color:** fused score = `(CLIP_score × 0.7 + Orama_boost × 0.3) × 0.6 + color_score × 0.4`. Weights are adjustable constants.

### 4.4 Reference Manipulation (PureRef-inspired)

These bring CineCanvas's per-image toolkit to parity with PureRef's core manipulation set — each one is a small, self-contained addition, deliberately excluding anything PureRef does *not* do (no video/GIF playback, no layers, no brush tools).

- **Free transform** — selecting an image reveals native React Flow `NodeResizer` handles for scale (aspect-locked by default, `Shift` to free-scale) and a single rotate handle at the top-center for arbitrary rotation. Both transforms are non-destructive: the source thumbnail is never re-encoded, only its `transform: rotate() scale()` CSS changes.
- **Grayscale toggle** — `G` toggles `filter: grayscale(1)` on the selected image(s), letting the user judge composition and value independent of color, exactly like PureRef's desaturate option.
- **Duplicate** — `Cmd+D` clones the selected image(s) with a small position offset, so the same still can be reused as a separate crop or annotation target without re-searching.
- **Local file import** — dragging one or more image files from Finder onto the canvas drops them at the cursor position, served through Tauri's asset protocol. No resizing, no embedding, no catalog entry.
- **Clipboard paste** — `Cmd+V` pastes an image currently on the system clipboard at the last known cursor position.
- **Always-on-top** — see §4.1.

### 4.5 Selection & Layout

- **Marquee selection** — drag on empty canvas to select multiple nodes (native React Flow `selectionOnDrag`). `Shift+Click` adds/removes a single node from the selection.
- **Align** — `Cmd+Shift+←/→/↑/↓` aligns the selection's edges (left/right/top/bottom) to the outermost selected node.
- **Pack** — `Cmd+Shift+G` removes gaps between selected nodes along their current rough axis, matching PureRef's "pack" behavior for tidying a cluttered cluster.
- **Unify sizes** — `Cmd+Alt+←/→` scales every selected node to match the width or height of the first-selected node, preserving each node's own aspect ratio.
- **Group** — `Cmd+G` assigns the current selection a shared `groupId`; dragging any member moves the whole group together. `Cmd+Shift+Alt+G` ungroups. Groups have no visual chrome of their own — they only change drag behavior.

### 4.6 Annotations & Connections

- Selecting an image and pressing `T` or `Enter` opens an inline annotation field beneath it.
- Auto-saves on `Cmd+Enter` or click-outside.
- Dragging from a connection handle to another image creates a connector, snapped to the nearest edge.
- Clicking a connector opens a micro-UI for direction (None / A→B / B→A / Bidirectional) and style (Solid / Dashed).

### 4.7 Export

- `Cmd+E` flattens the current canvas viewport to a PNG (matching PureRef's "export as image"), saved via the native save dialog. No project-format export beyond the app's own local persistence — CineCanvas has no `.pur`-equivalent shareable file, since the tool is intentionally single-user and local-first.

### 4.8 Feedback

- Distinct audio + motion for: search opened, result navigation, image dropped, connection snapped.
- Audio preloaded at boot (Web Audio API) — zero latency.

### 4.9 Offline / Local-First

- No network access at runtime. 100% offline after installation.
- The catalog is built before distribution by the crawl + ingest scripts.
- Thumbnails (224px) are **stored in `public/thumbs/`**, served by Tauri as static assets — not embedded in the binary.
- Canvas state persists locally.
- Locally imported images (§4.4) are referenced by absolute path and served via Tauri's asset protocol; nothing is copied into app storage.

---

## 5. Edge Cases

| Situation | Behavior |
|---|---|
| Query shorter than 2 characters | No results, no error |
| Search triggered while the index is still loading | Input appears, returns empty until ready |
| Search triggered while one is already open | Repositioned, never duplicated |
| Keyboard navigation with 0 results | Silent no-op |
| Invalid HEX color | Treated as "no color filter" |
| Deleting an image with connections | Its connections are deleted too (no orphans) |
| Same image placed twice | Two independent instances |
| Very large source image | Downscaled on display (max 400px wide) |
| Empty annotation | Valid empty string, persisted |
| App closed mid-edit | Only committed canvas state survives |
| film-grab.com unreachable at runtime | No impact — app is 100% offline |
| Local file dropped that isn't a valid image | Rejected silently, no canvas entry created |
| Clipboard paste with no image on clipboard | No-op |
| Duplicating a grouped node | Duplicate is added to the same group |
| Resizing a rotated node | Resize handles rotate with the node; scale applies along the node's own axes |
| Ungrouping an empty/single-member group | No-op |
| Pack/Align triggered on a single-node selection | No-op |

---

## 6. Theme — Sensory

### Palette

| Token | Value | Usage |
|---|---|---|
| `--cc-bg` | `#F2EDE4` | Global background (warm parchment) |
| `--cc-surface` | `#EDE8DE` | Card/panel surfaces |
| `--cc-surface-raised` | `#E8E2D6` | Spotlight, tooltips |
| `--cc-border` | `rgba(92,72,52,0.12)` | Structural borders |
| `--cc-border-strong` | `rgba(92,72,52,0.22)` | Active/focus borders |
| `--cc-text-primary` | `#2C2117` | Primary text |
| `--cc-text-secondary` | `#7A6A55` | Secondary text |
| `--cc-text-muted` | `#A89880` | Meta, discreet labels |
| `--cc-accent` | `#C96B3A` | Burnt copper — CTA, selection |
| `--cc-accent-soft` | `rgba(201,107,58,0.12)` | Accent halo, hover |

### SVG grain

```typescript
export const injectGrainFilter = (): void => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('style', 'position:fixed;width:0;height:0;pointer-events:none;');
  svg.innerHTML = `<defs>
    <filter id="cc-grain" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" result="noise"/>
      <feColorMatrix type="saturate" values="0" in="noise" result="gray"/>
      <feBlend in="SourceGraphic" in2="gray" mode="overlay" result="blend"/>
      <feComposite in="blend" in2="SourceGraphic" operator="in"/>
    </filter>
  </defs>`;
  document.body.prepend(svg);
};
```

Grain opacity: `0.035`. No external image.

### Typography

| Role | Font |
|---|---|
| Display | `'Newsreader'`, serif |
| UI / Body | `'Geist Sans'`, `'Helvetica Neue'`, sans-serif |
| Mono | `'Geist Mono'`, monospace |

### Spring animations

```typescript
const cineSpring = { type: 'spring', stiffness: 280, damping: 26, mass: 0.9 };
```

### Components

- **Spotlight**: `background: var(--cc-surface-raised)`, `border-radius: 10px`, no backdrop-filter.
- **Active selection**: `box-shadow: 0 0 0 2px var(--cc-accent), 0 0 0 5px var(--cc-accent-soft)`.
- **Annotations**: `border-left: 2px solid var(--cc-accent)`.
- **Connectors**: stroke `var(--cc-accent)` (solid) / `var(--cc-text-muted)` (dashed).
- **Grouped nodes**: no added chrome — group membership is behavioral only (§4.5), never drawn.

---

## 7. Stack

| Layer | Technology | Notes |
|---|---|---|
| Desktop shell | Tauri v2 | `titleBarStyle: Overlay`, `hiddenTitle: true` for the frameless window (§4.1) |
| Frontend | React 18 + TypeScript 5 + Vite 5 | |
| Canvas engine | **`@xyflow/react`** (React Flow) | MIT license — safe for personal or commercial use; provides marquee selection and `NodeResizer` used in §4.4–4.5 |
| Full-text boost | Orama (OSS) | |
| Runtime semantic search | `@huggingface/transformers` v3+ | |
| Runtime text model | `Xenova/clip-vit-base-patch32` — text_model, int8 | Browser/Tauri WebAssembly |
| Ingest image model | `Xenova/clip-vit-base-patch32` — vision_model, fp32 | Node.js — quantized `ConvInteger` unsupported by `onnxruntime-node` |
| Motion | Framer Motion | |
| Audio | Web Audio API (sprite) | |
| Canvas export | `html-to-image` | Flattens the React Flow viewport to PNG (§4.7) |
| Window controls | Tauri window API (`setAlwaysOnTop`) | Always-on-top pin (§4.1) |
| Tests | Vitest | |
| Crawl (dev-only) | `undici` + `cheerio` + `cli-progress` + `tsx` | |
| Ingest (dev-only) | `sharp` + `tsx` + `@huggingface/transformers` (Node) | |

### Why React Flow over TLDraw

TLDraw moved to a proprietary licensing model: any distributed build requires a per-user license. The hobby license forces a permanent watermark. The commercial license costs $6,000/year.

`@xyflow/react` is MIT with no restrictions. Nodes are ordinary React components, which simplifies implementing images, annotations, SVG connectors — and, now, resize/rotate handles and marquee selection, since React Flow ships built-in primitives for both. DOM-based limit: guaranteed performance up to **200 nodes with complex custom nodes**; untested beyond that. Sufficient for CineCanvas's scope.

### React Flow canvas configuration for CineCanvas

```tsx
// src/canvas/CanvasRoot.tsx
import { ReactFlow, Background, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ImageNode } from './ImageNode';
import { AnnotationEdge } from './AnnotationEdge';

const nodeTypes = { image: ImageNode };
const edgeTypes = { annotation: AnnotationEdge };

export const CanvasRoot = () => {
  const [nodes, , onNodesChange] = useNodesState([]);
  const [edges, , onEdgesChange] = useEdgesState([]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--cc-bg)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        panOnScroll
        panOnScrollMode="free"
        zoomOnScroll={false}
        zoomOnPinch
        minZoom={0.05}
        maxZoom={8}
        deleteKeyCode="Delete"
        selectionOnDrag
        multiSelectionKeyCode="Shift"
      >
        <Background color="var(--cc-border)" gap={32} size={1} />
      </ReactFlow>
    </div>
  );
};
```

---

## 8. Data Model

```typescript
// ─── Produced by crawl.ts ────────────────────────────────────────────────────

interface RawFilmPost {
  wpId:       number;
  title:      string;        // "2001: A Space Odyssey"
  director:   string;        // "Stanley Kubrick"
  year:       number;        // 1968
  imageUrls:  string[];      // film-grab.com URLs, ?bwg=... stripped
  sourceUrl:  string;        // https://film-grab.com/2018/04/15/2001-a-space-odyssey/
  crawledAt:  string;        // ISO 8601
}

// ─── Produced by ingest.ts, bundled with the app ─────────────────────────────

interface FilmFrame {
  id:              string;                           // `${wpId}-${String(idx).padStart(3,'0')}`
  title:           string;
  director:        string;
  year:            number;
  localThumbPath:  string;                           // "/thumbs/42381-003.jpg" (224px)
  sourceUrl:       string;                           // film-grab.com attribution
  filmGrabWpId:    number;
  dominantColors:  [string, string, string];         // top-3 HEX K-Means zones
  embedding:       number[];                         // 512-dim CLIP image vector (float32, fp32 ingest)
  width:           number;
  height:          number;
}

// ─── Local import (§2.2, §4.4) — not indexed, not searchable ─────────────────

interface LocalImage {
  id:          string;      // `local-${crypto.randomUUID()}`
  localPath:   string;      // absolute path, served via Tauri asset protocol
  width:       number;
  height:      number;
  importedAt:  string;      // ISO 8601
}

// ─── Canvas placement — wraps either source with per-instance transform ──────

interface CanvasImageData {
  source:    FilmFrame | LocalImage;
  rotation:  number;         // degrees, 0 default
  grayscale: boolean;        // false default
  groupId?:  string;         // present only if grouped (§4.5)
}

// ─── Queries and results ──────────────────────────────────────────────────────

interface SearchQuery  { text?: string; colorHex?: string; limit?: number; }
interface SearchResult { frame: FilmFrame; score: number; }

// ─── Connections ───────────────────────────────────────────────────────────────

type Direction = 'NONE' | 'A_TO_B' | 'B_TO_A' | 'BIDIRECTIONAL';
type LineStyle  = 'solid' | 'dashed';

interface Connection {
  id:        string;
  fromId:    string;
  toId:      string;
  direction: Direction;
  style:     LineStyle;
}

// ─── Groups (§4.5) ─────────────────────────────────────────────────────────────

interface Group {
  id:      string;
  nodeIds: string[];
}
```

### Distributed files

| File | Content | MVP size (~4,000 films) | Full size (~200k images) |
|---|---|---|---|
| `public/static_index.json` | `FilmFrame[]` | ~9 MB | ~400–800 MB (see §11) |
| `public/thumbs/*.jpg` | 224px thumbnails | ~80 MB | ~3–5 GB |
| `models/.../text_model_int8.onnx` | CLIP text encoder, int8 | ~35 MB | same |
| **Total distributed (MVP)** | | **~130 MB** | **not distributed — local dev use only** |

**MVP mode**: 1 image/film (~4,000 frames). `--full` mode: every image (~120,000–200,000 frames). Full mode stays on the developer's machine — not distributed, due to thumb volume (3–5 GB).

---

## 9. Module API Contracts

```
SearchEngine.init()
  → loads static_index.json + initializes Orama + loads CLIP text model (int8, browser)
  → must resolve before any search() call

SearchEngine.ingest(frames)
  → idempotent; re-ingesting the same id is a no-op

SearchEngine.search(query)
  → text only    : CLIP text embedding (int8) → cosine similarity → fused with Orama boost
  → color only   : ranked by RGB distance on dominantColors[0]
  → text + color : fused score (see §4.3 Search for weights)
  → returns [] if the index is empty or the query is absent; never throws

SearchEngine.searchByColor(hex)
  → returns [] on an invalid hex; never throws

SearchEngine.embedText(text)
  → CLIPTextModelWithProjection (int8, browser)
  → returns a normalized Float32Array; returns [] on error, never throws

AnnotationStore.get/set/delete/toJSON/fromJSON  → in-memory + JSON serialization

ConnectionStore.add/update/remove/getByFrameId  → in-memory + JSON serialization

TransformStore.setRotation(nodeId, deg) / toggleGrayscale(nodeId) / duplicate(nodeId)
  → mutates CanvasImageData in place; duplicate() returns a new node with a position offset

GroupStore.group(nodeIds) / ungroup(groupId) / getGroup(nodeId)
  → group() assigns a fresh groupId to all given nodes; ungroup() clears it; no-op on <2 nodes

LayoutOps.align(nodes, edge) / pack(nodes) / unifySize(nodes, dimension)
  → pure functions over node position/size arrays; no-op on selections of 1

WindowControls.toggleAlwaysOnTop()
  → wraps Tauri's window.setAlwaysOnTop(); never throws, logs failure

ExportEngine.exportViewportToPng(path)
  → flattens the current React Flow viewport via html-to-image, writes PNG to path
  → rejects with a loggable error if the write fails; never throws uncaught

AudioSpriteEngine.load(url)  → failure logged, never throws
AudioSpriteEngine.play(event) → silent no-op before load(); never throws

pnpm crawl        → produces data/raw_catalog.json (delta if one exists)
pnpm crawl --full → forces a full re-crawl
pnpm ingest       → consumes raw_catalog.json → static_index.json + thumbs (1/film)
pnpm ingest --full → indexes every image
```

---

## 10. Audio Sprite Map

| Event | Offset | Sound |
|---|---|---|
| Search open (`Cmd+F`) | 0–250 ms | Soft whoosh |
| Navigate (`← →`) | 300–350 ms | Dry tactile click |
| Canvas drop (`Enter`) | 400–750 ms | Organic thud on wood |
| Connection snap | 800–980 ms | Metal latch |
| Grayscale toggle (`G`) | 1000–1120 ms | Soft paper flip |
| Group / ungroup (`Cmd+G`) | 1150–1300 ms | Light magnetic click |

---

## 11. Pipeline — Crawl + Ingest

### Overview

```
[film-grab.com WordPress REST API]   [film-grab.com HTML pages]
         │  GET /wp-json/wp/v2/posts          │  GET post.link (rendered HTML)
         │  → metadata + slug                 │  → <a href="photo-gallery/...jpg">
         └──────────────┬────────────────────┘
                        ▼
              scripts/crawl.ts
                        │  delta crawl if raw_catalog.json already exists
                        ▼
              data/raw_catalog.json
                        │
                        ▼
              scripts/ingest.ts
                        │  download image → sharp resize to 224px
                        │  K-Means dominant colors (top 3 HEX, 3 zones)
                        │  CLIP vision embedding fp32 (real image)
                        │  skip if already indexed
                        ▼
              public/static_index.json + public/thumbs/<id>.jpg
```

### crawl.ts — detail

The crawler makes **two requests per film**:

1. WP REST API for metadata (paginated, 100 posts/page)
2. Post page HTML to extract still URLs (BWG gallery)

```typescript
// scripts/crawl.ts

const RATE_API_MS  = 1200;  // between each API page
const RATE_HTML_MS = 800;   // between each post HTML fetch

// For each WP post:
// 1. Extract title/director/year from title.rendered
// 2. Fetch HTML at wp.link → extract <a href="...photo-gallery/...jpg">
// 3. Strip the ?bwg=... query string from URLs
// 4. Skip if wpId is already in raw_catalog.json (delta)
// 5. Retry x3 with exponential backoff on network error
```

### crawlUtils.ts — BWG extraction

```typescript
// scripts/crawlUtils.ts

export const extractImageUrls = (pageHtml: string): string[] => {
  const $ = cheerio.load(pageHtml);
  const urls: string[] = [];

  // BWG stills: <a href="...photo-gallery/...jpg?bwg=...">
  $('a[href*="photo-gallery"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && /\.(jpe?g|png|webp)/i.test(href)) {
      urls.push(href.split('?')[0]!);
    }
  });

  // Fallback for older posts without a BWG gallery
  if (urls.length === 0) {
    $('img[src*="wp-content/uploads"]').each((_, el) => {
      const src = $(el).attr('src') ?? $(el).attr('data-src');
      if (src) {
        const clean = src.replace(/-\d+x\d+(\.\w+)$/, '$1').split('?')[0]!;
        urls.push(clean);
      }
    });
  }

  return [...new Set(urls)];
};

export const buildRawPost = (wp: WPPost, pageHtml: string): RawFilmPost | null => {
  const parsed = parseFilmTitle(wp.title.rendered);
  if (!parsed) return null;
  const imageUrls = extractImageUrls(pageHtml);
  if (imageUrls.length === 0) return null;
  return {
    wpId:      wp.id,
    title:     parsed.title,
    director:  parsed.director,
    year:      parsed.year,
    imageUrls,
    sourceUrl: wp.link,
    crawledAt: new Date().toISOString(),
  };
};
```

### ingest.ts — CLIP image embedding

The embedding is generated from the **actual image** (224px thumbnail). The quantized `ConvInteger` model is unsupported by `onnxruntime-node` — fp32 is used for the Node ingest step.

```typescript
// scripts/ingest.ts

import {
  AutoProcessor,
  CLIPVisionModelWithProjection,
  RawImage,
  env,
} from '@huggingface/transformers';

env.allowRemoteModels = false;
env.localModelPath = './models/';

const processor   = await AutoProcessor.from_pretrained('Xenova/clip-vit-base-patch32');
const visionModel = await CLIPVisionModelWithProjection.from_pretrained(
  'Xenova/clip-vit-base-patch32',
  { dtype: 'fp32' }  // fp32 required in Node
);

// For each image:
const image  = await RawImage.fromURL(`file://${thumbPath}`);
const inputs = await processor(image);
const { image_embeds } = await visionModel(inputs);
const embedding = Array.from(image_embeds.data as Float32Array);  // 512-dim float32
```

### searchEngine.ts — CLIP text embedding

At runtime (browser/Tauri), text queries are encoded with `CLIPTextModelWithProjection int8` and compared by cosine similarity to the stored fp32 image embeddings.

```typescript
// src/search/searchEngine.ts

import {
  AutoTokenizer,
  CLIPTextModelWithProjection,
  env,
} from '@huggingface/transformers';

const tokenizer  = await AutoTokenizer.from_pretrained('Xenova/clip-vit-base-patch32');
const textModel  = await CLIPTextModelWithProjection.from_pretrained(
  'Xenova/clip-vit-base-patch32',
  { dtype: 'q8' }  // int8 quantized — supported in browser Wasm
);

async embedText(text: string): Promise<number[]> {
  try {
    const inputs = tokenizer([text], { padding: true, truncation: true });
    const { text_embeds } = await textModel(inputs);
    return Array.from(text_embeds.data as Float32Array);
  } catch {
    return [];
  }
}
```

**Note on the dual-precision latent space:** the vision encoder (fp32, ingest) and the text encoder (int8, runtime) are two branches of the same pretrained CLIP model — they project into the same 512-dim latent space by construction. Int8 quantization of the text encoder introduces measurable precision drift, but it stays within the CLIP space thanks to the Xenova model's fine-tuning. Cosine similarity between an fp32 image embedding and an int8 text embedding remains valid. **This must be validated empirically on a representative query sample before treating the §18 acceptance criteria as satisfied.**

### Volume considerations

| Mode | Frames | Estimated crawl time | Ingest time (CLIP fp32, ~1 img/s CPU) | Thumb size | Distribution |
|---|---|---|---|---|---|
| MVP (1/film) | ~4,000 | ~3–4h | ~70 min | ~80 MB | Tauri binary |
| Full | ~120,000–200,000 | same | ~33–55h | ~3–5 GB | Local dev only |

For full mode, an available GPU (WebGPU/CUDA) shortens ingest to ~5–10h.

**Full index in memory:** 200k vectors × 512 dims × 4 bytes = **400 MB as a `Float32Array`** (loads in <5ms, no `JSON.parse`). Stored as JSON text instead, the file reaches 800 MB–1 GB with a blocking multi-second parse. For full mode, store vectors in a binary `embeddings.bin` file loaded via `Float32Array`, with lightweight metadata kept separately in JSON.

---

## 12. SearchEngine — Hybrid CLIP + Orama Architecture

```typescript
async search(query: SearchQuery): Promise<SearchResult[]> {
  if (!this.ready || this.frames.size === 0) return [];
  const scored = new Map<string, number>();

  if (query.text && query.text.length >= 2) {
    // 1. CLIP text → cosine similarity against image embeddings
    const textVec = await this.embedText(query.text);
    if (textVec.length > 0) {
      for (const [id, frame] of this.frames) {
        const sim = computeCosineSimilarity(textVec, frame.embedding);
        scored.set(id, (scored.get(id) ?? 0) + sim * 0.7);
      }
    }
    // 2. Orama full-text boost (title, director)
    const hits = await search(this.db, { term: query.text, limit: 50 });
    for (const hit of hits.hits) {
      const id = hit.id as string;
      scored.set(id, (scored.get(id) ?? 0) + hit.score * 0.3);
    }
  }

  if (query.colorHex) {
    const colorRanked = await this.searchByColor(query.colorHex);
    for (const r of colorRanked)
      scored.set(r.frame.id, (scored.get(r.frame.id) ?? 0) + r.score * 0.4);
  }

  return Array.from(scored.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, query.limit ?? 10)
    .map(([id, score]) => ({ frame: this.frames.get(id)!, score }))
    .filter(r => r.frame);
}
```

**Fusion weights (adjustable constants):**

| Signal | Text only | Color only | Text + Color |
|---|---|---|---|
| CLIP cosine | ×0.7 | — | ×0.7 |
| Orama boost | ×0.3 | — | ×0.3 |
| Color score | — | ×1.0 | ×0.4 |

**Dual-environment CLIP:**
- **Ingest (Node.js)**: `CLIPVisionModelWithProjection` fp32 → 512-dim image embedding
- **Runtime (Tauri/browser Wasm)**: `CLIPTextModelWithProjection` int8 → 512-dim text embedding

---

## 13. File Structure

```
data/                          ← gitignored
├── raw_catalog.json
└── crawl_state.json

models/                        ← bundled with Tauri (CLIP text int8 only)
│   Xenova/clip-vit-base-patch32/
│   ├── tokenizer.json
│   ├── tokenizer_config.json
│   └── onnx/
│       └── text_model_int8.onnx   (~35 MB)

public/
├── static_index.json
├── thumbs/<wpId>-<NNN>.jpg        ← Tauri static assets, not embedded in the binary
└── audio/sprite.mp3

src/
├── lib/
│   ├── logger.ts
│   └── __tests__/logger.spec.ts
├── canvas/
│   ├── CanvasRoot.tsx
│   ├── ImageNode.tsx
│   ├── AnnotationEdge.tsx
│   ├── canvasHelpers.ts
│   ├── canvasTheme.ts
│   ├── useCanvasDrop.ts
│   ├── useLocalImport.ts
│   ├── transformStore.ts
│   ├── groupStore.ts
│   ├── layoutOps.ts
│   └── __tests__/
├── search/
│   ├── types.ts
│   ├── vectorMath.ts
│   ├── colorUtils.ts
│   ├── searchEngine.ts
│   └── __tests__/
├── spotlight/
│   ├── spotlightReducer.ts
│   ├── useSpotlightKeyboard.ts
│   ├── SpotlightSearch.tsx
│   └── __tests__/
├── annotations/
│   ├── annotationStore.ts
│   └── __tests__/
├── connections/
│   ├── connectionStore.ts
│   └── __tests__/
├── export/
│   ├── exportEngine.ts
│   └── __tests__/
├── window/
│   ├── windowControls.ts
│   └── __tests__/
└── audio/
    ├── audioSprite.ts
    └── __tests__/

scripts/
├── crawl.ts
├── crawlUtils.ts
├── ingest.ts
├── ingestUtils.ts
└── __tests__/
    ├── crawlUtils.spec.ts
    └── ingest.spec.ts
```

---

## 14. Testing Strategy

- Minimum 10 atomic Vitest tests per module, >95% business-logic coverage.
- TDD loop: failing spec → implementation → green → commit.
- No canvas+search+spotlight E2E tests (manual QA for v1).

```bash
pnpm vitest run
pnpm vitest run --coverage
pnpm tsc --noEmit
pnpm tauri build
```

---

## 15. MVP Phases

| Phase | Git tag | Deliverable |
|---|---|---|
| 1 — Foundations | `mvp-1-foundations` | Tauri boot, frameless window, TS strict, logger — 10 tests |
| 2 — Canvas | `mvp-2-canvas` | React Flow + sensory theme + grain |
| 3 — Search Engine | `mvp-3-search-engine` | Hybrid CLIP + Orama + color search |
| 4 — Spotlight UI | `mvp-4-spotlight` | `Cmd+F` → results strip → canvas drop |
| 5 — Annotations & Connections | `mvp-5-graph` | Inline annotations + connectors |
| 6 — Reference Manipulation & Selection | `mvp-6-manipulation` | Rotate/scale/grayscale/duplicate, local import, paste, marquee select, align/pack/unify, groups |
| 7 — Audio & Motion | `mvp-7-audio` | Audio sprite + spring animations |
| 8 — Export & Window Controls | `mvp-8-export` | PNG export, always-on-top pin |
| 9a — Crawler | `mvp-9a-crawl` | `pnpm crawl` → raw_catalog.json |
| 9b — Ingest | `mvp-9b-ingest` | `pnpm ingest` → static_index.json + thumbs |

---

## 16. Phase-by-Phase Implementation Plans

> TDD rule: write the failing spec first → confirm FAIL → implement → confirm PASS → commit.

---

### Phase 1 — Foundations

**Deliverable:** `pnpm tauri dev` opens a frameless `#F2EDE4` window with only the native traffic lights. Logger emits structured JSON. 10 tests.

#### Task 1.1 — Scaffold

```bash
pnpm create tauri-app cinecanvas --template react-ts
cd cinecanvas && pnpm install
pnpm tauri dev
```

`src/App.tsx`:
```tsx
export default function App() {
  return <div style={{ background: '#F2EDE4', width: '100vw', height: '100vh' }} />;
}
```

```bash
git init && git add . && git commit -m "chore: init Tauri + React + TypeScript scaffold"
```

#### Task 1.2 — Frameless window (traffic lights only)

`src-tauri/tauri.conf.json`:
```json
{
  "app": {
    "windows": [
      {
        "title": "CineCanvas",
        "width": 1280,
        "height": 800,
        "titleBarStyle": "Overlay",
        "hiddenTitle": true,
        "decorations": true,
        "trafficLightPosition": { "x": 16, "y": 20 }
      }
    ]
  }
}
```

`decorations: true` is required on macOS for the traffic lights to exist at all — `titleBarStyle: Overlay` combined with `hiddenTitle: true` is what removes the title bar strip and text while keeping them. The top inset stays natively draggable; no custom drag region is implemented.

```bash
git add src-tauri/tauri.conf.json && git commit -m "feat(PHASE-1): frameless macOS window, traffic lights only"
```

#### Task 1.3 — Strict TypeScript + Path Aliases

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': resolve(__dirname, './src') } }
});
```

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
export default defineConfig({
  test: { environment: 'jsdom', globals: true, alias: { '@': resolve(__dirname, './src') } }
});
```

#### Task 1.4 — Structured Logger

```typescript
// src/lib/logger.ts
export interface AppLog {
  timestamp: string;
  featureId: string;
  subModule: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  payload?: Record<string, unknown>;
}

type Payload = Record<string, unknown>;

const emit = (log: AppLog): void => {
  const s = JSON.stringify(log);
  ({ DEBUG: console.debug, INFO: console.info, WARN: console.warn, ERROR: console.error })[log.level](s);
};

export const createLogger = (featureId: string, subModule: string) => ({
  debug: (message: string, payload?: Payload) =>
    emit({ timestamp: new Date().toISOString(), featureId, subModule, level: 'DEBUG', message, payload }),
  info:  (message: string, payload?: Payload) =>
    emit({ timestamp: new Date().toISOString(), featureId, subModule, level: 'INFO',  message, payload }),
  warn:  (message: string, payload?: Payload) =>
    emit({ timestamp: new Date().toISOString(), featureId, subModule, level: 'WARN',  message, payload }),
  error: (message: string, payload?: Payload) =>
    emit({ timestamp: new Date().toISOString(), featureId, subModule, level: 'ERROR', message, payload }),
});

export type Logger = ReturnType<typeof createLogger>;
```

10 tests: DEBUG/INFO/WARN/ERROR, ISO 8601 timestamp, optional payload, complex payload, featureId preserved, valid JSON, multiple levels on the same instance.

```bash
pnpm vitest run src/lib/__tests__/logger.spec.ts  # 10/10
git add src/lib/ && git commit -m "feat(PHASE-1): structured logger — 10 tests"
git tag mvp-1-foundations
```

---

### Phase 2 — Infinite Canvas

**Deliverable:** React Flow, sensory theme, grain, pan/zoom, tested coordinate utils.

```bash
pnpm add @xyflow/react
```

#### Task 2.1 — Coordinate Helpers

```typescript
// src/canvas/canvasHelpers.ts
export interface Point    { x: number; y: number; }
export interface Viewport { x: number; y: number; width: number; height: number; zoom: number; }

export const clampZoom = (z: number): number => Math.min(8, Math.max(0.05, z));

export const viewportContains = (vp: Viewport, p: Point): boolean =>
  p.x >= vp.x && p.x <= vp.x + vp.width &&
  p.y >= vp.y && p.y <= vp.y + vp.height;

export const canvasToScreen = (p: Point, vp: Viewport): Point =>
  ({ x: (p.x - vp.x) * vp.zoom, y: (p.y - vp.y) * vp.zoom });

export const screenToCanvas = (p: Point, vp: Viewport): Point =>
  ({ x: p.x / vp.zoom + vp.x, y: p.y / vp.zoom + vp.y });
```

10 tests: clamp min/max/valid, viewportContains in/right/above, canvasToScreen identity/zoom2, screenToCanvas inverse zoom1/zoom2.

#### Task 2.2 — Theme + Grain

```typescript
// src/canvas/canvasTheme.ts
export const CINE_THEME = {
  bg: '#F2EDE4', surface: '#EDE8DE', surfaceRaised: '#E8E2D6',
  border: 'rgba(92,72,52,0.12)', borderStrong: 'rgba(92,72,52,0.22)',
  textPrimary: '#2C2117', textSecondary: '#7A6A55', textMuted: '#A89880',
  accent: '#C96B3A', accentSoft: 'rgba(201,107,58,0.12)',
} as const;

export type ThemeKey = keyof typeof CINE_THEME;
export const getCSSVar = (key: ThemeKey): string => `var(--cc-${key})`;
export const injectCSSVars = (): void => {
  for (const [k, v] of Object.entries(CINE_THEME))
    document.documentElement.style.setProperty(`--cc-${k}`, v);
};
```

10 tests: bg=#F2EDE4, accent=#C96B3A, getCSSVar format, border rgba, textPrimary defined, accentSoft rgba, injectCSSVars no-throw, all values non-empty.

#### Task 2.3 — CanvasRoot + ImageNode

```tsx
// src/canvas/ImageNode.tsx
import { type NodeProps } from '@xyflow/react';
import type { CanvasImageData } from '@/search/types';

const MAX_W = 400;

export const ImageNode = ({ data, selected }: NodeProps<CanvasImageData>) => {
  const { source, rotation, grayscale } = data;
  const scale = source.width > MAX_W ? MAX_W / source.width : 1;
  const w = Math.round(source.width * scale);
  const h = Math.round(source.height * scale);

  return (
    <div style={{
      width: w, height: h,
      transform: `rotate(${rotation}deg)`,
      filter: grayscale ? 'grayscale(1)' : 'none',
      boxShadow: selected
        ? '0 0 0 2px var(--cc-accent), 0 0 0 5px var(--cc-accent-soft)'
        : '0 2px 8px rgba(44,33,23,0.18)',
      borderRadius: 4,
      overflow: 'hidden',
      cursor: 'grab',
    }}>
      <img
        src={'localThumbPath' in source ? source.localThumbPath : source.localPath}
        alt={'title' in source ? `${source.title} — ${source.director}` : 'Imported reference'}
        width={w}
        height={h}
        style={{ display: 'block', objectFit: 'cover' }}
        draggable={false}
      />
    </div>
  );
};
```

```bash
pnpm vitest run src/canvas/
pnpm tauri dev   # textured parchment canvas, pan + zoom
git commit -m "feat(FEAT-001): React Flow + sensory theme + grain"
git tag mvp-2-canvas
```

---

### Phase 3 — Local Search Engine

**Deliverable:** Hybrid CLIP + Orama + color search. No UI.

```bash
pnpm add @orama/orama @huggingface/transformers
```

#### Task 3.1 — Vector Math

```typescript
// src/search/vectorMath.ts
export const dotProduct = (a: number[], b: number[]): number =>
  a.reduce((sum, v, i) => sum + v * (b[i] ?? 0), 0);

export const magnitude = (v: number[]): number =>
  Math.sqrt(v.reduce((s, x) => s + x * x, 0));

export const normalizeVector = (v: number[]): number[] => {
  const m = magnitude(v);
  return m === 0 ? v.map(() => 0) : v.map(x => x / m);
};

export const computeCosineSimilarity = (a: number[], b: number[]): number => {
  const mA = magnitude(a), mB = magnitude(b);
  return mA === 0 || mB === 0 ? 0 : dotProduct(a, b) / (mA * mB);
};
```

11 tests: identical→1.0, orthogonal→0.0, opposite→−1.0, zero vector no-throw, zero vector→0, dotProduct, magnitude [3,4]→5, magnitude zero, normalizeVector unit, normalizeVector zero stays zero, 512-dim in [−1,1].

#### Task 3.2 — Color Utils

```typescript
// src/search/colorUtils.ts
export interface RGB { r: number; g: number; b: number; }

export const hexToRgb = (hex: string): RGB | null => {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m || m.length < 3) return null;
  return { r: parseInt(m[0]!, 16), g: parseInt(m[1]!, 16), b: parseInt(m[2]!, 16) };
};

export const colorDistance = (a: RGB, b: RGB): number =>
  Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
```

8 tests: #FF0000, #000000, #FFFFFF, invalid→null, missing #, distance 0 for identical, distance >0 for different, max distance ≈441.67.

#### Task 3.3 — Search Engine

```typescript
// src/search/searchEngine.ts
import { create, insert, search as oramaSearch, type AnyOrama } from '@orama/orama';
import { AutoTokenizer, CLIPTextModelWithProjection } from '@huggingface/transformers';
import type { FilmFrame, SearchQuery, SearchResult } from './types';
import { createLogger } from '@/lib/logger';
import { hexToRgb, colorDistance } from './colorUtils';
import { computeCosineSimilarity } from './vectorMath';

const log = createLogger('FEAT-003', 'SearchEngine');

export class SearchEngine {
  private db: AnyOrama | null = null;
  private frames: Map<string, FilmFrame> = new Map();
  private ready = false;
  private tokenizer: Awaited<ReturnType<typeof AutoTokenizer.from_pretrained>> | null = null;
  private textModel: Awaited<ReturnType<typeof CLIPTextModelWithProjection.from_pretrained>> | null = null;

  async init(): Promise<void> {
    this.db = await create({
      schema: { id: 'string', title: 'string', director: 'string', year: 'number' } as const
    });
    try {
      this.tokenizer  = await AutoTokenizer.from_pretrained('Xenova/clip-vit-base-patch32');
      this.textModel  = await CLIPTextModelWithProjection.from_pretrained(
        'Xenova/clip-vit-base-patch32', { dtype: 'q8' }
      );
      log.info('CLIP text model loaded (int8)');
    } catch (err) {
      log.error('CLIP text model failed', { err: String(err) });
    }
    this.ready = true;
  }

  async ingest(frames: FilmFrame[]): Promise<void> {
    if (!this.db) throw new Error('Engine not initialized');
    for (const f of frames) {
      if (!this.frames.has(f.id)) {
        this.frames.set(f.id, f);
        await insert(this.db, { id: f.id, title: f.title, director: f.director, year: f.year });
      }
    }
  }

  async embedText(text: string): Promise<number[]> {
    if (!this.tokenizer || !this.textModel) return [];
    try {
      const inputs = this.tokenizer([text], { padding: true, truncation: true });
      const { text_embeds } = await this.textModel(inputs);
      return Array.from(text_embeds.data as Float32Array);
    } catch { return []; }
  }

  async search(query: SearchQuery): Promise<SearchResult[]> { /* see §12 */ }
  async searchByColor(hex: string): Promise<SearchResult[]> { /* see §12 */ }
  getStats() { return { indexedCount: this.frames.size, ready: this.ready }; }
  async reset(): Promise<void> { this.frames.clear(); await this.init(); }
}
```

10 tests: init, ingest, empty index→[], limit respected, result shape, color ranking, stats count, duplicate ingest is a no-op, reset clears the index, embedText→array.

```bash
pnpm vitest run src/search/
git commit -m "feat(FEAT-003): search engine — CLIP + Orama + color"
git tag mvp-3-search-engine
```

---

### Phase 4 — Spotlight Search UI

**Deliverable:** `Cmd+F` opens spotlight at the pointer, keyboard navigation, canvas drop.

```bash
pnpm add framer-motion
```

#### Task 4.1 — Spotlight Reducer

```typescript
// src/spotlight/spotlightReducer.ts
export interface SpotlightState {
  isOpen: boolean;
  position: { x: number; y: number };
  query: string;
  selectedIndex: number;
  resultsCount: number;
}

export type SpotlightAction =
  | { type: 'OPEN'; position: { x: number; y: number } }
  | { type: 'CLOSE' }
  | { type: 'SET_QUERY'; query: string }
  | { type: 'NAVIGATE_RIGHT' }
  | { type: 'NAVIGATE_LEFT' }
  | { type: 'SET_RESULTS_COUNT'; count: number };

export const initialSpotlightState: SpotlightState = {
  isOpen: false, position: { x: 0, y: 0 }, query: '', selectedIndex: 0, resultsCount: 0
};

export const spotlightReducer = (state: SpotlightState, action: SpotlightAction): SpotlightState => {
  switch (action.type) {
    case 'OPEN':    return { ...state, isOpen: true, position: action.position, query: '', selectedIndex: 0 };
    case 'CLOSE':   return { ...initialSpotlightState };
    case 'SET_QUERY': return { ...state, query: action.query };
    case 'NAVIGATE_RIGHT':
      return { ...state, selectedIndex: state.resultsCount === 0 ? 0 : (state.selectedIndex + 1) % state.resultsCount };
    case 'NAVIGATE_LEFT':
      return { ...state, selectedIndex: state.resultsCount === 0 ? 0 : (state.selectedIndex - 1 + state.resultsCount) % state.resultsCount };
    case 'SET_RESULTS_COUNT': return { ...state, resultsCount: action.count, selectedIndex: 0 };
    default: return state;
  }
};
```

11 tests: isOpen initially false, OPEN sets position, CLOSE resets, SET_QUERY, NAVIGATE_RIGHT++, NAVIGATE_RIGHT wraps, NAVIGATE_LEFT--, NAVIGATE_LEFT wraps, SET_RESULTS_COUNT, SET_RESULTS_COUNT resets selectedIndex, OPEN resets query.

#### Task 4.2 — Canvas Drop (React Flow)

```typescript
// src/canvas/useCanvasDrop.ts
import { type Node } from '@xyflow/react';
import type { FilmFrame } from '@/search/types';

const MAX_W = 400;

export const buildImageNode = (
  frame: FilmFrame,
  canvasPos: { x: number; y: number }
): Node => {
  const scale = frame.width > MAX_W ? MAX_W / frame.width : 1;
  const w = Math.round(frame.width * scale);
  const h = Math.round(frame.height * scale);

  return {
    id:       `frame-${frame.id}-${Date.now()}`,
    type:     'image',
    position: canvasPos,
    data:     { source: frame, rotation: 0, grayscale: false },
    style:    { width: w, height: h },
  };
};
```

6 tests: position preserved, localThumbPath included via data.source, large images ≤400px, ratio preserved, small images not upscaled, unique IDs.

```bash
pnpm vitest run src/spotlight/ src/canvas/
pnpm tauri dev  # Cmd+F → spotlight, navigation, image drop
git commit -m "feat(FEAT-002): spotlight + keyboard nav + React Flow canvas drop"
git tag mvp-4-spotlight
```

---

### Phase 5 — Annotations & Connections

AnnotationStore + ConnectionStore — in-memory implementation with JSON serialization. Connections are custom React Flow edges with a direction/style micro-UI on click.

10 tests each.

```bash
git commit -m "feat(FEAT-001/004): AnnotationStore + ConnectionStore — 20 tests"
git tag mvp-5-graph
```

---

### Phase 6 — Reference Manipulation & Selection

**Deliverable:** Rotate/scale/grayscale/duplicate, local file import, clipboard paste, marquee selection, align/pack/unify, grouping. This phase is CineCanvas's direct answer to PureRef's manipulation toolkit (§4.4–§4.5).

```bash
pnpm add -D @tauri-apps/plugin-clipboard-manager
```

#### Task 6.1 — Transform Store (rotate, grayscale, duplicate)

```typescript
// src/canvas/transformStore.ts
import type { Node } from '@xyflow/react';
import type { CanvasImageData } from '@/search/types';

export const setRotation = (node: Node<CanvasImageData>, deg: number): Node<CanvasImageData> =>
  ({ ...node, data: { ...node.data, rotation: ((deg % 360) + 360) % 360 } });

export const toggleGrayscale = (node: Node<CanvasImageData>): Node<CanvasImageData> =>
  ({ ...node, data: { ...node.data, grayscale: !node.data.grayscale } });

const DUPLICATE_OFFSET = 24;

export const duplicateNode = (node: Node<CanvasImageData>): Node<CanvasImageData> => ({
  ...node,
  id: `${node.id}-copy-${Date.now()}`,
  position: { x: node.position.x + DUPLICATE_OFFSET, y: node.position.y + DUPLICATE_OFFSET },
  selected: true,
});
```

10 tests: setRotation normalizes negative degrees, setRotation wraps >360, toggleGrayscale flips true/false, toggleGrayscale is idempotent over two calls, duplicateNode offsets position, duplicateNode generates a unique id, duplicateNode preserves source data, duplicateNode preserves groupId, duplicateNode marks the copy selected, original node untouched by duplication.

#### Task 6.2 — Local Import & Clipboard Paste

```typescript
// src/canvas/useLocalImport.ts
import { convertFileSrc } from '@tauri-apps/api/core';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import type { LocalImage } from '@/search/types';

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

export const buildLocalImage = (path: string, width: number, height: number): LocalImage => ({
  id: `local-${crypto.randomUUID()}`,
  localPath: convertFileSrc(path),
  width, height,
  importedAt: new Date().toISOString(),
});

export const isImportableFile = (path: string): boolean => IMAGE_EXT.test(path);

// Registered once at app boot: getCurrentWebview().onDragDropEvent(...)
// filters paths through isImportableFile, measures dimensions, drops
// a CanvasImageData node at the drop cursor position for each valid file.
```

8 tests: isImportableFile accepts jpg/png/webp/gif, rejects .txt/.pdf, buildLocalImage generates a unique id, buildLocalImage stores width/height, buildLocalImage sets importedAt as ISO 8601, convertFileSrc called with the raw path, empty path rejected, uppercase extension accepted.

#### Task 6.3 — Selection & Layout Ops

```typescript
// src/canvas/layoutOps.ts
import type { Node } from '@xyflow/react';

type Edge2D = 'left' | 'right' | 'top' | 'bottom';

export const alignNodes = (nodes: Node[], edge: Edge2D): Node[] => {
  if (nodes.length < 2) return nodes;
  const values = nodes.map(n => (edge === 'left' || edge === 'right' ? n.position.x : n.position.y));
  const target = edge === 'left' || edge === 'top' ? Math.min(...values) : Math.max(...values);
  return nodes.map(n => edge === 'left' || edge === 'right'
    ? { ...n, position: { ...n.position, x: target } }
    : { ...n, position: { ...n.position, y: target } });
};

const GAP = 16;

export const packNodes = (nodes: Node[]): Node[] => {
  if (nodes.length < 2) return nodes;
  const sorted = [...nodes].sort((a, b) => a.position.x - b.position.x);
  let cursor = sorted[0]!.position.x;
  return sorted.map(n => {
    const width = (n.style?.width as number) ?? 0;
    const packed = { ...n, position: { ...n.position, x: cursor } };
    cursor += width + GAP;
    return packed;
  });
};

export const unifySizes = (nodes: Node[], dimension: 'width' | 'height'): Node[] => {
  if (nodes.length < 2) return nodes;
  const target = (nodes[0]!.style?.[dimension] as number) ?? 0;
  return nodes.map(n => {
    const w = (n.style?.width as number) ?? 1;
    const h = (n.style?.height as number) ?? 1;
    const ratio = dimension === 'width' ? target / w : target / h;
    return { ...n, style: { ...n.style, width: w * ratio, height: h * ratio } };
  });
};
```

12 tests: alignNodes left/right/top/bottom, alignNodes no-op on single node, packNodes removes gaps, packNodes preserves sort order by x, packNodes no-op on single node, unifySizes width preserves aspect ratio, unifySizes height preserves aspect ratio, unifySizes no-op on single node, unifySizes uses the first node as reference.

#### Task 6.4 — Group Store

```typescript
// src/canvas/groupStore.ts
export interface Group { id: string; nodeIds: string[]; }

export class GroupStore {
  private groups: Map<string, Group> = new Map();

  group(nodeIds: string[]): Group | null {
    if (nodeIds.length < 2) return null;
    const g: Group = { id: `group-${crypto.randomUUID()}`, nodeIds: [...nodeIds] };
    this.groups.set(g.id, g);
    return g;
  }

  ungroup(groupId: string): void { this.groups.delete(groupId); }

  getGroup(nodeId: string): Group | null {
    for (const g of this.groups.values()) if (g.nodeIds.includes(nodeId)) return g;
    return null;
  }
}
```

10 tests: group() with 2+ nodes creates a group, group() with <2 nodes returns null, ungroup removes the group, getGroup finds membership, getGroup returns null for ungrouped nodes, group ids are unique, ungroup on unknown id is a no-op, group() does not mutate the input array, multiple groups coexist, getGroup after ungroup returns null.

```bash
pnpm vitest run src/canvas/
pnpm tauri dev  # rotate/scale handles, G toggles grayscale, Cmd+D duplicates,
                # drag files from Finder, Cmd+V pastes, marquee select, Cmd+G groups
git commit -m "feat(FEAT-005): reference manipulation + selection + grouping — 40 tests"
git tag mvp-6-manipulation
```

---

### Phase 7 — Audio & Motion

AudioSpriteEngine + Framer Motion spring animations.

10 tests.

```bash
git commit -m "feat(EAR-CANDY): AudioSprite engine — 10 tests"
git tag mvp-7-audio
```

---

### Phase 8 — Export & Window Controls

**Deliverable:** `Cmd+E` flattens the canvas to PNG; `Cmd+Shift+P` pins the window always-on-top.

```bash
pnpm add html-to-image
```

#### Task 8.1 — Export Engine

```typescript
// src/export/exportEngine.ts
import { toPng } from 'html-to-image';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { createLogger } from '@/lib/logger';

const log = createLogger('FEAT-008', 'ExportEngine');

export const exportViewportToPng = async (viewportEl: HTMLElement): Promise<boolean> => {
  try {
    const dataUrl = await toPng(viewportEl, { backgroundColor: '#F2EDE4' });
    const path = await save({ filters: [{ name: 'PNG', extensions: ['png'] }] });
    if (!path) return false;
    const bytes = Uint8Array.from(atob(dataUrl.split(',')[1]!), c => c.charCodeAt(0));
    await writeFile(path, bytes);
    return true;
  } catch (err) {
    log.error('Export failed', { err: String(err) });
    return false;
  }
};
```

6 tests: returns false when save dialog is cancelled, returns true on successful write, logs and returns false on toPng failure, logs and returns false on write failure, backgroundColor matches --cc-bg, never throws.

#### Task 8.2 — Window Controls

```typescript
// src/window/windowControls.ts
import { getCurrentWindow } from '@tauri-apps/api/window';
import { createLogger } from '@/lib/logger';

const log = createLogger('FEAT-008', 'WindowControls');
let pinned = false;

export const toggleAlwaysOnTop = async (): Promise<boolean> => {
  try {
    pinned = !pinned;
    await getCurrentWindow().setAlwaysOnTop(pinned);
    return pinned;
  } catch (err) {
    log.error('setAlwaysOnTop failed', { err: String(err) });
    return pinned;
  }
};
```

4 tests: toggles from false to true, toggles back to false, returns current state on failure, logs on failure.

```bash
pnpm vitest run src/export/ src/window/
pnpm tauri dev  # Cmd+E exports PNG, Cmd+Shift+P pins the window
git commit -m "feat(FEAT-008): PNG export + always-on-top pin — 10 tests"
git tag mvp-8-export
```

---

### Phase 9a — Crawler `pnpm crawl`

**Deliverable:** `data/raw_catalog.json` with every image per film (40–65 URLs per post).

```bash
pnpm add -D undici cheerio cli-progress tsx
```

#### crawlUtils.ts

```typescript
// scripts/crawlUtils.ts
import * as cheerio from 'cheerio';

const TITLE_RE = /^(.+?)\s*\[(.+?)\s*[•·]\s*(\d{4})\]/;

export interface WPPost {
  id: number;
  title: { rendered: string };
  link: string;
  date: string;
}

export const parseFilmTitle = (rendered: string): { title: string; director: string; year: number } | null => {
  const clean = rendered.replace(/&amp;/g, '&').replace(/&#8211;/g, '–');
  const m = TITLE_RE.exec(clean);
  if (!m) return null;
  return { title: (m[1] ?? '').trim(), director: (m[2] ?? '').trim(), year: parseInt(m[3] ?? '0', 10) };
};

export const extractImageUrls = (pageHtml: string): string[] => {
  const $ = cheerio.load(pageHtml);
  const urls: string[] = [];

  $('a[href*="photo-gallery"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && /\.(jpe?g|png|webp)/i.test(href))
      urls.push(href.split('?')[0]!);
  });

  if (urls.length === 0) {
    $('img[src*="wp-content/uploads"]').each((_, el) => {
      const src = $(el).attr('src') ?? $(el).attr('data-src');
      if (src) urls.push(src.replace(/-\d+x\d+(\.\w+)$/, '$1').split('?')[0]!);
    });
  }

  return [...new Set(urls)];
};

export const buildRawPost = (wp: WPPost, pageHtml: string): RawFilmPost | null => {
  const parsed = parseFilmTitle(wp.title.rendered);
  if (!parsed) return null;
  const imageUrls = extractImageUrls(pageHtml);
  if (imageUrls.length === 0) return null;
  return {
    wpId: wp.id, title: parsed.title, director: parsed.director, year: parsed.year,
    imageUrls, sourceUrl: wp.link, crawledAt: new Date().toISOString(),
  };
};

export const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));
```

10 tests: parseFilmTitle •, parseFilmTitle ·, HTML entities, null when absent, extractImageUrls photo-gallery links, filters out non-photo-gallery, dedup, buildRawPost null with no images, buildRawPost correct shape, sleep→Promise.

```bash
pnpm vitest run scripts/__tests__/crawlUtils.spec.ts   # 10/10
git commit -m "feat(SCRIPTS): BWG crawler"
git tag mvp-9a-crawl
```

---

### Phase 9b — Ingest `pnpm ingest`

**Deliverable:** `public/static_index.json` with real CLIP image embeddings.

```bash
pnpm add -D sharp @huggingface/transformers
```

#### ingestUtils.ts

```typescript
// scripts/ingestUtils.ts
import sharp from 'sharp';

export const MAX_THUMB_PX = 224;
export const JPEG_QUALITY = 85;

export const resizeImage = async (inputBuf: Buffer) => {
  const meta = await sharp(inputBuf).metadata();
  const ow = meta.width ?? 0, oh = meta.height ?? 0;
  const scale = Math.max(ow, oh) > MAX_THUMB_PX ? MAX_THUMB_PX / Math.max(ow, oh) : 1;
  const tw = Math.round(ow * scale), th = Math.round(oh * scale);
  const buf = await sharp(inputBuf).resize(tw, th).jpeg({ quality: JPEG_QUALITY }).toBuffer();
  return { buf, width: tw, height: th, origWidth: ow, origHeight: oh };
};

export const extractDominantColors = async (inputBuf: Buffer): Promise<[string, string, string]> => {
  const { data } = await sharp(inputBuf).resize(50, 50, { fit: 'cover' }).raw().toBuffer({ resolveWithObject: true });
  const zoneSize = Math.floor(data.length / (3 * 3));
  const toHex = (offset: number): string => {
    const r = data[offset] ?? 0, g = data[offset + 1] ?? 0, b = data[offset + 2] ?? 0;
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  };
  return [toHex(0), toHex(zoneSize), toHex(zoneSize * 2)];
};

export const buildFrameId = (wpId: number, imageIndex: number): string =>
  `${wpId}-${String(imageIndex).padStart(3, '0')}`;

export const validateRawPost = (f: unknown): boolean => {
  if (typeof f !== 'object' || f === null) return false;
  const x = f as Record<string, unknown>;
  return typeof x['wpId'] === 'number' && typeof x['title'] === 'string'
    && Array.isArray(x['imageUrls']) && (x['imageUrls'] as unknown[]).length > 0;
};
```

7 tests: resize ≤224px, ratio preserved, dominantColors returns 3 valid HEX, validateRawPost passes, fails with no imageUrls, buildFrameId format, no-throw on a minimal buffer.

```bash
pnpm vitest run scripts/__tests__/   # 17/17 (10 crawl + 7 ingest)
git commit -m "feat(SCRIPTS): ingest — CLIP vision fp32 embedding"
git tag mvp-9b-ingest
```

---

## 17. Assumptions

| # | Assumption | Impact if false |
|---|---|---|
| A1 | Data is 100% local to a single machine | HIGH — revisit for cross-device support |
| A2 | Local import (§2.2) is placement-only — never indexed or embedded | MEDIUM — revisit if semantic search over personal images is later requested |
| A3 | No auth/multi-user | MEDIUM |
| A4 | Deleting an image deletes its connections | MEDIUM |
| A5 | In-progress edits are not persisted through a crash | MEDIUM |
| A6 | React Flow MIT — no licensing constraint | NONE — guaranteed by the license |
| A7 | CLIP vision fp32 (ingest) and text int8 (runtime) remain in the same 512-dim latent space. True by construction of the pretrained model; int8 drift is bounded. **To be validated empirically before release.** | HIGH — if drift proves unacceptable, switch the text encoder to fp32 (×2 model size, ~70 MB) |
| A8 | film-grab.com keeps its BWG structure `<a href="photo-gallery/...">` | HIGH — if the structure changes, `extractImageUrls` needs adapting |
| A9 | Crawl (~2 req/film, ~4,000 films) takes 3–4h — acceptable dev-only | MEDIUM |
| A10 | 224px thumbs are sufficient for color search and canvas display | LOW |
| A11 | MVP index = 1 image/film; `--full` indexes everything | MEDIUM |
| A12 | Personal, non-commercial local use is consistent with film-grab.com's fair use | MEDIUM — documented in the README |
| A13 | Full mode (~200k images, ~3–5 GB thumbs) stays on the developer's machine — not distributed | HIGH — if distribution is ever considered, revisit packaging strategy (CDN, delta updates) |
| A14 | Canvas performance is guaranteed up to 200 nodes with custom React Flow nodes | MEDIUM — beyond that, evaluate a canvas/WebGL migration |
| A15 | Grouping (§4.5) needs no persistent visual chrome — behavior-only grouping is sufficient for the target workflow | LOW — visible group boundaries can be added later if needed |
| A16 | `titleBarStyle: Overlay` + `hiddenTitle: true` is sufficient to get a frameless macOS window with native traffic lights, with no third-party window-decoration plugin | MEDIUM — if inset/positioning proves insufficient, adopt `tauri-plugin-decoration` |

---

## 18. Acceptance Criteria

| Given | When | Then |
|---|---|---|
| App launched | — | Frameless window opens: parchment background, native traffic lights only, no title, no toolbar |
| Canvas open and empty | User pans/zooms | 60+ FPS up to 200 nodes, no stutter |
| Canvas focused | `Cmd+F` | Parchment input centered on the pointer |
| Input open | User types 2+ characters | Horizontal results strip appears |
| Results shown | `← →` | Selection moves, wraps at the ends |
| Result selected | `Enter` | Image dropped, search closes |
| Search open | `Escape` | Search closes, nothing dropped |
| Query "rainy night neon alley" | Results returned | Semantically close stills (CLIP) — validated empirically on a sample |
| Color filter only | Results returned | Ranked by RGB proximity on dominantColors[0] |
| Text + color combined | Results returned | Fused score per §12 weights |
| Image on canvas | Select + `T` | Inline annotation field appears |
| Annotation typed | Click outside / `Cmd+Enter` | Auto-saved |
| Two images | Drag node → node | Connector created, snapped |
| Existing connector | Click | Direction + style micro-UI |
| Image selected | Resize/rotate handle dragged | Image scales or rotates non-destructively; source thumbnail untouched |
| Image selected | `G` | Grayscale toggles on the selection |
| Image selected | `Cmd+D` | Duplicate created with a position offset |
| Image file dragged from Finder | Dropped on canvas | Placed at cursor, not indexed, not searchable |
| Image on system clipboard | `Cmd+V` | Pasted at the last known cursor position |
| Multiple nodes | Marquee drag / `Shift+Click` | All targeted nodes selected |
| 2+ nodes selected | `Cmd+Shift+←/→/↑/↓` | Nodes align to the outermost edge |
| 2+ nodes selected | `Cmd+Shift+G` | Gaps between nodes removed |
| 2+ nodes selected | `Cmd+Alt+←/→` | Sizes unified, individual aspect ratios preserved |
| 2+ nodes selected | `Cmd+G` | Nodes grouped; dragging one moves all |
| Grouped nodes | `Cmd+Shift+Alt+G` | Group cleared, nodes move independently again |
| Canvas with content | `Cmd+E` | Viewport flattened and saved as PNG |
| Any window state | `Cmd+Shift+P` | Window toggles always-on-top |
| Any feedback event | Action occurs | Audio + motion, zero perceptible delay |
| App relaunched | — | Canvas, annotations, connections, transforms, and groups restored |
| `pnpm crawl` run | — | `raw_catalog.json` with 40–65 URLs/film |
| `pnpm ingest` run | — | `static_index.json` with real CLIP image embeddings |

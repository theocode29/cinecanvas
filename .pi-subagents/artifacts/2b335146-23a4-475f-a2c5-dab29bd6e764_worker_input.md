# Task for worker

You are implementing **Phase 2 — Canvas** of CineCanvas (Tauri v2 + React 19 + TS + Vite). cwd: `/Users/theophilebaudouin/Documents/devellopement/cinecanvas`. Ponytail/lazy: minimal working code, no speculative abstractions. The authoritative spec is `cinecanvas-spec.md` — read §6 (Theme), §7 (Stack / React Flow config), §8 (Data Model), and §16 "Phase 2 — Infinite Canvas".

## Current state (Phase 1 done)
Working Tauri v2 + React app. Relevant existing files:
- `src/App.tsx` — currently a flex-column: a 32px `data-tauri-drag-region` strip on top + an empty `flex:1` div below:
```tsx
export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', background: '#F2EDE4' }}>
      <div data-tauri-drag-region style={{ height: 32, flexShrink: 0, userSelect: 'none' }} />
      <div style={{ flex: 1 }} />
    </div>
  );
}
```
- `src/main.tsx` renders `<App/>` in StrictMode (standard).
- `package.json` has React 19, Vite 7, vitest 4, TS 5.8. Path alias `@/*` → `./src/*` (tsconfig + vite + vitest). Strict TS with `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`.

## Goal — Phase 2 deliverable
React Flow canvas + sensory theme + SVG grain + pan/zoom + tested coordinate/theme helpers. ~20 tests total.

## Step 1 — Install React Flow
`pnpm add @xyflow/react`. If pnpm errors on React 19 peer deps, retry with `pnpm add @xyflow/react --force` and report it. React 19 IS supported by @xyflow/react v12.

## Step 2 — Data model types (needed by ImageNode)
Create `src/search/types.ts` (spec §8 — pure types, no logic):
```ts
export interface FilmFrame {
  id: string; title: string; director: string; year: number;
  localThumbPath: string; sourceUrl: string; filmGrabWpId: number;
  dominantColors: [string, string, string]; embedding: number[];
  width: number; height: number;
}
export interface LocalImage {
  id: string; localPath: string; width: number; height: number; importedAt: string;
}
export interface CanvasImageData {
  source: FilmFrame | LocalImage; rotation: number; grayscale: boolean; groupId?: string;
}
export interface SearchQuery { text?: string; colorHex?: string; limit?: number; }
export interface SearchResult { frame: FilmFrame; score: number; }
export type Direction = 'NONE' | 'A_TO_B' | 'B_TO_A' | 'BIDIRECTIONAL';
export type LineStyle = 'solid' | 'dashed';
export interface Connection { id: string; fromId: string; toId: string; direction: Direction; style: LineStyle; }
export interface Group { id: string; nodeIds: string[]; }
```

## Step 3 — Coordinate helpers `src/canvas/canvasHelpers.ts` (spec §16 Task 2.1, verbatim)
```ts
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
Write `src/canvas/__tests__/canvasHelpers.spec.ts` with **10 atomic tests**: clampZoom clamps below 0.05 / above 8 / passes valid through; viewportContains true when inside / false when right-of / false when above; canvasToScreen identity (zoom 1, vp 0) / with zoom 2; screenToCanvas is inverse of canvasToScreen for zoom 1 / zoom 2.

## Step 4 — Theme + grain `src/canvas/canvasTheme.ts` (spec §6 + §16 Task 2.2)
```ts
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
Write `src/canvas/__tests__/canvasTheme.spec.ts` with **10 atomic tests**: bg === '#F2EDE4'; accent === '#C96B3A'; getCSSVar('bg') === 'var(--cc-bg)'; border value is an rgba() string; textPrimary is a #hex; accentSoft is rgba(); surfaceRaised defined & non-empty; injectCSSVars sets --cc-bg on documentElement (use jsdom document.documentElement.style.getPropertyValue); injectGrainFilter does not throw; all 9 theme values are non-empty strings. (jsdom supports document.documentElement.style and createElementNS.)

## Step 5 — ImageNode `src/canvas/ImageNode.tsx` (spec §16 Task 2.3, adapted)
```tsx
import { type NodeProps } from '@xyflow/react';
import type { CanvasImageData } from '@/search/types';

const MAX_W = 400;

export const ImageNode = ({ data, selected }: NodeProps<CanvasImageData>) => {
  const { source, rotation, grayscale } = data;
  const scale = source.width > MAX_W ? MAX_W / source.width : 1;
  const w = Math.round(source.width * scale);
  const h = Math.round(source.height * scale);
  const src = 'localThumbPath' in source ? source.localThumbPath : source.localPath;
  const alt = 'title' in source ? `${source.title} — ${source.director}` : 'Imported reference';
  return (
    <div style={{
      width: w, height: h,
      transform: `rotate(${rotation}deg)`,
      filter: grayscale ? 'grayscale(1)' : 'none',
      boxShadow: selected
        ? '0 0 0 2px var(--cc-accent), 0 0 0 5px var(--cc-accent-soft)'
        : '0 2px 8px rgba(44,33,23,0.18)',
      borderRadius: 4, overflow: 'hidden', cursor: 'grab',
    }}>
      <img src={src} alt={alt} width={w} height={h}
        style={{ display: 'block', objectFit: 'cover' }} draggable={false} />
    </div>
  );
};
```
(Note: under `exactOptionalPropertyTypes`, only use the exact props shown. `NodeProps<CanvasImageData>` is the React Flow v12 generic. ImageNode won't render any nodes yet — the canvas starts empty — it just needs to compile and be registered.)

## Step 6 — CanvasRoot `src/canvas/CanvasRoot.tsx` (spec §7 config, ADAPTED to sit below the drag strip)
CRITICAL: the spec shows `position: 'fixed', inset: 0` — DO NOT use that, it would cover the drag strip. The canvas must fill the flex:1 area. Use this:
```tsx
import { ReactFlow, Background, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ImageNode } from './ImageNode';
import type { CanvasImageData } from '@/search/types';

const nodeTypes = { image: ImageNode };

export const CanvasRoot = () => {
  const [nodes, , onNodesChange] = useNodesState<CanvasImageData>([]);
  const [edges, , onEdgesChange] = useEdgesState([]);
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--cc-bg)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        panOnScroll
        panOnScrollMode="free"
        zoomOnScroll={false}
        zoomOnPinch
        minZoom={0.05}
        maxZoom={8}
        deleteKeyCode="Delete"
        selectionOnDrag
        multiSelectionKeyCode="Shift"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--cc-border)" gap={32} size={1} />
      </ReactFlow>
    </div>
  );
};
```
Notes: DO NOT add `edgeTypes` / AnnotationEdge (that is Phase 5). `proOptions={{ hideAttribution: true }}` is fine since @xyflow/react is MIT (no paid requirement). If the `useNodesState<CanvasImageData>` generic or `NodeProps<CanvasImageData>` causes TS friction under strict mode, adjust the typing minimally to make tsc pass — but keep the CanvasImageData data shape.

## Step 7 — Wire into App.tsx + boot theme
Rewrite `src/App.tsx`:
```tsx
import { CanvasRoot } from '@/canvas/CanvasRoot';

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', background: 'var(--cc-bg)' }}>
      {/* Tauri v2 overlay windows need an explicit drag region (tauri#9503); native traffic lights overlay the top-left. */}
      <div data-tauri-drag-region style={{ height: 32, flexShrink: 0, userSelect: 'none' }} />
      <div style={{ flex: 1, minHeight: 0 }}>
        <CanvasRoot />
      </div>
    </div>
  );
}
```
(`minHeight: 0` on the flex child is required so React Flow gets a real height.)
In `src/main.tsx`, call the theme boot BEFORE `ReactDOM.createRoot(...).render(...)`:
```ts
import { injectCSSVars, injectGrainFilter } from '@/canvas/canvasTheme';
injectCSSVars();
injectGrainFilter();
```
(Keep the existing StrictMode render; just add these two calls + import at the top of the file.)

## Hard constraints
- DO NOT run `pnpm tauri dev` (blocks on GUI + slow Rust compile) or `cargo`.
- DO NOT modify `cinecanvas-spec.md`, `AGENTS.md`, or anything under `.pi/`.
- DO NOT add font dependencies (Newsreader/Geist) — defer; system fallback fonts are fine for now.
- DO NOT implement AnnotationEdge, ConnectionStore, search engine, or anything from later phases.
- Defer the actual grain VISIBILITY tuning — injecting the filter defs is enough for Phase 2.

## Verify (ALL must pass before finishing)
1. `pnpm vitest run src/canvas` → all canvas tests PASS (20 expected: 10 canvasHelpers + 10 canvasTheme).
2. `pnpm exec tsc --noEmit` → 0 errors.

## Report back
Concisely: the `pnpm add @xyflow/react` result (version installed, any peer-dep warnings/force used); final file list created/modified; paste the `pnpm vitest run src/canvas` summary line and the `tsc --noEmit` result; note any TS typing adjustments you made to CanvasRoot/ImageNode and why; list anything unresolved. Remind that `pnpm tauri dev` (manual, GUI) is needed to visually confirm pan/zoom/grain.

## Acceptance Contract
Acceptance level: reviewed
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Implement the requested change without widening scope
- criterion-2: Return evidence sufficient for an independent acceptance review

Required evidence: changed-files, tests-added, commands-run, validation-output, residual-risks, no-staged-files

Review gate: required by reviewer.

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.
```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "specific proof"
    }
  ],
  "changedFiles": [
    "src/file.ts"
  ],
  "testsAddedOrUpdated": [
    "test/file.test.ts"
  ],
  "commandsRun": [
    {
      "command": "command",
      "result": "passed",
      "summary": "short result"
    }
  ],
  "validationOutput": [
    "validation output or concise summary"
  ],
  "residualRisks": [
    "none"
  ],
  "noStagedFiles": true,
  "diffSummary": "short description of the diff",
  "reviewFindings": [
    "blocker: file.ts:12 - issue found, or no blockers"
  ],
  "manualNotes": "anything else the parent should know"
}
```
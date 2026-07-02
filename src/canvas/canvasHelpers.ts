// Coordinate helpers — spec §16 Task 2.1.

export interface Point {
	x: number;
	y: number;
}

export interface Viewport {
	x: number;
	y: number;
	width: number;
	height: number;
	zoom: number;
}

export const clampZoom = (z: number): number => Math.min(8, Math.max(0.05, z));

export const viewportContains = (vp: Viewport, p: Point): boolean =>
	p.x >= vp.x &&
	p.x <= vp.x + vp.width &&
	p.y >= vp.y &&
	p.y <= vp.y + vp.height;

export const canvasToScreen = (p: Point, vp: Viewport): Point => ({
	x: (p.x - vp.x) * vp.zoom,
	y: (p.y - vp.y) * vp.zoom,
});

export const screenToCanvas = (p: Point, vp: Viewport): Point => ({
	x: p.x / vp.zoom + vp.x,
	y: p.y / vp.zoom + vp.y,
});

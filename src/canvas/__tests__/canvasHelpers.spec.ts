import { describe, it, expect } from "vitest";
import {
	clampZoom,
	viewportContains,
	canvasToScreen,
	screenToCanvas,
	type Viewport,
	type Point,
} from "../canvasHelpers";

describe("clampZoom", () => {
	it("clamps below 0.05", () => {
		expect(clampZoom(0.01)).toBe(0.05);
	});

	it("clamps above 8", () => {
		expect(clampZoom(12)).toBe(8);
	});

	it("passes a valid zoom through", () => {
		expect(clampZoom(1.5)).toBe(1.5);
	});
});

describe("viewportContains", () => {
	const vp: Viewport = { x: 0, y: 0, width: 100, height: 100, zoom: 1 };

	it("returns true when the point is inside", () => {
		const p: Point = { x: 50, y: 50 };
		expect(viewportContains(vp, p)).toBe(true);
	});

	it("returns false when the point is right-of the viewport", () => {
		const p: Point = { x: 150, y: 50 };
		expect(viewportContains(vp, p)).toBe(false);
	});

	it("returns false when the point is above the viewport", () => {
		const p: Point = { x: 50, y: -10 };
		expect(viewportContains(vp, p)).toBe(false);
	});
});

describe("canvasToScreen", () => {
	it("is identity at zoom 1, origin 0", () => {
		const vp: Viewport = { x: 0, y: 0, width: 100, height: 100, zoom: 1 };
		const p: Point = { x: 40, y: 60 };
		expect(canvasToScreen(p, vp)).toEqual({ x: 40, y: 60 });
	});

	it("scales by zoom and offsets by origin at zoom 2", () => {
		const vp: Viewport = { x: 10, y: 20, width: 100, height: 100, zoom: 2 };
		const p: Point = { x: 60, y: 70 };
		// (60-10)*2=100, (70-20)*2=100
		expect(canvasToScreen(p, vp)).toEqual({ x: 100, y: 100 });
	});
});

describe("screenToCanvas", () => {
	it("is the inverse of canvasToScreen at zoom 1", () => {
		const vp: Viewport = { x: 0, y: 0, width: 100, height: 100, zoom: 1 };
		const p: Point = { x: 40, y: 60 };
		expect(screenToCanvas(canvasToScreen(p, vp), vp)).toEqual(p);
	});

	it("is the inverse of canvasToScreen at zoom 2", () => {
		const vp: Viewport = { x: 10, y: 20, width: 100, height: 100, zoom: 2 };
		const p: Point = { x: 60, y: 70 };
		expect(screenToCanvas(canvasToScreen(p, vp), vp)).toEqual(p);
	});
});

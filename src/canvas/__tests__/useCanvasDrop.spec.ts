import { describe, expect, it } from "vitest";
import type { FilmFrame } from "@/search/types";
import { buildImageNode, getImageNodeSize } from "../useCanvasDrop";

const makeFrame = (overrides: Partial<FilmFrame> = {}): FilmFrame => ({
	id: "frame-1",
	title: "Red Hallway",
	director: "Jane Doe",
	year: 1977,
	localThumbPath: "/thumbs/frame-1.jpg",
	sourceUrl: "https://film-grab.test/red-hallway",
	filmGrabWpId: 1,
	dominantColors: ["#FF0000", "#220000", "#110000"],
	embedding: [1, 0],
	width: 224,
	height: 126,
	...overrides,
});

describe("buildImageNode", () => {
	it("preserves the requested canvas position", () => {
		const node = buildImageNode(makeFrame(), { x: 40, y: 60 });

		expect(node.position).toEqual({ x: 40, y: 60 });
	});

	it("keeps the source frame in node data", () => {
		const frame = makeFrame();
		const node = buildImageNode(frame, { x: 0, y: 0 });

		expect(node.data.source).toBe(frame);
	});

	it("caps large images at 400px wide", () => {
		const node = buildImageNode(
			makeFrame({ width: 800, height: 400 }),
			{ x: 0, y: 0 },
		);

		expect(node.style?.width).toBe(400);
	});

	it("preserves aspect ratio when resizing", () => {
		expect(getImageNodeSize({ width: 800, height: 400 })).toEqual({
			width: 400,
			height: 200,
		});
	});

	it("does not upscale small images", () => {
		expect(getImageNodeSize({ width: 200, height: 100 })).toEqual({
			width: 200,
			height: 100,
		});
	});

	it("creates unique node ids", () => {
		const frame = makeFrame();
		const first = buildImageNode(frame, { x: 0, y: 0 });
		const second = buildImageNode(frame, { x: 0, y: 0 });

		expect(first.id).not.toBe(second.id);
	});

	it("initializes transforms non-destructively", () => {
		const node = buildImageNode(makeFrame(), { x: 0, y: 0 });

		expect(node.data.rotation).toBe(0);
		expect(node.data.grayscale).toBe(false);
	});
});

import { describe, expect, it, vi } from "vitest";
import type { ImageNodeType } from "../ImageNode";
import { duplicateNode, normalizeRotation, setRotation, toggleGrayscale } from "../transformStore";

const node: ImageNodeType = {
	id: "node-1",
	type: "image",
	position: { x: 10, y: 20 },
	data: {
		source: {
			id: "frame-1",
			title: "Frame",
			director: "Director",
			year: 1970,
			localThumbPath: "/thumbs/frame.jpg",
			sourceUrl: "https://film-grab.test",
			filmGrabWpId: 1,
			dominantColors: ["#000000", "#111111", "#222222"],
			embedding: [1, 0],
			width: 100,
			height: 50,
		},
		rotation: 0,
		grayscale: false,
	},
};

describe("transformStore", () => {
	it("normalizes rotations", () => {
		expect(normalizeRotation(-5)).toBe(355);
		expect(normalizeRotation(365)).toBe(5);
	});

	it("sets rotation and toggles grayscale immutably", () => {
		expect(setRotation(node, -10).data.rotation).toBe(350);
		expect(toggleGrayscale(node).data.grayscale).toBe(true);
		expect(node.data.grayscale).toBe(false);
	});

	it("duplicates with an offset and unique id", () => {
		vi.spyOn(Date, "now").mockReturnValue(42);
		const copy = duplicateNode(node);

		expect(copy.id).toBe("node-1-copy-42");
		expect(copy.position).toEqual({ x: 34, y: 44 });
		expect(copy.selected).toBe(true);
		expect(node.position).toEqual({ x: 10, y: 20 });
	});
});

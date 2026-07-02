import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
	buildFrameId,
	extractDominantColors,
	normalizeVector,
	resizeImage,
	validateRawPost,
} from "../ingestUtils";

describe("ingestUtils", () => {
	it("resizes images within the thumbnail bounds", async () => {
		const input = await sharp({
			create: { width: 500, height: 250, channels: 3, background: "#ff0000" },
		})
			.jpeg()
			.toBuffer();

		const resized = await resizeImage(input);
		expect(resized.width).toBe(224);
		expect(resized.height).toBe(112);
	});

	it("extracts three hex colors", async () => {
		const input = await sharp({
			create: { width: 20, height: 20, channels: 3, background: "#336699" },
		})
			.jpeg()
			.toBuffer();

		const colors = await extractDominantColors(input);
		expect(colors).toHaveLength(3);
		expect(colors.every((color) => /^#[0-9a-f]{6}$/i.test(color))).toBe(true);
		expect(new Set(colors).size).toBe(1);
	});

	it("validates raw posts and builds frame ids", () => {
		expect(buildFrameId(42, 3)).toBe("42-003");
		expect(
			validateRawPost({
				wpId: 1,
				title: "A",
				director: "B",
				year: 2000,
				sourceUrl: "https://film-grab.test",
				imageUrls: ["https://film-grab.test/a.jpg"],
			}),
		).toBe(true);
		expect(validateRawPost({ wpId: 1, imageUrls: [] })).toBe(false);
	});

	it("normalizes vectors safely", () => {
		expect(normalizeVector([3, 4])).toEqual([0.6, 0.8]);
		expect(normalizeVector([0, 0])).toEqual([0, 0]);
	});
});

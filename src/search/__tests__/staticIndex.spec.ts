import { afterEach, describe, expect, it, vi } from "vitest";
import { loadStaticIndex } from "../staticIndex";

const frame = {
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
};

describe("loadStaticIndex", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("loads valid FilmFrame entries", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn<() => Promise<Response>>().mockResolvedValue(
				new Response(JSON.stringify([frame]), { status: 200 }),
			),
		);

		await expect(loadStaticIndex()).resolves.toEqual([frame]);
	});

	it("filters invalid entries", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn<() => Promise<Response>>().mockResolvedValue(
				new Response(JSON.stringify([frame, { id: "bad" }]), { status: 200 }),
			),
		);

		await expect(loadStaticIndex()).resolves.toEqual([frame]);
	});

	it("returns empty when the index is absent", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn<() => Promise<Response>>().mockResolvedValue(
				new Response("missing", { status: 404 }),
			),
		);

		await expect(loadStaticIndex()).resolves.toEqual([]);
	});

	it("returns empty when fetching throws", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn<() => Promise<Response>>().mockRejectedValue(new Error("offline")),
		);

		await expect(loadStaticIndex()).resolves.toEqual([]);
	});
});

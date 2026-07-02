import { describe, expect, it } from "vitest";
import { buildRawPost, extractImageUrls, parseFilmTitle } from "../crawlUtils";

describe("crawlUtils", () => {
	it("parses FilmGrab titles", () => {
		expect(parseFilmTitle("Paris, Texas [Wim Wenders • 1984]")).toEqual({
			title: "Paris, Texas",
			director: "Wim Wenders",
			year: 1984,
		});
		expect(parseFilmTitle("No bracket")).toBeNull();
	});

	it("extracts and deduplicates gallery images", () => {
		const html = `
			<a href="https://film-grab.test/photo-gallery/a-300x200.jpg?x=1"></a>
			<a href="https://film-grab.test/photo-gallery/a-300x200.jpg?x=2"></a>
			<a href="https://film-grab.test/not-gallery/b.jpg"></a>
		`;

		expect(extractImageUrls(html)).toEqual(["https://film-grab.test/photo-gallery/a.jpg"]);
	});

	it("builds raw posts only when metadata and images are valid", () => {
		const post = {
			id: 12,
			title: { rendered: "Heat [Michael Mann · 1995]" },
			link: "https://film-grab.test/heat",
			date: "2020-01-01",
		};

		expect(buildRawPost(post, "<img src=\"/wp-content/uploads/heat.jpg\">", new Date("2026-01-01"))).toMatchObject({
			wpId: 12,
			title: "Heat",
			director: "Michael Mann",
			year: 1995,
			imageUrls: ["/wp-content/uploads/heat.jpg"],
			crawledAt: "2026-01-01T00:00:00.000Z",
		});
		expect(buildRawPost({ ...post, title: { rendered: "Bad" } }, "")).toBeNull();
	});
});

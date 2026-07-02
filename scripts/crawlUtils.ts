import * as cheerio from "cheerio";
import type { RawFilmPost, WPPost } from "./types";

const TITLE_RE = /^(.+?)\s*\[(.+?)\s*[•·]\s*(\d{4})\]/;
const IMAGE_RE = /\.(jpe?g|png|webp)(?:$|\?)/i;

const decodeTitle = (value: string): string =>
	value
		.replace(/&amp;/g, "&")
		.replace(/&#038;/g, "&")
		.replace(/&#8211;/g, "-")
		.replace(/&#8217;/g, "'")
		.replace(/&quot;/g, '"');

export const parseFilmTitle = (
	rendered: string,
): { title: string; director: string; year: number } | null => {
	const match = TITLE_RE.exec(decodeTitle(rendered));
	if (!match) return null;
	const [, title, director, year] = match;
	if (!title || !director || !year) return null;
	return { title: title.trim(), director: director.trim(), year: Number.parseInt(year, 10) };
};

const normalizeImageUrl = (url: string): string =>
	(url.split("?")[0] ?? url).replace(/-\d+x\d+(\.\w+)$/, "$1");

export const extractImageUrls = (pageHtml: string): string[] => {
	const $ = cheerio.load(pageHtml);
	const urls: string[] = [];

	$('a[href*="photo-gallery"]').each((_, el) => {
		const href = $(el).attr("href");
		if (href && IMAGE_RE.test(href)) urls.push(normalizeImageUrl(href));
	});

	if (urls.length === 0) {
		$('img[src*="wp-content/uploads"], img[data-src*="wp-content/uploads"]').each((_, el) => {
			const src = $(el).attr("src") ?? $(el).attr("data-src");
			if (src && IMAGE_RE.test(src)) urls.push(normalizeImageUrl(src));
		});
	}

	return Array.from(new Set(urls));
};

export const buildRawPost = (wp: WPPost, pageHtml: string, now = new Date()): RawFilmPost | null => {
	const parsed = parseFilmTitle(wp.title.rendered);
	if (!parsed) return null;
	const imageUrls = extractImageUrls(pageHtml);
	if (imageUrls.length === 0) return null;
	return {
		wpId: wp.id,
		title: parsed.title,
		director: parsed.director,
		year: parsed.year,
		imageUrls,
		sourceUrl: wp.link,
		crawledAt: now.toISOString(),
	};
};

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

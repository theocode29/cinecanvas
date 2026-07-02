import type { FilmFrame } from "./types";

const STATIC_INDEX_PATH = "/static_index.json";

export const loadStaticIndex = async (
	path = STATIC_INDEX_PATH,
): Promise<FilmFrame[]> => {
	if (typeof fetch !== "function") {
		return [];
	}

	try {
		const response = await fetch(path);

		if (!response.ok) {
			return [];
		}

		const json: unknown = await response.json();
		return Array.isArray(json) ? json.filter(isFilmFrame) : [];
	} catch {
		return [];
	}
};

const isFilmFrame = (value: unknown): value is FilmFrame => {
	if (!value || typeof value !== "object") {
		return false;
	}

	const frame = value as Partial<FilmFrame>;

	return (
		typeof frame.id === "string" &&
		typeof frame.title === "string" &&
		typeof frame.director === "string" &&
		typeof frame.year === "number" &&
		typeof frame.localThumbPath === "string" &&
		typeof frame.sourceUrl === "string" &&
		typeof frame.filmGrabWpId === "number" &&
		Array.isArray(frame.dominantColors) &&
		frame.dominantColors.length === 3 &&
		Array.isArray(frame.embedding) &&
		typeof frame.width === "number" &&
		typeof frame.height === "number"
	);
};

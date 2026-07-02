import sharp from "sharp";
import type { RawFilmPost } from "./types";

export const MAX_THUMB_PX = 224;
export const JPEG_QUALITY = 85;

export const resizeImage = async (
	inputBuf: Buffer,
): Promise<{ buf: Buffer; width: number; height: number; origWidth: number; origHeight: number }> => {
	const meta = await sharp(inputBuf).metadata();
	const origWidth = meta.width ?? 0;
	const origHeight = meta.height ?? 0;
	const largest = Math.max(origWidth, origHeight);
	const scale = largest > MAX_THUMB_PX ? MAX_THUMB_PX / largest : 1;
	const width = Math.max(1, Math.round(origWidth * scale));
	const height = Math.max(1, Math.round(origHeight * scale));
	const buf = await sharp(inputBuf).resize(width, height).jpeg({ quality: JPEG_QUALITY }).toBuffer();
	return { buf, width, height, origWidth, origHeight };
};

const toHex = (value: number): string => value.toString(16).padStart(2, "0");

export const extractDominantColors = async (inputBuf: Buffer): Promise<[string, string, string]> => {
	const { data, info } = await sharp(inputBuf)
		.resize(60, 60, { fit: "cover" })
		.removeAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	const zones = [0, Math.floor(info.height / 3), Math.floor((info.height * 2) / 3)];
	const colors = zones.map((row) => {
		let r = 0;
		let g = 0;
		let b = 0;
		let count = 0;
		for (let y = row; y < Math.min(info.height, row + Math.ceil(info.height / 3)); y += 1) {
			for (let x = 0; x < info.width; x += 1) {
				const offset = (y * info.width + x) * 3;
				r += data[offset] ?? 0;
				g += data[offset + 1] ?? 0;
				b += data[offset + 2] ?? 0;
				count += 1;
			}
		}
		return `#${toHex(Math.round(r / count))}${toHex(Math.round(g / count))}${toHex(Math.round(b / count))}`;
	});
	return [colors[0] ?? "#000000", colors[1] ?? "#000000", colors[2] ?? "#000000"];
};

export const buildFrameId = (wpId: number, imageIndex: number): string =>
	`${wpId}-${String(imageIndex).padStart(3, "0")}`;

export const validateRawPost = (post: unknown): post is RawFilmPost => {
	if (typeof post !== "object" || post === null) return false;
	const value = post as Record<string, unknown>;
	return (
		typeof value.wpId === "number" &&
		typeof value.title === "string" &&
		typeof value.director === "string" &&
		typeof value.year === "number" &&
		typeof value.sourceUrl === "string" &&
		Array.isArray(value.imageUrls) &&
		value.imageUrls.length > 0
	);
};

export const normalizeVector = (values: readonly number[]): number[] => {
	const magnitude = Math.hypot(...values);
	return magnitude === 0 ? [...values] : values.map((value) => value / magnitude);
};

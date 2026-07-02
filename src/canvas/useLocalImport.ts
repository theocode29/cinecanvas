import { convertFileSrc } from "@tauri-apps/api/core";
import type { LocalImage } from "@/search/types";

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

export const isImportableFile = (path: string): boolean => IMAGE_EXT.test(path);

export const buildLocalImage = (
	path: string,
	width: number,
	height: number,
	options: { convert?: (path: string) => string; now?: () => Date } = {},
): LocalImage => ({
	id: `local-${crypto.randomUUID()}`,
	localPath: (options.convert ?? convertFileSrc)(path),
	width,
	height,
	importedAt: (options.now ?? (() => new Date()))().toISOString(),
});

export const measureImage = async (src: string): Promise<{ width: number; height: number }> =>
	new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
		image.onerror = () => reject(new Error("Unable to measure image"));
		image.src = src;
	});

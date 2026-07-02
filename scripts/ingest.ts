import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fetch } from "undici";
import cliProgress from "cli-progress";
import {
	buildFrameId,
	extractDominantColors,
	normalizeVector,
	resizeImage,
	validateRawPost,
} from "./ingestUtils";
import type { RawFilmPost } from "./types";
import type { FilmFrame } from "../src/search/types";

const MODEL_ID = "Xenova/clip-vit-base-patch32";
const RAW_PATH = "data/raw_catalog.json";
const INDEX_PATH = "public/static_index.json";
const THUMBS_DIR = "public/thumbs";

interface IngestArgs {
	full: boolean;
	limit: number;
	noClip: boolean;
}

interface VisionRuntime {
	embed(input: Buffer): Promise<number[]>;
}

const parseArgs = (argv: readonly string[]): IngestArgs => {
	const full = argv.includes("--full");
	const noClip = argv.includes("--no-clip");
	const limitIndex = argv.indexOf("--limit");
	const limit =
		limitIndex >= 0 && argv[limitIndex + 1]
			? Number.parseInt(argv[limitIndex + 1] ?? "", 10)
			: Number.POSITIVE_INFINITY;
	return { full, noClip, limit: Number.isFinite(limit) && limit > 0 ? limit : Number.POSITIVE_INFINITY };
};

const loadCatalog = async (): Promise<RawFilmPost[]> => {
	const raw = JSON.parse(await readFile(RAW_PATH, "utf8")) as unknown;
	if (!Array.isArray(raw)) return [];
	return raw.filter(validateRawPost);
};

const fetchImage = async (url: string): Promise<Buffer> => {
	const response = await fetch(url, { headers: { "User-Agent": "CineCanvas MVP ingest" } });
	if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
	return Buffer.from(await response.arrayBuffer());
};

const buildVisionRuntime = async (noClip: boolean): Promise<VisionRuntime> => {
	if (noClip) {
		return { embed: async () => Array.from({ length: 512 }, () => 0) };
	}

	const { AutoProcessor, CLIPVisionModelWithProjection, RawImage, env } = await import("@huggingface/transformers");
	env.allowRemoteModels = true;
	const processor = await AutoProcessor.from_pretrained(MODEL_ID);
	const model = await CLIPVisionModelWithProjection.from_pretrained(MODEL_ID, { dtype: "fp32" });

	return {
		embed: async (input: Buffer) => {
			const image = await RawImage.read(new Blob([input]));
			const imageInputs = await processor(image);
			const output = await model(imageInputs);
			const embeds = output.image_embeds as { data: ArrayLike<number> };
			return normalizeVector(Array.from(embeds.data));
		},
	};
};

const writeIndex = async (frames: readonly FilmFrame[]): Promise<void> => {
	await mkdir(dirname(INDEX_PATH), { recursive: true });
	const tmpPath = `${INDEX_PATH}.tmp`;
	await writeFile(tmpPath, `${JSON.stringify(frames)}\n`);
	await rename(tmpPath, INDEX_PATH);
};

const main = async (): Promise<void> => {
	const args = parseArgs(process.argv.slice(2));
	const catalog = (await loadCatalog()).slice(0, args.limit);
	await mkdir(THUMBS_DIR, { recursive: true });
	const vision = await buildVisionRuntime(args.noClip);
	const frames: FilmFrame[] = [];
	const total = args.full
		? catalog.reduce((sum, post) => sum + post.imageUrls.length, 0)
		: catalog.length;
	const progress = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	progress.start(total, 0);

	for (const post of catalog) {
		const urls = args.full ? post.imageUrls : post.imageUrls.slice(0, 1);
		for (const [imageIndex, imageUrl] of urls.entries()) {
			try {
				const input = await fetchImage(imageUrl);
				const resized = await resizeImage(input);
				const id = buildFrameId(post.wpId, imageIndex);
				const thumbPath = join(THUMBS_DIR, `${id}.jpg`);
				await writeFile(thumbPath, resized.buf);
				frames.push({
					id,
					title: post.title,
					director: post.director,
					year: post.year,
					localThumbPath: `/thumbs/${id}.jpg`,
					sourceUrl: post.sourceUrl,
					filmGrabWpId: post.wpId,
					dominantColors: await extractDominantColors(resized.buf),
					embedding: await vision.embed(resized.buf),
					width: resized.width,
					height: resized.height,
				});
			} catch (error) {
				console.warn(`Skipped ${post.wpId}/${imageIndex}: ${String(error)}`);
			}
			progress.increment();
		}
	}

	progress.stop();
	await writeIndex(frames);
	console.info(`Wrote ${frames.length} frames to ${INDEX_PATH}`);
};

void main().catch((error) => {
	console.error(error);
	process.exit(1);
});

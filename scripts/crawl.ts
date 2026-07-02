import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fetch } from "undici";
import cliProgress from "cli-progress";
import { buildRawPost, sleep } from "./crawlUtils";
import type { RawFilmPost, WPPost } from "./types";

const API_ROOT = "https://film-grab.com/wp-json/wp/v2/posts";
const OUTPUT_PATH = "data/raw_catalog.json";
const API_DELAY_MS = 1200;
const PAGE_DELAY_MS = 800;
const PER_PAGE = 100;
const MVP_FILM_LIMIT = 4000;

interface CrawlArgs {
	full: boolean;
	limit: number;
}

const parseArgs = (argv: readonly string[]): CrawlArgs => {
	const full = argv.includes("--full");
	const limitIndex = argv.indexOf("--limit");
	const limit =
		limitIndex >= 0 && argv[limitIndex + 1]
			? Number.parseInt(argv[limitIndex + 1] ?? "", 10)
			: full
				? Number.POSITIVE_INFINITY
				: MVP_FILM_LIMIT;
	return { full, limit: Number.isFinite(limit) && limit > 0 ? limit : MVP_FILM_LIMIT };
};

const readExisting = async (): Promise<RawFilmPost[]> => {
	try {
		const raw = await readFile(OUTPUT_PATH, "utf8");
		const parsed = JSON.parse(raw) as unknown;
		return Array.isArray(parsed) ? (parsed as RawFilmPost[]) : [];
	} catch {
		return [];
	}
};

const fetchJson = async <T>(url: string): Promise<T> => {
	const response = await fetch(url, { headers: { "User-Agent": "CineCanvas MVP crawler" } });
	if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
	return (await response.json()) as T;
};

const fetchText = async (url: string): Promise<string> => {
	const response = await fetch(url, { headers: { "User-Agent": "CineCanvas MVP crawler" } });
	if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
	return await response.text();
};

const writeCatalog = async (catalog: readonly RawFilmPost[]): Promise<void> => {
	await mkdir(dirname(OUTPUT_PATH), { recursive: true });
	const tmpPath = `${OUTPUT_PATH}.tmp`;
	await writeFile(tmpPath, `${JSON.stringify(catalog, null, 2)}\n`);
	await rename(tmpPath, OUTPUT_PATH);
};

const main = async (): Promise<void> => {
	const args = parseArgs(process.argv.slice(2));
	const existing = args.full ? [] : await readExisting();
	const byWpId = new Map(existing.map((post) => [post.wpId, post]));
	const progress = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	progress.start(args.limit, Math.min(byWpId.size, args.limit));

	let page = 1;
	while (byWpId.size < args.limit) {
		const url = `${API_ROOT}?per_page=${PER_PAGE}&page=${page}&_fields=id,title,link,date`;
		let posts: WPPost[];
		try {
			posts = await fetchJson<WPPost[]>(url);
		} catch (error) {
			if (page > 1) break;
			throw error;
		}
		if (posts.length === 0) break;

		for (const post of posts) {
			if (byWpId.size >= args.limit) break;
			if (byWpId.has(post.id)) continue;
			const html = await fetchText(post.link);
			const rawPost = buildRawPost(post, html);
			if (rawPost) byWpId.set(rawPost.wpId, rawPost);
			progress.update(Math.min(byWpId.size, args.limit));
			await sleep(PAGE_DELAY_MS);
		}

		page += 1;
		await sleep(API_DELAY_MS);
	}

	progress.stop();
	await writeCatalog(Array.from(byWpId.values()).slice(0, args.limit));
	console.info(`Wrote ${Math.min(byWpId.size, args.limit)} films to ${OUTPUT_PATH}`);
};

void main().catch((error) => {
	console.error(error);
	process.exit(1);
});

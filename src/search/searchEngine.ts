import { create, insert, search as oramaSearch, type AnyOrama } from '@orama/orama';
import { AutoTokenizer, CLIPTextModelWithProjection, env } from '@huggingface/transformers';
import { createLogger } from '@/lib/logger';
import { colorSimilarity, hexToRgb } from './colorUtils';
import type { FilmFrame, SearchQuery, SearchResult } from './types';
import { computeCosineSimilarity, normalizeVector } from './vectorMath';

const MODEL_ID = 'Xenova/clip-vit-base-patch32';
const DEFAULT_LIMIT = 10;
const ORAMA_LIMIT = 50;

export const SEARCH_WEIGHTS = {
  clip: 0.7,
  orama: 0.3,
  textCombined: 0.6,
  colorCombined: 0.4,
} as const;

interface TextEmbedder {
  embedText(text: string): Promise<number[]>;
}

interface SearchDocument {
  id: string;
  title: string;
  director: string;
  year: number;
}

interface ClipTensor {
  data: ArrayLike<number>;
}

interface ClipTextOutput {
  text_embeds: ClipTensor;
}

type ClipTokenizer = (text: string[], options: { padding: boolean; truncation: boolean }) => unknown;
type ClipTextModel = (inputs: unknown) => Promise<ClipTextOutput>;

const log = createLogger('FEAT-003', 'SearchEngine');

class ClipTextEmbedder implements TextEmbedder {
  private tokenizer: ClipTokenizer | null = null;
  private textModel: ClipTextModel | null = null;

  async init(): Promise<void> {
    env.allowRemoteModels = false;
    env.localModelPath = '/models/';

    this.tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID);
    this.textModel = await CLIPTextModelWithProjection.from_pretrained(MODEL_ID, {
      dtype: 'q8',
    });
  }

  async embedText(text: string): Promise<number[]> {
    if (!this.tokenizer || !this.textModel) {
      return [];
    }

    try {
      const inputs = this.tokenizer([text], { padding: true, truncation: true });
      const { text_embeds: textEmbeds } = await this.textModel(inputs);

      return normalizeVector(Array.from(textEmbeds.data));
    } catch (error) {
      log.warn('CLIP text embedding failed', { error: String(error) });
      return [];
    }
  }
}

export interface SearchEngineOptions {
  textEmbedder?: TextEmbedder;
}

export class SearchEngine {
  private db: AnyOrama | null = null;
  private frames = new Map<string, FilmFrame>();
  private ready = false;
  private readonly textEmbedder: TextEmbedder;

  constructor(options: SearchEngineOptions = {}) {
    this.textEmbedder = options.textEmbedder ?? new ClipTextEmbedder();
  }

  async init(): Promise<void> {
    this.db = await create({
      schema: {
        id: 'string',
        title: 'string',
        director: 'string',
        year: 'number',
      } as const,
    });

    try {
      const maybeInit = this.textEmbedder as Partial<{ init: () => Promise<void> }>;
      await maybeInit.init?.();
      log.info('Search engine initialized');
    } catch (error) {
      log.error('CLIP text model failed', { error: String(error) });
    }

    this.ready = true;
  }

  async ingest(frames: readonly FilmFrame[]): Promise<void> {
    if (!this.db) {
      throw new Error('SearchEngine is not initialized');
    }

    for (const frame of frames) {
      if (this.frames.has(frame.id)) {
        continue;
      }

      this.frames.set(frame.id, frame);
      await insert(this.db, toSearchDocument(frame));
    }
  }

  async embedText(text: string): Promise<number[]> {
    return this.textEmbedder.embedText(text);
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!this.ready || !this.db || this.frames.size === 0) {
      return [];
    }

    const text = query.text?.trim() ?? '';
    const colorHex = query.colorHex?.trim() ?? '';

    if (text.length < 2 && colorHex.length === 0) {
      return [];
    }

    const scored = new Map<string, number>();

    const hasText = text.length >= 2;
    const hasColor = colorHex.length > 0;

    if (hasText) {
      await this.scoreText(text, scored, hasColor ? SEARCH_WEIGHTS.textCombined : 1);
    }

    if (hasColor) {
      const weight = hasText ? SEARCH_WEIGHTS.colorCombined : 1;
      const colorResults = this.rankByColor(colorHex, this.frames.size);

      for (const result of colorResults) {
        scored.set(result.frame.id, (scored.get(result.frame.id) ?? 0) + result.score * weight);
      }
    }

    return this.toResults(scored, query.limit);
  }

  async searchByColor(hex: string, limit = DEFAULT_LIMIT): Promise<SearchResult[]> {
    return this.rankByColor(hex, limit);
  }

  getStats(): { indexedCount: number; ready: boolean } {
    return { indexedCount: this.frames.size, ready: this.ready };
  }

  async reset(): Promise<void> {
    this.frames.clear();
    this.ready = false;
    await this.init();
  }

  private async scoreText(
    text: string,
    scored: Map<string, number>,
    weight: number,
  ): Promise<void> {
    let textVector: number[] = [];

    try {
      textVector = await this.embedText(text);
    } catch (error) {
      log.warn('Text embedding failed', { error: String(error) });
    }

    if (textVector.length > 0) {
      for (const [id, frame] of this.frames) {
        const score = computeCosineSimilarity(textVector, frame.embedding);
        scored.set(id, (scored.get(id) ?? 0) + score * SEARCH_WEIGHTS.clip * weight);
      }
    }

    if (!this.db) {
      return;
    }

    try {
      const results = await oramaSearch(this.db, {
        term: text,
        properties: ['title', 'director'],
        limit: ORAMA_LIMIT,
      });

      for (const hit of results.hits) {
        const document = hit.document as Partial<SearchDocument>;
        const id = document.id;

        if (!id) {
          continue;
        }

        scored.set(id, (scored.get(id) ?? 0) + hit.score * SEARCH_WEIGHTS.orama * weight);
      }
    } catch (error) {
      log.warn('Orama search failed', { error: String(error) });
    }
  }

  private rankByColor(hex: string, limit: number): SearchResult[] {
    const queryRgb = hexToRgb(hex);

    if (!queryRgb || this.frames.size === 0) {
      return [];
    }

    return Array.from(this.frames.values())
      .flatMap((frame) => {
        const frameRgb = hexToRgb(frame.dominantColors[0]);
        return frameRgb ? [{ frame, score: colorSimilarity(queryRgb, frameRgb) }] : [];
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private toResults(scored: Map<string, number>, limit = DEFAULT_LIMIT): SearchResult[] {
    return Array.from(scored.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .flatMap(([id, score]) => {
        const frame = this.frames.get(id);
        return frame ? [{ frame, score }] : [];
      });
  }
}

const toSearchDocument = (frame: FilmFrame): SearchDocument => ({
  id: frame.id,
  title: frame.title,
  director: frame.director,
  year: frame.year,
});

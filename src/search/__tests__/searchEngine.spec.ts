import { describe, expect, it, vi } from 'vitest';
import { SEARCH_WEIGHTS, SearchEngine } from '../searchEngine';
import type { FilmFrame } from '../types';

const makeFrame = (overrides: Partial<FilmFrame> = {}): FilmFrame => ({
  id: 'frame-1',
  title: 'Red Hallway',
  director: 'Jane Doe',
  year: 1977,
  localThumbPath: '/thumbs/frame-1.jpg',
  sourceUrl: 'https://film-grab.test/red-hallway',
  filmGrabWpId: 1,
  dominantColors: ['#FF0000', '#110000', '#220000'],
  embedding: [1, 0],
  width: 224,
  height: 126,
  ...overrides,
});

const makeEmbedder = (embedding: number[] = [1, 0]) => ({
  init: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  embedText: vi.fn<(text: string) => Promise<number[]>>().mockResolvedValue(embedding),
});

describe('SearchEngine', () => {
  it('initializes and exposes ready stats', async () => {
    const embedder = makeEmbedder();
    const engine = new SearchEngine({ textEmbedder: embedder });

    await engine.init();

    expect(engine.getStats()).toEqual({ indexedCount: 0, ready: true });
    expect(embedder.init).toHaveBeenCalledOnce();
  });

  it('returns no results for an empty index', async () => {
    const engine = new SearchEngine({ textEmbedder: makeEmbedder() });
    await engine.init();

    await expect(engine.search({ text: 'red' })).resolves.toEqual([]);
  });

  it('ingests frames and updates stats', async () => {
    const engine = new SearchEngine({ textEmbedder: makeEmbedder() });
    await engine.init();
    await engine.ingest([makeFrame(), makeFrame({ id: 'frame-2' })]);

    expect(engine.getStats().indexedCount).toBe(2);
  });

  it('does not duplicate an already ingested frame id', async () => {
    const engine = new SearchEngine({ textEmbedder: makeEmbedder() });
    await engine.init();
    await engine.ingest([makeFrame()]);
    await engine.ingest([makeFrame({ title: 'Changed title' })]);

    expect(engine.getStats().indexedCount).toBe(1);
  });

  it('requires initialization before ingest', async () => {
    const engine = new SearchEngine({ textEmbedder: makeEmbedder() });

    await expect(engine.ingest([makeFrame()])).rejects.toThrow('SearchEngine is not initialized');
  });

  it('returns no results for absent text and color', async () => {
    const engine = new SearchEngine({ textEmbedder: makeEmbedder() });
    await engine.init();
    await engine.ingest([makeFrame()]);

    await expect(engine.search({})).resolves.toEqual([]);
  });

  it('ignores text queries shorter than two characters', async () => {
    const embedder = makeEmbedder();
    const engine = new SearchEngine({ textEmbedder: embedder });
    await engine.init();
    await engine.ingest([makeFrame()]);

    await expect(engine.search({ text: 'r' })).resolves.toEqual([]);
    expect(embedder.embedText).not.toHaveBeenCalled();
  });

  it('returns text search results with the expected shape', async () => {
    const engine = new SearchEngine({ textEmbedder: makeEmbedder([1, 0]) });
    await engine.init();
    await engine.ingest([
      makeFrame({ id: 'red', embedding: [1, 0] }),
      makeFrame({ id: 'blue', title: 'Blue Room', embedding: [0, 1] }),
    ]);

    const results = await engine.search({ text: 'zz' });

    expect(results[0]?.frame.id).toBe('red');
    expect(results[0]?.score).toBeCloseTo(SEARCH_WEIGHTS.clip);
    expect(results[0]?.frame.localThumbPath).toBe('/thumbs/frame-1.jpg');
  });

  it('uses Orama title and director matches as text boost', async () => {
    const engine = new SearchEngine({ textEmbedder: makeEmbedder([]) });
    await engine.init();
    await engine.ingest([
      makeFrame({ id: 'red', title: 'Red Hallway', director: 'Jane Doe' }),
      makeFrame({ id: 'blue', title: 'Blue Room', director: 'Chris Example' }),
    ]);

    const results = await engine.search({ text: 'Chris' });

    expect(results[0]?.frame.id).toBe('blue');
    expect(results[0]?.score).toBeGreaterThan(0);
  });

  it('ranks color-only search by dominant color distance', async () => {
    const engine = new SearchEngine({ textEmbedder: makeEmbedder() });
    await engine.init();
    await engine.ingest([
      makeFrame({ id: 'blue', dominantColors: ['#0000FF', '#000022', '#000011'] }),
      makeFrame({ id: 'red', dominantColors: ['#FF0000', '#220000', '#110000'] }),
    ]);

    const results = await engine.searchByColor('#FF0000');

    expect(results.map((result) => result.frame.id)).toEqual(['red', 'blue']);
    expect(results[0]?.score).toBe(1);
  });

  it('returns an empty color result for invalid hex', async () => {
    const engine = new SearchEngine({ textEmbedder: makeEmbedder() });
    await engine.init();
    await engine.ingest([makeFrame()]);

    await expect(engine.searchByColor('#XX0000')).resolves.toEqual([]);
  });

  it('respects result limits', async () => {
    const engine = new SearchEngine({ textEmbedder: makeEmbedder() });
    await engine.init();
    await engine.ingest([
      makeFrame({ id: 'a', dominantColors: ['#FF0000', '#000000', '#000000'] }),
      makeFrame({ id: 'b', dominantColors: ['#EE0000', '#000000', '#000000'] }),
      makeFrame({ id: 'c', dominantColors: ['#DD0000', '#000000', '#000000'] }),
    ]);

    const results = await engine.search({ colorHex: '#FF0000', limit: 2 });

    expect(results).toHaveLength(2);
  });

  it('combines text and color with the phase weights', async () => {
    const engine = new SearchEngine({ textEmbedder: makeEmbedder([1, 0]) });
    await engine.init();
    await engine.ingest([
      makeFrame({ id: 'red', embedding: [1, 0], dominantColors: ['#FF0000', '#000000', '#000000'] }),
      makeFrame({ id: 'blue', embedding: [0, 1], dominantColors: ['#0000FF', '#000000', '#000000'] }),
    ]);

    const results = await engine.search({ text: 'zz', colorHex: '#FF0000' });

    expect(results[0]?.frame.id).toBe('red');
    expect(results[0]?.score).toBeCloseTo(
      SEARCH_WEIGHTS.clip * SEARCH_WEIGHTS.textCombined + SEARCH_WEIGHTS.colorCombined,
    );
  });

  it('does not throw when text embedding fails', async () => {
    const embedder = {
      init: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      embedText: vi.fn<(text: string) => Promise<number[]>>().mockRejectedValue(new Error('boom')),
    };
    const engine = new SearchEngine({ textEmbedder: embedder });
    await engine.init();
    await engine.ingest([makeFrame({ title: 'No match' })]);

    await expect(engine.search({ text: 'zz' })).resolves.toEqual([]);
  });

  it('delegates embedText to the configured embedder', async () => {
    const embedder = makeEmbedder([0.6, 0.8]);
    const engine = new SearchEngine({ textEmbedder: embedder });
    await engine.init();

    await expect(engine.embedText('red')).resolves.toEqual([0.6, 0.8]);
  });

  it('reset clears indexed frames and keeps the engine ready', async () => {
    const engine = new SearchEngine({ textEmbedder: makeEmbedder() });
    await engine.init();
    await engine.ingest([makeFrame()]);

    await engine.reset();

    expect(engine.getStats()).toEqual({ indexedCount: 0, ready: true });
    await expect(engine.search({ colorHex: '#FF0000' })).resolves.toEqual([]);
  });
});

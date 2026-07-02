import { describe, expect, it } from 'vitest';
import {
  computeCosineSimilarity,
  dotProduct,
  magnitude,
  normalizeVector,
} from '../vectorMath';

describe('vectorMath', () => {
  it('returns 1 for identical vectors', () => {
    expect(computeCosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(computeCosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it('returns -1 for opposite vectors', () => {
    expect(computeCosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });

  it('does not throw for a zero vector', () => {
    expect(() => computeCosineSimilarity([0, 0], [1, 1])).not.toThrow();
  });

  it('returns 0 when either vector is zero', () => {
    expect(computeCosineSimilarity([0, 0], [1, 1])).toBe(0);
    expect(computeCosineSimilarity([1, 1], [0, 0])).toBe(0);
  });

  it('computes dot products', () => {
    expect(dotProduct([1, 2, 3], [4, 5, 6])).toBe(32);
  });

  it('treats missing dot product dimensions as zero', () => {
    expect(dotProduct([1, 2, 3], [4])).toBe(4);
  });

  it('computes magnitude for a 3-4-5 vector', () => {
    expect(magnitude([3, 4])).toBe(5);
  });

  it('computes zero magnitude', () => {
    expect(magnitude([0, 0])).toBe(0);
  });

  it('normalizes to unit length', () => {
    expect(magnitude(normalizeVector([3, 4]))).toBeCloseTo(1);
  });

  it('keeps a zero vector zero when normalizing', () => {
    expect(normalizeVector([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it('keeps 512-dimensional cosine similarity in range', () => {
    const a = Array.from({ length: 512 }, (_, index) => Math.sin(index));
    const b = Array.from({ length: 512 }, (_, index) => Math.cos(index));
    const score = computeCosineSimilarity(a, b);

    expect(score).toBeGreaterThanOrEqual(-1);
    expect(score).toBeLessThanOrEqual(1);
  });
});

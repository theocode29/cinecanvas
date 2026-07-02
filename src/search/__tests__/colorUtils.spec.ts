import { describe, expect, it } from 'vitest';
import { colorDistance, colorSimilarity, hexToRgb } from '../colorUtils';

describe('colorUtils', () => {
  it('parses red hex', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses black hex', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('parses white hex', () => {
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('rejects invalid hex', () => {
    expect(hexToRgb('#GG0000')).toBeNull();
  });

  it('accepts hex without a leading hash', () => {
    expect(hexToRgb('336699')).toEqual({ r: 51, g: 102, b: 153 });
  });

  it('returns zero distance for identical colors', () => {
    const red = { r: 255, g: 0, b: 0 };

    expect(colorDistance(red, red)).toBe(0);
  });

  it('returns a positive distance for different colors', () => {
    expect(colorDistance({ r: 255, g: 0, b: 0 }, { r: 0, g: 0, b: 255 })).toBeGreaterThan(0);
  });

  it('computes the maximum rgb distance', () => {
    expect(colorDistance({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(441.67, 2);
  });

  it('maps identical colors to full similarity', () => {
    expect(colorSimilarity({ r: 12, g: 34, b: 56 }, { r: 12, g: 34, b: 56 })).toBe(1);
  });

  it('maps maximum distance to zero similarity', () => {
    expect(colorSimilarity({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(0);
  });
});

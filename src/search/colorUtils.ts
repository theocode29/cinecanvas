export interface RGB {
  r: number;
  g: number;
  b: number;
}

const HEX_COLOR = /^#?([0-9a-fA-F]{6})$/;

export const hexToRgb = (hex: string): RGB | null => {
  const match = hex.trim().match(HEX_COLOR);

  if (!match) {
    return null;
  }

  const value = match[1];

  if (value === undefined) {
    return null;
  }

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
};

export const colorDistance = (a: RGB, b: RGB): number =>
  Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);

export const colorSimilarity = (a: RGB, b: RGB): number =>
  1 - colorDistance(a, b) / Math.sqrt(255 ** 2 * 3);

export const dotProduct = (a: readonly number[], b: readonly number[]): number =>
  a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);

export const magnitude = (vector: readonly number[]): number =>
  Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

export const normalizeVector = (vector: readonly number[]): number[] => {
  const length = magnitude(vector);
  return length === 0 ? vector.map(() => 0) : vector.map((value) => value / length);
};

export const computeCosineSimilarity = (
  a: readonly number[],
  b: readonly number[],
): number => {
  const aMagnitude = magnitude(a);
  const bMagnitude = magnitude(b);

  if (aMagnitude === 0 || bMagnitude === 0) {
    return 0;
  }

  return dotProduct(a, b) / (aMagnitude * bMagnitude);
};

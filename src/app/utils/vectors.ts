export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}

export function averageVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const len = vectors[0].length;
  const result = new Array(len).fill(0);
  for (const vec of vectors) {
    for (let i = 0; i < len; i++) {
      result[i] += vec[i];
    }
  }
  return result.map((v) => v / vectors.length);
}

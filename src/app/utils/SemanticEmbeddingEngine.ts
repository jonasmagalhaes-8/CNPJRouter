// src/app/utils/SemanticEmbeddingEngine.ts

export const EMBEDDING_DIMENSIONS = 128;
export const CATEGORY_CENTER_SPREAD = 5.0;
export const WITHIN_CATEGORY_NOISE = 0.15;

export class SemanticEmbeddingEngine {
  /**
   * Simple seeded PRNG
   */
  private static seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
      return (s >>> 0) / 0xFFFFFFFF;
    };
  }

  /**
   * Simple string hash function
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * Calcula um vetor matemático (embedding de 128 dimensões)
   * puramente baseado nas palavras do texto passado, usando
   * um algoritmo determinístico tipo "Bag of Words".
   * Dessa forma, não dependemos de categorias fixas!
   */
  public static calculateEmbeddingForText(text: string): number[] {
    // Normaliza o texto e extrai palavras-chave
    const words = text
      .toLowerCase()
      .replace(/[^\w\sà-ú]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2); // ignora preposições curtas
    
    const dims = EMBEDDING_DIMENSIONS;
    const result = new Array(dims).fill(0);
    
    if (words.length === 0) words.push(text.toLowerCase()); 

    // Para cada palavra, gera um vetor e soma (composição semântica)
    for (const word of words) {
      const seed = this.hashString(word);
      const rng = this.seededRandom(seed);
      for (let i = 0; i < dims; i++) {
        result[i] += (rng() - 0.5) * 2;
      }
    }
    
    // Normaliza o vetor resultante (Unit vector)
    const norm = Math.sqrt(result.reduce((s, x) => s + x * x, 0));
    return result.map(x => (norm > 0 ? x / norm : 0));
  }
}

import { supabaseAdmin } from "../lib/supabaseAdmin";
import { embedTextoCompleto } from "./embeddingService";

/**
 * Interface representando o formato esperado de uma heurística retornada.
 */
interface Heuristica {
  id: string;
  arquivo: string;
  embedding: number[];
  tags?: string[];
  tipo: string;
  similaridade: number;
}

/**
 * Busca heurísticas semânticas semelhantes usando embeddings.
 *
 * @param texto - Texto de entrada para gerar o embedding.
 * @param threshold - Limite de similaridade (default: 0.75).
 * @param matchCount - Quantidade de heurísticas retornadas (default: 5).
 * @returns Lista de heurísticas filtradas por tipo.
 */
export async function buscarHeuristicasSemelhantes(
  texto: string,
  threshold = 0.75,
  matchCount = 5
): Promise<Heuristica[]> {
  try {
    if (!texto?.trim()) {
      console.warn("⚠️ Texto de entrada vazio ou inválido.");
      return [];
    }

    // ✅ Gerar embedding do texto de entrada
    const query_embedding = await embedTextoCompleto(texto, "🔍 heuristica");

    if (!query_embedding || !Array.isArray(query_embedding)) {
      console.error("❌ Embedding gerado inválido.");
      return [];
    }

    // ✅ Chamada RPC sem generics
    const response = await supabaseAdmin.rpc("buscar_heuristica_semelhante", {
      query_embedding,
      match_threshold: threshold,
      match_count: matchCount
    });

    if (response.error) {
      console.error("❌ Erro RPC heurística:", response.error.message);
      return [];
    }

    const data = response.data as Heuristica[] | null;

    // ✅ Filtra apenas heurísticas dos tipos desejados
    return (data ?? []).filter((item) =>
      ["cognitiva", "filosofico"].includes(item.tipo)
    );
  } catch (err) {
    console.error("❌ Erro inesperado ao gerar embedding ou buscar heurísticas:", (err as Error).message);
    return [];
  }
}

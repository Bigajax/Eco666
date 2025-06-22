import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { updateEmotionalProfile } from "./updateEmotionalProfile";
import { montarContextoEco } from "../controllers/promptController";
import { embedTextoCompleto } from "./embeddingService";

/* ---------------------------------------------------- */
/* 🔄 Utilidades                                        */
/* ---------------------------------------------------- */
const mapRoleForOpenAI = (role: string): "user" | "assistant" | "system" => {
  if (role === "model") return "assistant";
  if (role === "system") return "system";
  return "user";
};

const limparResposta = (t: string) =>
  t
    .replace(/```json[\s\S]*?```/gi, "")
    .replace(/```[\s\S]*?```/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/###.*?###/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const formatarTextoEco = (t: string) =>
  t
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/(?<!\n)\n(?!\n)/g, "\n\n")
    .replace(/^-\s+/gm, "— ")
    .replace(/^\s+/gm, "")
    .trim();

/* ---------------------------------------------------- */
/* 🔧 Gera bloco técnico separado (memória)             */
/* ---------------------------------------------------- */
// ... (mantém igual)
async function gerarBlocoTecnicoSeparado({ /* ... */ }): Promise<any | null> { /* ... */ }

/* ---------------------------------------------------- */
/* 🧠 Função principal                                  */
/* ---------------------------------------------------- */
export async function getEcoResponse({
  messages,
  userId,
  userName,      // ⬅️ agora aceito, mesmo que não usado internamente
  accessToken,
  mems = [],     // ⬅️ agora aceito
}: {
  messages: { id?: string; role: string; content: string }[];
  userId?: string;
  userName?: string;
  accessToken: string;
  mems?: any[];
}): Promise<{
  message: string;
  intensidade?: number;
  resumo?: string;
  emocao?: string;
  tags?: string[];
}> {
  try {
    if (!Array.isArray(messages) || messages.length === 0)
      throw new Error('Parâmetro "messages" vazio ou inválido.');
    if (!accessToken) throw new Error("Token (accessToken) ausente.");

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY não configurada.");

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );

    const ultimaMsg = messages.at(-1)?.content || "";
    // — emulação: já tem mems via parâmetro se buscado antes

    const systemPrompt = await montarContextoEco({
      userId,
      ultimaMsg,
      perfil: null,
      mems,      // usa o array de memórias semelhantes passadas
    });

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: mapRoleForOpenAI(m.role),
        content: m.content,
      })),
    ];

    const { data } = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o",
        messages: chatMessages,
        temperature: 0.8,
        top_p: 0.95,
        presence_penalty: 0.3,
        frequency_penalty: 0.2,
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
        },
      }
    );

    const raw: string | undefined = data?.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Resposta vazia da IA.");

    const cleaned = formatarTextoEco(limparResposta(raw));
    const bloco = await gerarBlocoTecnicoSeparado({
      mensagemUsuario: ultimaMsg,
      respostaIa: cleaned,
      apiKey,
    });

    let intensidade: number | undefined;
    let emocao: string | undefined;
    let tags: string[] = [];
    let resumo: string | undefined = cleaned;

    if (bloco) {
      intensidade = Number(bloco.intensidade);
      emocao = bloco.emocao_principal;
      tags = Array.isArray(bloco.tags) ? bloco.tags : [];

      const nivelNumerico =
        typeof bloco.nivel_abertura === "number"
          ? bloco.nivel_abertura
          : bloco.nivel_abertura === "baixo"
          ? 1
          : bloco.nivel_abertura === "médio"
          ? 2
          : bloco.nivel_abertura === "alto"
          ? 3
          : null;

      const deveSalvar = userId && intensidade >= 7;
      if (deveSalvar) {
        const textoParaEmbedding = [cleaned, bloco.analise_resumo ?? ""].join("\n");
        const embeddingMem = await embedTextoCompleto(textoParaEmbedding);
        const { error } = await supabase.from("memories").insert([
          {
            usuario_id: userId,
            mensagem_id: messages.at(-1)?.id ?? null,
            resumo_eco: cleaned,
            emocao_principal: emocao ?? null,
            intensidade,
            contexto: ultimaMsg,
            salvar_memoria: true,
            data_registro: new Date().toISOString(),
            dominio_vida: bloco.dominio_vida ?? null,
            padrao_comportamental: bloco.padrao_comportamental ?? null,
            nivel_abertura: nivelNumerico,
            analise_resumo: bloco.analise_resumo ?? null,
            categoria: bloco.categoria ?? "emocional",
            tags,
            embedding: embeddingMem,
          },
        ]);
        if (!error) await updateEmotionalProfile(userId!);
      }
    }

    return { message: cleaned, intensidade, resumo, emocao, tags };
  } catch (err: any) {
    console.error("❌ getEcoResponse error:", err.message || err);
    throw err;
  }
}

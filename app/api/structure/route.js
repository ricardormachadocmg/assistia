// Estrutura texto ditado numa nota (devolve JSON). Corre no servidor.
export const runtime = "nodejs";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export async function POST(req) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: "Falta a variável ANTHROPIC_API_KEY no servidor." }, { status: 500 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Pedido inválido." }, { status: 400 }); }
  const raw = (body && body.raw) || "";
  if (!raw.trim()) return Response.json({ error: "Texto em falta." }, { status: 400 });

  const prompt = `Transforma este texto ditado numa nota estruturada. Responde APENAS com JSON válido, sem markdown: {"titulo":"...","resumo":"...","decisoes":["..."],"accoes":[{"tarefa":"...","responsavel":"...","prazo":"..."}],"tags":["..."]}. Texto:\n\n${raw}`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: "Estruturas notas em português europeu. Respondes só com JSON válido, sem texto à volta.",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await r.json();
    if (!r.ok) return Response.json({ error: data?.error?.message || `Erro (HTTP ${r.status}).` }, { status: r.status });
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    let note;
    try { note = JSON.parse(text.replace(/```json|```/g, "").trim()); }
    catch { return Response.json({ error: "O modelo não devolveu JSON válido." }, { status: 502 }); }
    return Response.json({ note });
  } catch (e) {
    return Response.json({ error: "Falha ao contactar o modelo: " + (e?.message || "desconhecido") }, { status: 502 });
  }
}

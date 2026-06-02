// Backend: corre no servidor (Vercel). A chave da API nunca chega ao browser.
// Isto é o que elimina o erro CORS — o iPad fala com esta route, não com a Anthropic.

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

const SYSTEM = `És o Próspero, assistente pessoal de IA — um chefe de gabinete digital para um profissional no ecossistema Microsoft (Outlook, OneNote, OneDrive), a trabalhar a partir de um iPad. Falas português europeu, és conciso, calmo, proativo e honesto. Antecipas, propões próximos passos e nunca inventas dados.`;

export async function POST(req) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return Response.json({ error: "Falta a variável ANTHROPIC_API_KEY no servidor." }, { status: 500 });
  }
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Pedido inválido." }, { status: 400 }); }
  const { messages, system, maxTokens } = body || {};
  if (!Array.isArray(messages)) return Response.json({ error: "messages em falta." }, { status: 400 });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens || 1024,
        system: system || SYSTEM,
        messages,
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      const msg = data?.error?.message || `Erro da API (HTTP ${r.status}).`;
      return Response.json({ error: msg }, { status: r.status });
    }
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    return Response.json({ text });
  } catch (e) {
    return Response.json({ error: "Falha ao contactar o modelo: " + (e?.message || "desconhecido") }, { status: 502 });
  }
}

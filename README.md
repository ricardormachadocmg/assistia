# Próspero — Web (Next.js + Vercel)

Assistente pessoal de IA com o **Claude**, em web app instalável no iPad.
Esta versão (Fase 1) traz **IA viva real**: o frontend fala com o teu backend (API routes), e o backend fala com o Claude. Sem CORS, sem chave exposta.

O que funciona já: **conversa com o Claude** e **estruturação de notas por voz/texto**.
A seguir: login Microsoft + escrita real no OneNote (Microsoft Graph) e Gmail.

---

## O que vais precisar (uma vez)

1. Conta **GitHub** (grátis).
2. Conta **Vercel** (grátis) — https://vercel.com
3. Conta **Anthropic** com **chave de API** e crédito — https://console.anthropic.com

---

## Passo a passo do deploy (~15 min)

### 1. Pôr o código no GitHub
- Cria um repositório novo no GitHub (ex.: `prospero-web`).
- Faz upload desta pasta (ou `git init`, `git add .`, `git commit`, `git push`).

### 2. Importar na Vercel
- Em https://vercel.com → **Add New… → Project** → importa o repositório.
- Framework: a Vercel deteta **Next.js** automaticamente. Não mexas nas definições de build.

### 3. Definir a chave da API
- Antes (ou depois) do deploy: **Project → Settings → Environment Variables**.
- Adiciona:
  - `ANTHROPIC_API_KEY` = a tua chave `sk-ant-...`
  - (opcional) `ANTHROPIC_MODEL` = `claude-sonnet-4-6`
- Faz **Redeploy** se já tinhas feito deploy antes de adicionar a chave.

### 4. Abrir e instalar no iPad
- A Vercel dá-te um URL: `https://prospero-web-xxxx.vercel.app`
- No **Safari do iPad**, abre esse URL.
- Toca em **Partilhar → Adicionar ao ecrã principal**. Fica com ícone, como uma app.

Pronto — tens IA viva no iPad.

---

## Correr localmente (opcional)
```bash
npm install
cp .env.example .env.local   # mete a tua ANTHROPIC_API_KEY
npm run dev                   # http://localhost:3000
```

---

## Estrutura
```
app/
  layout.jsx          # PWA, fontes, registo do service worker
  page.jsx            # interface (chat, ditado, notas)
  globals.css
  api/chat/route.js       # backend: chama o Claude (conversa)
  api/structure/route.js  # backend: estrutura notas (JSON)
public/
  manifest.webmanifest    # PWA
  sw.js                   # service worker (instalável + offline do shell)
  icon-192.png / icon-512.png / apple-touch-icon.png
```

---

## Próxima fase — conectores Microsoft (Graph)
1. **Registar a app no Microsoft Entra ID** (Azure Portal → App registrations):
   - Redirect URI: `https://<o-teu-dominio>.vercel.app/api/auth/callback`
   - Permissões (delegadas): `Notes.ReadWrite`, `Files.ReadWrite`, `Calendars.ReadWrite`, `Mail.Read` (+ `Mail.Send` quando quiseres enviar).
   - **Consentimento de administrador** do tenant.
2. Adicionar variáveis: `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `MS_TENANT_ID`.
3. Criar as routes `/api/auth/*` (OAuth) e `/api/onenote` (criar página via Graph).

Quando chegares aqui, peço o código destas routes e ligamos a escrita real no OneNote.

---

> Segurança: a `ANTHROPIC_API_KEY` vive **apenas** nas variáveis de ambiente da Vercel (servidor). Nunca a metas no código nem no frontend.

"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Mic, Square, Send, NotebookPen, Sparkles, ListChecks, MessageSquare,
  Check, Loader2, Info, Trash2, FileText, Clock, Settings, X, Plug, ShieldCheck
} from "lucide-react";

const c = {
  paper: "#F2EDE3", raised: "#FBF8F1", ink: "#23201A", soft: "#6A6357",
  faint: "#9A9183", line: "#E3DACB", accent: "#A8521F", accent2: "#3C6450", gold: "#B5882E", danger: "#B0492F",
};
const fontDisplay = "'Fraunces', Georgia, serif";

async function api(path, payload) {
  const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || `Erro (HTTP ${r.status}).`);
  return data;
}
const lsGet = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export default function Page() {
  const [tab, setTab] = useState("conversa");
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", text: "Olá. Sou o Próspero, agora a correr na web com IA viva. Dita ou escreve uma ideia e eu transformo-a numa nota — ou pergunta-me o que precisares." }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [structuring, setStructuring] = useState(false);
  const [notes, setNotes] = useState([]);
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => { setNotes(lsGet("prospero:notes", [])); }, []);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, thinking]);

  const speechSupported = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const toggleListen = () => {
    if (!speechSupported) { setInput((v) => v + (v ? " " : "") + "[ditado indisponível neste browser — escreve]"); return; }
    if (listening) { recogRef.current && recogRef.current.stop(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; const r = new SR();
    r.lang = "pt-PT"; r.continuous = true; r.interimResults = true;
    const base = input ? input + " " : "";
    r.onresult = (e) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setInput(base + t); };
    r.onend = () => setListening(false); r.onerror = () => setListening(false);
    recogRef.current = r; r.start(); setListening(true);
  };

  const send = async () => {
    const text = input.trim(); if (!text || thinking) return;
    if (listening && recogRef.current) recogRef.current.stop();
    const history = [...messages, { role: "user", text }];
    setMessages(history); setInput(""); setThinking(true);
    try {
      const { text: reply } = await api("/api/chat", { messages: history.map((m) => ({ role: m.role, content: m.text })) });
      setMessages((p) => [...p, { role: "assistant", text: reply || "Sem resposta." }]);
    } catch (e) {
      setMessages((p) => [...p, { role: "assistant", text: "Erro: " + (e?.message || "desconhecido") }]);
    } finally { setThinking(false); }
  };

  const structureNote = async () => {
    const raw = input.trim(); if (!raw || structuring) return;
    if (listening && recogRef.current) recogRef.current.stop();
    setStructuring(true);
    try {
      const { note } = await api("/api/structure", { raw });
      const full = { id: Date.now(), ...note, raw, createdAt: new Date().toISOString(), saved: false };
      setNotes((p) => { const n = [full, ...p]; lsSet("prospero:notes", n); return n; });
      setInput(""); setTab("notas");
    } catch (e) {
      setMessages((p) => [...p, { role: "assistant", text: "Não consegui estruturar: " + (e?.message || "erro") }]);
      setTab("conversa");
    } finally { setStructuring(false); }
  };

  const saveOneNote = (id) => {
    // Marca como guardado. A escrita real no OneNote liga-se na próxima fase (Microsoft Graph).
    setNotes((p) => { const n = p.map((x) => x.id === id ? { ...x, saved: true } : x); lsSet("prospero:notes", n); return n; });
  };
  const deleteNote = (id) => setNotes((p) => { const n = p.filter((x) => x.id !== id); lsSet("prospero:notes", n); return n; });

  const TABS = [
    { id: "conversa", label: "Conversa", icon: MessageSquare },
    { id: "notas", label: "Notas", icon: NotebookPen },
  ];
  const arr = (x) => Array.isArray(x) && x.length > 0;

  return (
    <div>
      <div className="grain" />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px 140px", position: "relative", zIndex: 2 }}>
        <header className="rise" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 22, paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: c.ink, display: "grid", placeItems: "center" }}><Sparkles size={17} color={c.paper} /></div>
            <div>
              <div style={{ fontFamily: fontDisplay, fontSize: 23, fontWeight: 600, letterSpacing: "-.01em", lineHeight: 1 }}>Próspero</div>
              <div style={{ fontSize: 11, color: c.faint, letterSpacing: ".06em", textTransform: "uppercase", marginTop: 3 }}>Web · IA viva</div>
            </div>
          </div>
          <button onClick={() => setShowSettings(true)} style={{ background: "transparent", border: `1px solid ${c.line}`, borderRadius: 11, padding: 9, cursor: "pointer", color: c.soft }}><Settings size={18} /></button>
        </header>

        <div className="rise" style={{ display: "flex", gap: 8, alignItems: "flex-start", background: c.raised, border: `1px solid ${c.line}`, borderRadius: 12, padding: "9px 12px", marginBottom: 16 }}>
          <Info size={15} color={c.soft} style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 12.5, color: c.soft, margin: 0, lineHeight: 1.5 }}>Esta versão chama o Claude pelo <b style={{ color: c.ink }}>teu backend</b> — sem CORS, IA viva real. Os conectores Microsoft/Gmail entram na fase seguinte.</p>
        </div>

        {tab === "conversa" && (
          <div ref={scrollRef} style={{ maxHeight: "calc(100vh - 300px)", overflowY: "auto", paddingRight: 2 }}>
            {messages.map((m, i) => (
              <div key={i} className="rise" style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
                <div style={{ maxWidth: "84%", padding: "11px 14px", borderRadius: 16, fontSize: 14.5, lineHeight: 1.55, background: m.role === "user" ? c.ink : c.raised, color: m.role === "user" ? c.paper : c.ink, border: m.role === "user" ? "none" : `1px solid ${c.line}`, borderBottomRightRadius: m.role === "user" ? 5 : 16, borderBottomLeftRadius: m.role === "user" ? 16 : 5, whiteSpace: "pre-wrap" }}>{m.text}</div>
              </div>
            ))}
            {thinking && <div style={{ display: "flex", gap: 4, padding: "6px 14px" }}>{[0, 1, 2].map((i) => <span key={i} style={{ width: 6, height: 6, borderRadius: 9, background: c.faint, animation: `blink 1.2s ${i * 0.2}s infinite` }} />)}</div>}
          </div>
        )}

        {tab === "notas" && (!notes.length ? (
          <Empty title="Ainda sem notas" sub="Dita uma ideia na conversa e toca em “Estruturar nota”." />
        ) : (
          <div className="rise">
            {notes.map((n) => (
              <div key={n.id} style={{ ...card, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <h3 style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 600, margin: 0, lineHeight: 1.2 }}>{n.titulo}</h3>
                  <button onClick={() => deleteNote(n.id)} style={{ background: "none", border: "none", cursor: "pointer", color: c.faint, padding: 2 }}><Trash2 size={15} /></button>
                </div>
                {n.resumo && <p style={{ fontSize: 13.5, color: c.soft, margin: "8px 0 0", lineHeight: 1.55 }}>{n.resumo}</p>}
                {arr(n.decisoes) && <Sub label="Decisões">{n.decisoes.map((d, i) => <li key={i} style={li}>{d}</li>)}</Sub>}
                {arr(n.accoes) && <Sub label="Ações" icon={ListChecks}>{n.accoes.map((a, i) => <li key={i} style={li}><span style={{ color: c.ink }}>{a.tarefa}</span>{(a.responsavel || a.prazo) && <span style={{ color: c.faint }}> — {[a.responsavel, a.prazo].filter(Boolean).join(" · ")}</span>}</li>)}</Sub>}
                {arr(n.tags) && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>{n.tags.map((t, i) => <span key={i} style={{ fontSize: 11, color: c.accent2, background: "#3C64500F", border: "1px solid #3C645022", borderRadius: 999, padding: "3px 9px" }}>{t}</span>)}</div>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: `1px solid ${c.line}` }}>
                  <span style={{ fontSize: 11.5, color: c.faint, display: "flex", alignItems: "center", gap: 5 }}><Clock size={12} /> {new Date(n.createdAt).toLocaleString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  {n.saved ? <span style={{ fontSize: 12.5, color: c.accent2, display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}><Check size={15} /> Guardado</span>
                    : <button onClick={() => saveOneNote(n.id)} style={{ ...primaryBtn, padding: "8px 14px", fontSize: 13 }}><FileText size={14} /> Guardar no OneNote</button>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {tab === "conversa" && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 64, zIndex: 5, padding: "0 16px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ background: c.raised, border: `1px solid ${c.line}`, borderRadius: 16, padding: 8, boxShadow: "0 10px 30px -18px rgba(0,0,0,.35)" }}>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={listening ? "A ouvir… fala naturalmente" : "Dita ou escreve uma ideia…"} rows={1}
                style={{ width: "100%", resize: "none", border: "none", outline: "none", background: "transparent", fontSize: 15, color: c.ink, padding: "8px 8px 4px", maxHeight: 120 }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
                <button onClick={toggleListen} style={micBtn(listening)}>{listening ? <Square size={15} /> : <Mic size={15} />}{listening ? "Parar" : "Ditar"}</button>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={structureNote} disabled={!input.trim() || structuring} style={ghostBtn(!input.trim() || structuring)}>{structuring ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <NotebookPen size={14} />}Estruturar nota</button>
                  <button onClick={send} disabled={!input.trim() || thinking} style={sendBtn(!input.trim() || thinking)}><Send size={15} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 6, background: c.raised, borderTop: `1px solid ${c.line}` }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(2,1fr)" }}>
          {TABS.map((t) => { const Icon = t.icon; const a = tab === t.id; return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "transparent", border: "none", padding: "9px 4px 12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: a ? c.ink : c.faint }}>
              <Icon size={19} color={a ? c.accent : c.faint} /><span style={{ fontSize: 10.5, fontWeight: a ? 600 : 500 }}>{t.label}</span>
            </button>); })}
        </div>
      </nav>

      {showSettings && (
        <div onClick={() => setShowSettings(false)} style={{ position: "fixed", inset: 0, zIndex: 20, background: "#23201A55", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: c.paper, width: "100%", maxWidth: 720, maxHeight: "88vh", overflowY: "auto", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, animation: "sheet .35s cubic-bezier(.2,.7,.3,1) both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: fontDisplay, fontSize: 21, fontWeight: 600, margin: 0 }}>Definições</h2>
              <button onClick={() => setShowSettings(false)} style={{ background: c.raised, border: `1px solid ${c.line}`, borderRadius: 10, padding: 7, cursor: "pointer", color: c.soft }}><X size={17} /></button>
            </div>
            <div style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: c.ink, display: "grid", placeItems: "center" }}><Sparkles size={16} color={c.paper} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>Claude (Anthropic)</div><div style={{ fontSize: 12, color: c.faint }}>Motor — via backend, chave de API</div></div>
              <span style={{ fontSize: 12, color: c.accent2, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 9, background: c.accent2 }} /> Ativo</span>
            </div>
            {[{ n: "Microsoft 365", d: "Outlook · OneDrive · OneNote" }, { n: "Gmail", d: "Email pessoal" }].map((co) => (
              <div key={co.n} style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 8 }}>
                <Plug size={17} color={c.faint} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{co.n}</div><div style={{ fontSize: 12, color: c.faint }}>{co.d}</div></div>
                <span style={{ fontSize: 11.5, color: c.faint }}>na próxima fase</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 8, color: c.soft }}>
              <ShieldCheck size={15} color={c.accent2} style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 12, margin: 0, lineHeight: 1.5 }}>Os conectores Microsoft e Gmail entram a seguir, com login OAuth e a escrita real no OneNote via Microsoft Graph.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const card = { background: c.raised, border: `1px solid ${c.line}`, borderRadius: 16, padding: 16 };
const li = { fontSize: 13.5, color: c.soft, lineHeight: 1.6, marginBottom: 3 };
const primaryBtn = { display: "flex", alignItems: "center", gap: 7, border: "none", background: c.accent, color: "#fff", borderRadius: 11, padding: "9px 14px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
function Sub({ label, icon: Icon, children }) {
  return <div style={{ marginTop: 12 }}><div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, letterSpacing: ".07em", textTransform: "uppercase", color: c.faint, marginBottom: 5 }}>{Icon && <Icon size={13} />} {label}</div><ul style={{ margin: 0, paddingLeft: 16 }}>{children}</ul></div>;
}
function Empty({ title, sub }) {
  return <div className="rise" style={{ textAlign: "center", padding: "44px 20px", color: c.faint }}>
    <div style={{ width: 52, height: 52, borderRadius: 14, background: c.raised, border: `1px solid ${c.line}`, display: "grid", placeItems: "center", margin: "0 auto 14px" }}><NotebookPen size={24} color={c.faint} /></div>
    <div style={{ fontSize: 15, color: c.ink, fontWeight: 600, marginBottom: 5 }}>{title}</div>
    <div style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 280, margin: "0 auto" }}>{sub}</div>
  </div>;
}
function micBtn(active) { return { display: "flex", alignItems: "center", gap: 7, border: `1px solid ${active ? c.accent : c.line}`, background: active ? c.accent : "transparent", color: active ? "#fff" : c.soft, borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", animation: active ? "pulse 1.6s infinite" : "none" }; }
function ghostBtn(disabled) { return { display: "flex", alignItems: "center", gap: 7, border: `1px solid ${c.line}`, background: "transparent", color: disabled ? c.faint : c.ink, borderRadius: 999, padding: "8px 13px", fontSize: 13, fontWeight: 600, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.6 : 1 }; }
function sendBtn(disabled) { return { display: "grid", placeItems: "center", width: 40, height: 36, border: "none", background: disabled ? c.line : c.accent, color: "#fff", borderRadius: 11, cursor: disabled ? "default" : "pointer" }; }

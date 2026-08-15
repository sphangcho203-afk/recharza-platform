"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = { id: number; role: "assistant" | "user"; text: string };

const welcome: ChatMessage = {
  id: 1,
  role: "assistant",
  text: "Hey, I’m Recharza Support. I can help you choose a game and region, verify player details, understand checkout, or find the right next step for an order.",
};

const quickPrompts = [
  "Which games and regions are available?",
  "How do I verify my player ID?",
  "I need help with an order",
];

export function LiveSupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage(value = draft) {
    const text = value.trim();
    if (!text || sending) return;
    const userMessage: ChatMessage = { id: Date.now(), role: "user", text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setSending(true);
    try {
      const response = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.map(({ role, text: messageText }) => ({ role, text: messageText })) }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; reply?: string; message?: string } | null;
      if (!response.ok || !payload?.ok || !payload.reply) throw new Error(payload?.message || "Support is unavailable right now.");
      setMessages((current) => [...current, { id: Date.now() + 1, role: "assistant", text: payload.reply! }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: error instanceof Error ? error.message : "Support is unavailable right now. Please use the support form below.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-4 z-[70] sm:bottom-6 sm:right-6">
      {open ? (
        <section
          aria-label="Recharza live support"
          className="mb-3 flex h-[min(680px,calc(100vh-112px))] w-[min(400px,calc(100vw-32px))] flex-col overflow-hidden rounded-[1.5rem] border border-white/[0.13] bg-[#0b0d15]/95 shadow-[0_24px_90px_rgba(0,0,0,0.48)] backdrop-blur-2xl"
        >
          <header className="relative overflow-hidden border-b border-white/[0.09] px-5 py-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(139,92,246,0.24),transparent_42%),radial-gradient(circle_at_10%_100%,rgba(34,211,238,0.1),transparent_45%)]" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="relative grid h-11 w-11 place-items-center rounded-2xl border border-violet-300/25 bg-violet-400/10 text-lg text-violet-100 shadow-[0_0_28px_rgba(139,92,246,0.2)]" aria-hidden="true">
                  ✦
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0b0d15] bg-emerald-300" />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-200">Live support</p>
                  <h2 className="mt-0.5 text-base font-black tracking-[-0.02em] text-white">Recharza concierge</h2>
                  <p className="mt-0.5 text-[11px] text-slate-500">Here to guide your top-up</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl text-lg text-slate-500 transition hover:bg-white/[0.07] hover:text-white" aria-label="Close live support">×</button>
            </div>
          </header>

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-3 text-[13px] leading-5 ${message.role === "user" ? "rounded-br-md bg-violet-500 text-white" : "rounded-bl-md border border-white/[0.08] bg-white/[0.045] text-slate-200"}`}>
                  {message.text}
                </div>
              </div>
            ))}
            {messages.length === 1 ? (
              <div className="space-y-2 pt-1">
                <p className="px-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">Try asking</p>
                {quickPrompts.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => sendMessage(prompt)} className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5 text-left text-xs font-bold text-slate-400 transition hover:border-violet-300/30 hover:bg-violet-400/[0.07] hover:text-white">{prompt}</button>
                ))}
              </div>
            ) : null}
            {sending ? <div className="flex justify-start"><div className="rounded-2xl rounded-bl-md border border-white/[0.08] bg-white/[0.045] px-3.5 py-3 text-xs text-slate-500">Thinking through that…</div></div> : null}
          </div>

          <div className="border-t border-white/[0.09] p-3">
            <form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className="flex items-end gap-2 rounded-2xl border border-white/[0.1] bg-black/20 p-1.5 focus-within:border-violet-300/40">
              <label htmlFor="live-support-message" className="sr-only">Message Recharza Support</label>
              <textarea id="live-support-message" rows={1} value={draft} onChange={(event) => setDraft(event.target.value.slice(0, 700))} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder="Ask about a top-up…" className="max-h-24 min-h-10 flex-1 resize-none bg-transparent px-2.5 py-2 text-sm text-white outline-none placeholder:text-slate-600" disabled={sending} />
              <button type="submit" disabled={!draft.trim() || sending} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500 text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message">↑</button>
            </form>
            <p className="mt-2 px-1 text-[10px] leading-4 text-slate-600">Never send passwords, OTPs, card details, UPI PINs, or private access tokens.</p>
          </div>
        </section>
      ) : null}
      <button type="button" onClick={() => setOpen((current) => !current)} className={`group ml-auto flex min-h-14 items-center gap-3 rounded-2xl border px-4 shadow-[0_16px_40px_rgba(0,0,0,0.3)] transition hover:-translate-y-0.5 ${open ? "border-white/[0.15] bg-[#11131d]" : "border-violet-300/25 bg-violet-500 text-white hover:bg-violet-400"}`} aria-expanded={open} aria-controls="live-support-message">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${open ? "bg-white/[0.08] text-violet-200" : "bg-white/15 text-white"}`} aria-hidden="true">✦</span>
        <span className="pr-1 text-left"><span className={`block text-[10px] font-black uppercase tracking-[0.14em] ${open ? "text-violet-200" : "text-violet-100"}`}>Need a hand?</span><span className="block text-sm font-black">Live support</span></span>
      </button>
    </div>
  );
}

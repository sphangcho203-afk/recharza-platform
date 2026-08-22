"use client";

import { useEffect, useRef, useState } from "react";

import { StorefrontIcon } from "@/components/storefront-icon";

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

export function LiveSupportChat({ embedded = false }: { embedded?: boolean }) {
  const [open, setOpen] = useState(embedded);
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
    <div className={embedded ? "w-full" : "fixed bottom-5 right-4 z-[70] sm:bottom-6 sm:right-6"}>
      {open ? (
        <section
          aria-label="Recharza live support"
          className={`${embedded ? "h-[min(620px,calc(100vh-180px))] w-full" : "mb-3 h-[min(680px,calc(100vh-112px))] w-[min(400px,calc(100vw-32px))]"} border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md flex flex-col overflow-hidden rounded-[2rem]`}
        >
          <header className="relative overflow-hidden border-b border-white/10 px-5 py-4 bg-white/5">
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="relative grid h-11 w-11 place-items-center rounded-lg border border-violet-500/20 bg-violet-500/10 text-lg text-violet-400 shadow-sm" aria-hidden="true">
                  ✦
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#06070d] bg-emerald-500" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-400">Live support</p>
                  <h2 className="mt-0.5 text-base font-bold tracking-tight text-white">Recharza concierge</h2>
                  <p className="mt-0.5 text-[11px] text-slate-500 font-medium">Here to guide your top-up</p>
                </div>
              </div>
              {!embedded ? <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-white" aria-label="Close live support"><StorefrontIcon name="close" className="h-5 w-5" /></button> : null}
            </div>
          </header>

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-xl px-3.5 py-3 text-[13px] leading-5 shadow-sm ${message.role === "user" ? "rounded-br-sm bg-violet-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]" : "rounded-bl-sm border border-white/10 bg-white/5 text-slate-300 font-medium"}`}>
                  {message.text}
                </div>
              </div>
            ))}
            {messages.length === 1 ? (
              <div className="space-y-2 pt-1">
                <p className="px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Try asking</p>
                {quickPrompts.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => sendMessage(prompt)} className="block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-xs font-bold text-slate-400 transition hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-white">{prompt}</button>
                ))}
              </div>
            ) : null}
            {sending ? <div className="flex justify-start"><div className="rounded-xl rounded-bl-sm border border-white/5 bg-white/5 px-3.5 py-3 text-xs text-slate-500 font-medium italic">Thinking through that…</div></div> : null}
          </div>

          <div className="border-t border-white/10 p-3 bg-[#06070d]/50 backdrop-blur-md">
            <form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20">
              <label htmlFor="live-support-message" className="sr-only">Message Recharza Support</label>
              <textarea id="live-support-message" rows={1} value={draft} onChange={(event) => setDraft(event.target.value.slice(0, 700))} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder="Ask about a top-up…" className="max-h-24 min-h-10 flex-1 resize-none bg-transparent px-2.5 py-2 text-sm text-white outline-none placeholder:text-slate-600 font-medium" disabled={sending} />
              <button type="submit" disabled={!draft.trim() || sending} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message"><StorefrontIcon name="arrow" className="h-4 w-4 -rotate-90" /></button>
            </form>
            <p className="mt-2 px-1 text-[10px] leading-4 text-slate-600 font-medium">Never send passwords, OTPs, card details, UPI PINs, or private access tokens.</p>
          </div>
        </section>
      ) : null}
      {!embedded ? <button type="button" onClick={() => setOpen((current) => !current)} className={`group ml-auto flex min-h-14 items-center gap-3 rounded-xl border px-4 shadow-2xl transition-all duration-300 hover:-translate-y-1 backdrop-blur-md ${open ? "border-white/10 bg-white/5 text-white" : "border-violet-500 bg-violet-600 text-white hover:bg-violet-700 shadow-[0_0_25px_rgba(124,58,237,0.4)]"}`} aria-expanded={open} aria-controls="live-support-message">
        <span className={`grid h-9 w-9 place-items-center rounded-lg shadow-sm ${open ? "bg-white/10 text-violet-400 border border-white/10" : "bg-white/15 text-white"}`} aria-hidden="true">✦</span>
        <span className="pr-1 text-left"><span className={`block text-[10px] font-bold uppercase tracking-[0.14em] ${open ? "text-violet-400" : "text-violet-100"}`}>Need a hand?</span><span className="block text-sm font-bold">Live support</span></span>
      </button> : null}
    </div>
  );
}

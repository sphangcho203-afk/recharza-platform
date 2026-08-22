
type ExplainerChannel = {
  id: string;
  logo: string;
  name: string;
  tagline: string;
  bestFor: string;
  howItWorks: string;
  whatToBring: string;
  accent: string;
};

const CHANNEL_EXPLAINER: ExplainerChannel[] = [
  {
    id: "telegram-bot",
    logo: "/assets/brand/support-telegram.png",
    name: "Telegram support bot",
    tagline: "Instant support through our Telegram channel.",
    bestFor:
      "Quick assistance and real-time updates on your support requests.",
    howItWorks:
      "Connect with our support team on Telegram for fast and personalized help. Simply send a message to start a conversation with our dedicated support staff.",
    whatToBring: "Your Order ID (from the confirmation email or order page), the player ID used, and a short description.",
    accent: "cyan",
  },
  {
    id: "live-group",
    logo: "/assets/brand/support-group.png",
    name: "Live support group",
    tagline: "A shared space where everyone can see answers and updates.",
    bestFor:
      "General questions, quick clarification, and reading how other customers' issues were solved before yours.",
    howItWorks:
      "Join the Recharza live support group and send your question there. If the team mentions the support bot, it continues your conversation in your private chat so personal details like order numbers never stay visible to everyone. Use the private chat for anything account or payment related.",
    whatToBring: "Your Order ID if you are asking about an order, and your player ID if relevant.",
    accent: "violet",
  },
  {
    id: "website-chat",
    logo: "/assets/brand/recharza-line-electric-mark.png",
    name: "Website chat (this page)",
    tagline: "Instant help directly on our website.",
    bestFor:
      "Quick answers to common questions about our services and items.",
    howItWorks:
      "Use our on-site chat for immediate assistance. Our helpful assistant can provide information about our products and guide you through the store.",
    whatToBring: "Your Order ID and access token only when you want an order status check.",
    accent: "emerald",
  },
  {
    id: "email",
    logo: "/assets/brand/support-gmail.png",
    name: "Email",
    tagline: "Direct support via email.",
    bestFor:
      "Detailed inquiries and formal requests.",
    howItWorks:
      "Send us an email with your query, and our support team will get back to you with a comprehensive response.",
    whatToBring: "Your Order ID, the email used at checkout, and clear details of the issue.",
    accent: "amber",
  },
  {
    id: "whatsapp",
    logo: "/assets/brand/support-whatsapp.png",
    name: "WhatsApp",
    tagline: "A direct messaging channel you already know.",
    bestFor:
      "Quick, familiar messaging when you prefer WhatsApp over Telegram or email.",
    howItWorks:
      "Tap the WhatsApp button and your message app opens with a pre-written greeting to Recharza support. Just send it and add your Order ID and the issue. A team member replies there directly.",
    whatToBring: "Your Order ID and a short description of the problem.",
    accent: "lime",
  },
  {
    id: "instagram",
    logo: "/assets/brand/support-instagram.png",
    name: "Instagram",
    tagline: "Reach us through our social inbox.",
    bestFor:
      "Simple questions and contact when you are already browsing Recharza's social pages.",
    howItWorks:
      "Open the Recharza Instagram profile and send a direct message. A team member checks the inbox and replies. For anything order-related, switch to the Telegram bot or email so your details stay private.",
    whatToBring: "Your Order ID and the issue you need help with.",
    accent: "rose",
  },
];

const ticketSteps = [
  {
    step: "1 · Pick your issue",
    title: "Choose what happened",
    body: "Tap the box that matches your situation — top-up not received, money deducted, wrong package, and so on. This sends your request to the right specialist first.",
  },
  {
    step: "2 · Add the details",
    title: "Title, Order ID, description",
    body: "Give the issue a short title, add your Order ID if you have one (or skip it), then describe what happened in your own words. Nothing is lost — you can edit before sending.",
  },
  {
    step: "3 · Confirm the review card",
    title: "Check everything is right",
    body: "The bot shows you a summary card with the issue type, title, and order. Press Edit to change anything, or Send to submit. You immediately get your ticket number.",
  },
  {
    step: "4 · Watch it get solved",
    title: "Team answers in your chat",
    body: "Our team receives the alert instantly and replies to you privately. You answer naturally in the same chat, and the ticket stays open until it is resolved. Type /status anytime to check progress.",
  },
];

export function SupportExplainer() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">How support works</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-4xl">Reach help your way — every channel, explained.</h2>
        <p className="mt-4 max-w-2xl text-base font-medium text-slate-400">
          Recharza support works through one shared ticket system and several doors you can enter from. Whatever channel you use, a real team member reads your request, and nothing about your account is ever solved by an unattended script.
        </p>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
        <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {CHANNEL_EXPLAINER.map((channel) => (
            <div key={channel.id} className="bg-[#06070d]/50 p-6 transition-colors hover:bg-white/5">
              <div className="flex items-center gap-4">
                <img
                  src={channel.logo}
                  alt=""
                  aria-hidden="true"
                  className="h-10 w-10 shrink-0 rounded-xl border border-white/10 bg-white/5 object-contain shadow-sm"
                  width={40}
                  height={40}
                />
                <div>
                  <strong className="block text-base font-bold text-white">{channel.name}</strong>
                  <span className="mt-0.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">{channel.tagline}</span>
                </div>
              </div>
              <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Best for</p>
              <p className="mt-2 text-sm font-medium text-slate-300 leading-relaxed">{channel.bestFor}</p>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">How it works</p>
              <p className="mt-2 text-sm font-medium text-slate-400 leading-relaxed">{channel.howItWorks}</p>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">What to bring</p>
              <p className="mt-2 text-sm font-medium text-slate-400 leading-relaxed">{channel.whatToBring}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Creating a ticket</p>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">From first tap to solved — four steps.</h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ticketSteps.map((item) => (
            <div key={item.step} className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">{item.step}</p>
              <strong className="mt-2 block text-base font-bold text-white">{item.title}</strong>
              <p className="mt-2 text-sm font-medium text-slate-400 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-md">
        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">What happens behind the scenes</p>
        <h3 className="mt-2 text-xl font-bold tracking-tight text-white">Your ticket is tracked end to end.</h3>
        <p className="mt-4 max-w-3xl text-sm font-medium text-slate-400 leading-relaxed">
          Every request receives a unique ticket number (for example <span className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-2 py-1 font-mono text-xs font-bold text-violet-400 shadow-sm">RZS-XXXXXXXXXXXXXXXX</span>) and is recorded in our system with its status, category, and every reply exchanged. You can check progress anytime by typing <span className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-2 py-1 font-mono text-xs font-bold text-violet-400 shadow-sm">/status</span> followed by your ticket number in the Telegram bot, and our team marks it resolved only when you confirm everything is fixed.
        </p>
      </div>
    </div>
  );
}

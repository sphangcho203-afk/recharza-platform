export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070711]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="flex items-center gap-3" aria-label="Recharza home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-black text-white shadow-[0_0_30px_rgba(139,92,246,0.35)]">
            R
          </span>
          <span className="text-lg font-bold tracking-tight text-white">Recharza</span>
        </a>

        <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex" aria-label="Primary navigation">
          <a className="transition hover:text-white" href="#games">Games</a>
          <a className="transition hover:text-white" href="#how-it-works">How it works</a>
          <a className="transition hover:text-white" href="#trust">Trust</a>
        </nav>

        <button
          type="button"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-violet-400/40 hover:bg-white/10"
        >
          Sign in
        </button>
      </div>
    </header>
  );
}

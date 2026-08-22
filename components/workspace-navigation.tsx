import Link from "next/link";

import { ModuleStateBadge } from "@/components/module-state-badge";
import {
  getVisibleModules,
  getWorkspaceModules,
  isInteractiveModule,
  type Workspace,
} from "@/lib/product-system";

export function WorkspaceNavigation({
  workspace,
  activeId,
}: {
  workspace: Exclude<Workspace, "customer">;
  activeId: string;
}) {
  const modules = getVisibleModules(getWorkspaceModules(workspace));

  return (
    <aside className="min-w-0 w-full border-b border-white/10 bg-[#0b0b12] lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:border-b-0 lg:border-r">
      <nav
        className="flex w-full gap-2 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:content-start lg:overflow-y-auto lg:p-4"
        aria-label={`${workspace} modules`}
      >
        {modules.map((module) => {
          const active = module.id === activeId;
          const interactive = isInteractiveModule(module.state);
          const className = `group min-h-12 min-w-[10rem] shrink-0 rounded-2xl border px-3.5 py-3 text-left transition-all duration-300 sm:min-w-[12rem] lg:min-w-0 lg:w-full shadow-2xl ${
            active
              ? "border-violet-600 bg-violet-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]"
              : interactive
                ? "border-white/10 bg-white/5 text-slate-400 hover:border-violet-500/50 hover:bg-white/10 hover:text-white"
                : "cursor-not-allowed border-white/5 bg-white/2 text-slate-600"
          }`;

          const content = (
            <span className="grid gap-2">
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{module.label}</span>
                <ModuleStateBadge state={module.state} />
              </span>
              <span
                className={`line-clamp-2 text-[11px] leading-4 ${
                  active ? "text-violet-200" : "text-slate-500 group-hover:text-slate-400"
                }`}
              >
                {module.description}
              </span>
            </span>
          );

          return interactive ? (
            <Link key={module.id} href={module.href} className={className}>
              {content}
            </Link>
          ) : (
            <span key={module.id} aria-disabled="true" className={className} title="This module is planned and not active yet.">
              {content}
            </span>
          );
        })}
      </nav>
    </aside>
  );
}

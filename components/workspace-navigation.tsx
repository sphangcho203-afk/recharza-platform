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
    <aside className="border-b border-white/10 bg-[var(--surface-1)] lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r">
      <nav
        className="flex gap-2 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:content-start lg:overflow-y-auto lg:p-4"
        aria-label={`${workspace} modules`}
      >
        {modules.map((module) => {
          const active = module.id === activeId;
          const interactive = isInteractiveModule(module.state);
          const className = `group min-h-12 min-w-[12rem] shrink-0 rounded-xl border px-3.5 py-3 text-left transition lg:min-w-0 lg:w-full ${
            active
              ? "border-white bg-white text-slate-950"
              : interactive
                ? "border-white/10 bg-white/[0.025] text-slate-300 hover:border-white/20 hover:bg-white/[0.055] hover:text-white"
                : "cursor-not-allowed border-white/8 bg-white/[0.015] text-slate-600"
          }`;

          const content = (
            <span className="grid gap-2">
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-black">{module.label}</span>
                <ModuleStateBadge state={module.state} />
              </span>
              <span
                className={`line-clamp-2 text-[11px] leading-4 ${
                  active ? "text-slate-600" : "text-slate-600 group-hover:text-slate-400"
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

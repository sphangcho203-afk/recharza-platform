import {
  getModuleStateLabel,
  type ProductModuleState,
} from "@/lib/product-system";

const stateClassNames: Record<ProductModuleState, string> = {
  live: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  beta: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
  planned: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  hidden: "border-white/10 bg-white/5 text-slate-500",
};

export function ModuleStateBadge({ state }: { state: ProductModuleState }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] ${stateClassNames[state]}`}
    >
      {getModuleStateLabel(state)}
    </span>
  );
}

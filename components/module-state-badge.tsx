import {
  getModuleStateLabel,
  type ProductModuleState,
} from "@/lib/product-system";

const stateClassNames: Record<ProductModuleState, string> = {
  live: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  beta: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
  planned: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  hidden: "border-white/10 bg-white/5 text-slate-500",
};

export function ModuleStateBadge({ state }: { state: ProductModuleState }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${stateClassNames[state]}`}
    >
      {getModuleStateLabel(state)}
    </span>
  );
}

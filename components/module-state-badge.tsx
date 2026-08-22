import {
  getModuleStateLabel,
  type ProductModuleState,
} from "@/lib/product-system";

const stateClassNames: Record<ProductModuleState, string> = {
  live: "border-emerald-200 bg-emerald-50 text-emerald-700",
  beta: "border-cyan-200 bg-cyan-50 text-cyan-700",
  planned: "border-amber-200 bg-amber-50 text-amber-700",
  hidden: "border-slate-200 bg-slate-50 text-slate-500",
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

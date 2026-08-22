const STEP_LABELS = ["Package", "Player", "Billing", "Review", "Payment"] as const;

type CheckoutProgressRailProps = {
  current: number;
};

/**
 * Spec v2 progress rail — filled/unfilled SEGMENTS (not circles),
 * current step labeled inline above the rail, completed steps shown
 * with a checkmark instead of a number. Segments live directly under
 * each label so the rail reads as one continuous bar.
 */
export function CheckoutProgressRail({ current }: CheckoutProgressRailProps) {
  const total = STEP_LABELS.length;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 mb-2">
          <div className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">Secure Checkout</span>
        </div>
        <h2 className="text-lg font-black tracking-tight text-slate-900">
          {STEP_LABELS[Math.min(current, total) - 1]}
        </h2>
        <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
          Step {Math.min(current, total)} of {total}
        </p>
      </div>
      
      <div className="relative">
        {/* Background Rail */}
        <div className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-violet-500 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(124,58,237,0.4)]"
            style={{ width: `${((current - 1) / (total - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex items-center justify-between">
          {STEP_LABELS.map((label, idx) => {
            const stepNo = idx + 1;
            const done = stepNo < current;
            const active = stepNo === current;
            
            return (
              <div key={label} className="flex flex-col items-center group">
                <div 
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                    done 
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]" 
                      : active 
                        ? "bg-white border-violet-600 text-violet-600 shadow-[0_0_0_4px_rgba(124,58,237,0.1),0_8px_20px_rgba(124,58,237,0.2)] scale-110" 
                        : "bg-white border-slate-200 text-slate-400"
                  }`}
                >
                  {done ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="m6 12.5 4 4L18 8" />
                    </svg>
                  ) : (
                    <span className="text-xs font-black">{stepNo}</span>
                  )}
                </div>
                <span 
                  className={`absolute -bottom-7 whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${
                    done ? "text-emerald-600" : active ? "text-violet-600" : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="h-8" aria-hidden="true" /> {/* Spacer for labels */}
    </div>
  );
}

const STEP_LABELS = ["Package", "Player", "Payment", "Status"] as const;

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
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      <div className="mb-5 sm:mb-8 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-violet-50 border border-violet-100 mb-2 sm:mb-3 shadow-sm">
          <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-violet-500" />
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">Secure Checkout</span>
        </div>
        <h2 className="text-base sm:text-xl font-black tracking-tight text-slate-900 leading-tight">
          {STEP_LABELS[Math.min(current, total) - 1]}
        </h2>
        <p className="mt-1 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-[0.15em]">
          Step {Math.min(current, total)} of {total}
        </p>
      </div>
      
      <div className="relative px-4 sm:px-6">
        {/* Background Rail */}
        <div className="absolute top-1/2 left-4 right-4 sm:left-6 sm:right-6 h-0.5 sm:h-1 -translate-y-1/2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-violet-600 transition-all duration-700 ease-out shadow-sm"
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
              <div key={label} className="flex flex-col items-center">
                <div 
                  className={`relative z-10 flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full border-[1.5px] sm:border-2 transition-all duration-500 ${
                    done 
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-sm" 
                      : active 
                        ? "bg-white border-violet-600 text-violet-600 shadow-md scale-105 sm:scale-110" 
                        : "bg-white border-slate-200 text-slate-400"
                  }`}
                >
                  {done ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5">
                      <path d="m6 12.5 4 4L18 8" />
                    </svg>
                  ) : (
                    <span className="text-[10px] sm:text-xs font-black">{stepNo}</span>
                  )}
                </div>
                <span 
                  className={`absolute -bottom-6 sm:-bottom-8 whitespace-nowrap text-[8px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-widest transition-colors duration-300 ${
                    done ? "text-emerald-600" : active ? "text-violet-600" : "text-slate-500"
                  } ${idx === 0 ? "translate-x-0" : idx === total - 1 ? "-translate-x-0" : ""}`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="h-10 sm:h-12" aria-hidden="true" /> {/* Spacer for labels */}
    </div>
  );
}

type Props = {
  used: number;
  limit: number;
  plan: string;
};

export function QuotaBar({ used, limit, plan }: Props) {
  const isUnlimited = limit >= 999999;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const isHigh = pct >= 80;

  if (isUnlimited) {
    return (
      <div className="px-3 py-3">
        <div className="rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1d4ed8] p-4 text-white text-sm">
          <div className="font-semibold mb-0.5">{plan} — Unlimited</div>
          <div className="text-white/80 text-xs">{used} riset hari ini</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-3">
      <div className={`rounded-xl p-4 text-sm ${isHigh ? "bg-amber-50 border border-amber-200" : "bg-slate-50 border border-slate-200"}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold ${isHigh ? "text-amber-700" : "text-slate-700"}`}>
            Quota Hari Ini
          </span>
          <span className={`text-xs ${isHigh ? "text-amber-600" : "text-slate-500"}`}>
            {used}/{limit}
          </span>
        </div>
        {/* SVG progress bar */}
        <svg viewBox="0 0 200 8" className="w-full" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="200" height="8" rx="4" fill={isHigh ? "#fef3c7" : "#e2e8f0"} />
          <rect
            x="0"
            y="0"
            width={Math.max(4, pct * 2)}
            height="8"
            rx="4"
            fill={isHigh ? "#f59e0b" : "#1E40AF"}
          />
        </svg>
        {isHigh && (
          <a
            href="/dashboard/billing"
            className="block mt-2 text-center bg-amber-500 text-white rounded-lg py-1 text-xs font-semibold hover:bg-amber-600 transition-colors"
          >
            Upgrade Sekarang
          </a>
        )}
      </div>
    </div>
  );
}

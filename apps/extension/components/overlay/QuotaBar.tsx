interface QuotaBarProps {
  used: number;
  limit: number;
  className?: string;
}

export function QuotaBar({ used, limit, className = "" }: QuotaBarProps) {
  const pct = limit > 0 ? Math.min(used / limit, 1) : 0;
  const isHigh = pct >= 0.8;
  const fill = isHigh ? "#f59e0b" : "#1E40AF";
  const bg = isHigh ? "#fef3c7" : "#e2e8f0";
  const barWidth = Math.max(4, pct * 160);

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Kuota Hari Ini</span>
        <span>
          {used}/{limit}
        </span>
      </div>
      <svg viewBox="0 0 160 6" className="w-full" style={{ height: 6 }}>
        <rect x="0" y="0" width="160" height="6" rx="3" fill={bg} />
        <rect x="0" y="0" width={barWidth} height="6" rx="3" fill={fill} />
      </svg>
    </div>
  );
}

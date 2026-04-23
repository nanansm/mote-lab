interface InlineBadgeProps {
  totalSold: number;
  isSaved?: boolean;
}

export function InlineBadge({ totalSold, isSaved = false }: InlineBadgeProps) {
  const sold = totalSold >= 1000 ? `${(totalSold / 1000).toFixed(1)}rb` : `${totalSold}`;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        background: isSaved ? "#dcfce7" : "#eff6ff",
        color: isSaved ? "#16a34a" : "#1E40AF",
        border: `1px solid ${isSaved ? "#86efac" : "#bfdbfe"}`,
        borderRadius: "4px",
        padding: "1px 6px",
        fontSize: "11px",
        fontWeight: 600,
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.4,
      }}
    >
      {isSaved ? "✓" : "M"} {sold} terjual
    </span>
  );
}

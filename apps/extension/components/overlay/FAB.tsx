interface FABProps {
  onClick: () => void;
  active?: boolean;
  queued?: number;
}

export function FAB({ onClick, active = false, queued = 0 }: FABProps) {
  return (
    <button
      onClick={onClick}
      title="Mote LAB — riset marketplace"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 2147483647,
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        background: active ? "#1E40AF" : "#374151",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        fontSize: "20px",
        transition: "background 0.2s",
      }}
    >
      {/* Mote logo mark — simplified M */}
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 18V6l9 9 9-9v12" />
      </svg>
      {queued > 0 && (
        <span
          style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            background: "#f59e0b",
            color: "#000",
            borderRadius: "50%",
            width: "16px",
            height: "16px",
            fontSize: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
          }}
        >
          {queued > 9 ? "9+" : queued}
        </span>
      )}
    </button>
  );
}

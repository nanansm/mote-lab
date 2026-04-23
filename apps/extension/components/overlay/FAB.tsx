interface FABProps {
  onClick: () => void;
  active?: boolean;
  queued?: number;
}

export function FAB({ onClick, active = false, queued = 0 }: FABProps) {
  console.log("[Mote LAB] FAB rendered, active:", active, "queued:", queued);
  return (
    <button
      onClick={onClick}
      title="Mote LAB — riset marketplace"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 2147483647,
        width: "52px",
        height: "52px",
        borderRadius: "50%",
        background: active ? "#1E40AF" : "#374151",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        fontSize: "18px",
        fontWeight: "bold",
        fontFamily: "system-ui, sans-serif",
        transition: "background 0.2s",
      }}
    >
      M
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

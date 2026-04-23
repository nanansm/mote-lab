import { QuotaBar } from "./QuotaBar";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  status: "idle" | "scraping" | "sending" | "done" | "error" | "unauthenticated";
  itemCount?: number;
  pageType?: string;
  marketplace?: string;
  quota?: { used: number; limit: number; remaining: number };
  error?: string;
  onScrape?: () => void;
}

const STATUS_LABEL: Record<SidePanelProps["status"], string> = {
  idle: "Siap",
  scraping: "Mengambil data...",
  sending: "Mengirim ke server...",
  done: "Berhasil disimpan",
  error: "Terjadi kesalahan",
  unauthenticated: "Belum login",
};

const STATUS_COLOR: Record<SidePanelProps["status"], string> = {
  idle: "#6b7280",
  scraping: "#1E40AF",
  sending: "#1E40AF",
  done: "#16a34a",
  error: "#dc2626",
  unauthenticated: "#d97706",
};

export function SidePanel({
  open,
  onClose,
  status,
  itemCount,
  pageType,
  marketplace,
  quota,
  error,
  onScrape,
}: SidePanelProps) {
  if (!open) return null;

  const apiUrl = process.env.PLASMO_PUBLIC_API_URL ?? "https://lab.motekreatif.com";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "360px",
        height: "100vh",
        background: "#fff",
        zIndex: 2147483646,
        boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
        color: "#111827",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#1E40AF",
          color: "#fff",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: "16px" }}>Mote LAB</div>
          <div style={{ fontSize: "12px", opacity: 0.8 }}>
            {marketplace ?? "Marketplace"} · {pageType ?? "Halaman"}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            fontSize: "20px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {status === "unauthenticated" ? (
          <div style={{ textAlign: "center", paddingTop: "32px" }}>
            <p style={{ color: "#6b7280", marginBottom: "16px" }}>Login untuk menggunakan Mote LAB</p>
            <a
              href={`${apiUrl}/auth/extension`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-block",
                background: "#1E40AF",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Login ke Mote LAB
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Status */}
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: STATUS_COLOR[status],
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: STATUS_COLOR[status], fontWeight: 500 }}>{STATUS_LABEL[status]}</span>
                {itemCount !== undefined && itemCount > 0 && (
                  <span style={{ marginLeft: "auto", color: "#6b7280", fontSize: "12px" }}>
                    {itemCount} produk
                  </span>
                )}
              </div>
              {error && (
                <p style={{ marginTop: "8px", color: "#dc2626", fontSize: "12px" }}>{error}</p>
              )}
            </div>

            {/* Quota */}
            {quota && (
              <QuotaBar used={quota.used} limit={quota.limit} className="px-1" />
            )}

            {/* Action button */}
            {(status === "idle" || status === "done" || status === "error") && onScrape && (
              <button
                onClick={onScrape}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#1E40AF",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                {status === "done" ? "Ambil Ulang" : "Ambil Data Sekarang"}
              </button>
            )}

            {(status === "scraping" || status === "sending") && (
              <div style={{ textAlign: "center", padding: "8px", color: "#6b7280", fontSize: "13px" }}>
                <div
                  style={{
                    display: "inline-block",
                    width: "20px",
                    height: "20px",
                    border: "2px solid #e5e7eb",
                    borderTopColor: "#1E40AF",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    marginBottom: "8px",
                  }}
                />
                <p>{STATUS_LABEL[status]}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid #e5e7eb",
          fontSize: "11px",
          color: "#9ca3af",
          textAlign: "center",
        }}
      >
        <a href={`${apiUrl}/dashboard`} target="_blank" rel="noreferrer" style={{ color: "#1E40AF" }}>
          Buka Dashboard →
        </a>
      </div>
    </div>
  );
}

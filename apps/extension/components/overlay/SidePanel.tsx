import { formatIDR, type AggregateEstimate } from "../../lib/estimate";
import { QuotaBar } from "./QuotaBar";

type ProductRow = {
  external_id: string;
  name: string;
  current_price: number;
  total_sold: number;
  rating?: number | null;
};

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
  estimate?: AggregateEstimate;
  products?: ProductRow[];
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
  estimate,
  products,
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

            {/* Estimasi Market */}
            {estimate && estimate.productCount > 0 && (
              <div
                style={{
                  padding: "16px",
                  background: "#f0f4ff",
                  borderRadius: "8px",
                  border: "1px solid #c7d7f9",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px", color: "#1E40AF" }}>
                  Estimasi Market
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "2px" }}>Total Omset</div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                      {formatIDR(estimate.totalOmset)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "2px" }}>Omset / Bulan</div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                      {formatIDR(estimate.monthlyOmset)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "2px" }}>Rata-rata / Produk</div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>
                      {formatIDR(estimate.avgMonthlyPerProduct)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "2px" }}>Jumlah Produk</div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{estimate.productCount}</div>
                  </div>
                </div>
                <div style={{ marginTop: "8px", fontSize: "10px", color: "#9ca3af" }}>
                  *Estimasi berdasarkan total terjual × harga, asumsi 6 bulan aktif
                </div>
              </div>
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
                Refresh Data
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

            {/* Product list */}
            {products && products.length > 0 && (
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
                  {products.length} produk di halaman ini:
                </div>
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {products.slice(0, 20).map((p) => (
                    <div
                      key={p.external_id}
                      style={{
                        padding: "8px 4px",
                        borderBottom: "1px solid #f3f4f6",
                        fontSize: "12px",
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: "2px", color: "#111827" }}>
                        {p.name.length > 60 ? `${p.name.slice(0, 60)}...` : p.name}
                      </div>
                      <div style={{ color: "#6b7280" }}>
                        {formatIDR(p.current_price)} · {p.total_sold.toLocaleString("id")} terjual
                        {p.rating ? ` · ⭐ ${p.rating}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
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

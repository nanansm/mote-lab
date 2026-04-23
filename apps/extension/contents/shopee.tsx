import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { FAB } from "../components/overlay/FAB";
import { SidePanel } from "../components/overlay/SidePanel";
import { detectShopeePageType } from "../lib/scrapers/shopee/detect";
import { scrapeShopeeProductDetail } from "../lib/scrapers/shopee/productDetail";
import { scrapeShopeeProductList } from "../lib/scrapers/shopee/productList";
import { scrapeShopeeShop } from "../lib/scrapers/shopee/shop";

export const config: PlasmoCSConfig = {
  matches: ["https://shopee.co.id/*"],
  run_at: "document_idle",
};

type Status = "idle" | "scraping" | "sending" | "done" | "error" | "unauthenticated";

function ShopeeOverlay() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [itemCount, setItemCount] = useState<number>(0);
  const [queueLen, setQueueLen] = useState(0);
  const [quota, setQuota] = useState<{ used: number; limit: number; remaining: number } | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [authenticated, setAuthenticated] = useState(true);

  const pageType = detectShopeePageType(window.location.href);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_AUTH_STATUS" }, (res) => {
      if (!res?.authenticated) setAuthenticated(false);
      if (res?.quota) setQuota(res.quota);
    });
    chrome.runtime.sendMessage({ type: "GET_QUEUE_LENGTH" }, (res) => {
      setQueueLen(res?.length ?? 0);
    });
  }, []);

  async function handleScrape() {
    if (!authenticated) {
      setOpen(true);
      setStatus("unauthenticated");
      return;
    }

    setOpen(true);
    setStatus("scraping");
    setError(undefined);

    try {
      const scrapedAt = new Date().toISOString();
      const pageUrl = window.location.href;

      if (pageType === "product-list") {
        const products = await new Promise<ReturnType<typeof scrapeShopeeProductList>>((resolve) => {
          requestIdleCallback(() => resolve(scrapeShopeeProductList()), { timeout: 3000 });
        });

        if (products.length === 0) {
          setStatus("error");
          setError("Tidak ada produk ditemukan di halaman ini");
          return;
        }

        setItemCount(products.length);
        setStatus("sending");

        // Batch max 50 per push
        const batch = products.slice(0, 50);
        const res = await new Promise<{ ok: boolean; queued?: number; offline?: boolean }>((resolve) =>
          chrome.runtime.sendMessage(
            { type: "INGEST_SHOPEE_PRODUCTS", payload: { scraped_at: scrapedAt, page_url: pageUrl, data: batch } },
            resolve,
          ),
        );

        if (res.ok) {
          setStatus("done");
          if (quota) setQuota((q) => q && { ...q, used: q.used + (res.queued ?? batch.length) });
        } else {
          setStatus("error");
          setError("Gagal mengirim data");
        }
      } else if (pageType === "product-detail") {
        const product = await new Promise<ReturnType<typeof scrapeShopeeProductDetail>>((resolve) => {
          requestIdleCallback(() => resolve(scrapeShopeeProductDetail()), { timeout: 3000 });
        });

        if (!product) {
          setStatus("error");
          setError("Tidak bisa mengambil detail produk");
          return;
        }

        setItemCount(1);
        setStatus("sending");

        const res = await new Promise<{ ok: boolean }>((resolve) =>
          chrome.runtime.sendMessage(
            { type: "INGEST_SHOPEE_PRODUCTS", payload: { scraped_at: scrapedAt, page_url: pageUrl, data: [product] } },
            resolve,
          ),
        );

        setStatus(res.ok ? "done" : "error");
        if (!res.ok) setError("Gagal mengirim data");
      } else if (pageType === "shop") {
        const shop = await new Promise<ReturnType<typeof scrapeShopeeShop>>((resolve) => {
          requestIdleCallback(() => resolve(scrapeShopeeShop()), { timeout: 3000 });
        });

        if (!shop) {
          setStatus("error");
          setError("Tidak bisa mengambil data toko");
          return;
        }

        setItemCount(1);
        setStatus("sending");

        const res = await new Promise<{ ok: boolean }>((resolve) =>
          chrome.runtime.sendMessage(
            { type: "INGEST_SHOPEE_SHOP", payload: { scraped_at: scrapedAt, page_url: pageUrl, data: shop } },
            resolve,
          ),
        );

        setStatus(res.ok ? "done" : "error");
        if (!res.ok) setError("Gagal mengirim data toko");
      }

      chrome.runtime.sendMessage({ type: "GET_QUEUE_LENGTH" }, (res) => setQueueLen(res?.length ?? 0));
    } catch (err) {
      setStatus("error");
      setError(String(err));
    }
  }

  const statusForPanel: Status = !authenticated ? "unauthenticated" : status;

  return (
    <>
      <FAB onClick={() => (open ? setOpen(false) : handleScrape())} active={open} queued={queueLen} />
      <SidePanel
        open={open}
        onClose={() => setOpen(false)}
        status={statusForPanel}
        itemCount={itemCount}
        pageType={
          pageType === "product-list"
            ? "List Produk"
            : pageType === "product-detail"
              ? "Detail Produk"
              : pageType === "shop"
                ? "Toko"
                : "Tidak Dikenali"
        }
        marketplace="Shopee"
        quota={quota}
        error={error}
        onScrape={handleScrape}
      />
    </>
  );
}

// Mount into a dedicated div outside main React tree
const container = document.createElement("div");
container.id = "mote-lab-overlay";
document.body.appendChild(container);
const root = createRoot(container);
root.render(<ShopeeOverlay />);

// Re-detect on SPA navigation (debounced)
let navTimer: ReturnType<typeof setTimeout> | null = null;
const observer = new MutationObserver(() => {
  if (navTimer) clearTimeout(navTimer);
  navTimer = setTimeout(() => {
    // Only re-render if URL changed — handled by React state
  }, 500);
});
observer.observe(document.body, { childList: true, subtree: false });

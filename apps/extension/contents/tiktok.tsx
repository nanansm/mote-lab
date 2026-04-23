import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { FAB } from "../components/overlay/FAB";
import { SidePanel } from "../components/overlay/SidePanel";
import { detectTiktokPageType } from "../lib/scrapers/tiktok/detect";
import { scrapeTiktokProductDetail } from "../lib/scrapers/tiktok/productDetail";
import { scrapeTiktokProductList } from "../lib/scrapers/tiktok/productList";
import { scrapeTiktokShop } from "../lib/scrapers/tiktok/shop";

export const config: PlasmoCSConfig = {
  matches: ["https://*.tiktok.com/*", "https://shop.tiktok.com/*"],
  run_at: "document_idle",
  // world: "MAIN" allows access to window globals like __INITIAL_STATE__
  world: "MAIN",
};

type Status = "idle" | "scraping" | "sending" | "done" | "error" | "unauthenticated";

function TiktokOverlay() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [itemCount, setItemCount] = useState<number>(0);
  const [queueLen, setQueueLen] = useState(0);
  const [quota, setQuota] = useState<{ used: number; limit: number; remaining: number } | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [authenticated, setAuthenticated] = useState(true);

  const pageType = detectTiktokPageType(window.location.href);

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
        const products = await new Promise<ReturnType<typeof scrapeTiktokProductList>>((resolve) => {
          requestIdleCallback(() => resolve(scrapeTiktokProductList()), { timeout: 3000 });
        });

        if (products.length === 0) {
          setStatus("error");
          setError("Tidak ada produk ditemukan di halaman ini");
          return;
        }

        setItemCount(products.length);
        setStatus("sending");

        const batch = products.slice(0, 50);
        const res = await new Promise<{ ok: boolean; queued?: number }>((resolve) =>
          chrome.runtime.sendMessage(
            { type: "INGEST_TIKTOK_PRODUCTS", payload: { scraped_at: scrapedAt, page_url: pageUrl, data: batch } },
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
        const product = await new Promise<ReturnType<typeof scrapeTiktokProductDetail>>((resolve) => {
          requestIdleCallback(() => resolve(scrapeTiktokProductDetail()), { timeout: 3000 });
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
            {
              type: "INGEST_TIKTOK_PRODUCTS",
              payload: { scraped_at: scrapedAt, page_url: pageUrl, data: [product] },
            },
            resolve,
          ),
        );

        setStatus(res.ok ? "done" : "error");
        if (!res.ok) setError("Gagal mengirim data");
      } else if (pageType === "shop") {
        const shop = await new Promise<ReturnType<typeof scrapeTiktokShop>>((resolve) => {
          requestIdleCallback(() => resolve(scrapeTiktokShop()), { timeout: 3000 });
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
            { type: "INGEST_TIKTOK_SHOP", payload: { scraped_at: scrapedAt, page_url: pageUrl, data: shop } },
            resolve,
          ),
        );

        setStatus(res.ok ? "done" : "error");
        if (!res.ok) setError("Gagal mengirim data toko");
      } else {
        setStatus("error");
        setError("Halaman ini tidak didukung. Coba di halaman produk atau toko TikTok.");
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
        marketplace="TikTok Shop"
        quota={quota}
        error={error}
        onScrape={handleScrape}
      />
    </>
  );
}

const container = document.createElement("div");
container.id = "mote-lab-overlay-tiktok";
document.body.appendChild(container);
const root = createRoot(container);
root.render(<TiktokOverlay />);

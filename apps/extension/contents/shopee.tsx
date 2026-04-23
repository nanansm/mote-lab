import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { FAB } from "../components/overlay/FAB";
import { SidePanel } from "../components/overlay/SidePanel";
import { aggregateEstimate, type AggregateEstimate } from "../lib/estimate";
import { detectShopeePageType, type ShopeePageType } from "../lib/scrapers/shopee/detect";
import { scrapeShopeeProductDetail } from "../lib/scrapers/shopee/productDetail";
import { scrapeShopeeProductList } from "../lib/scrapers/shopee/productList";
import { scrapeShopeeShop } from "../lib/scrapers/shopee/shop";
import type { ShopeeProduct } from "../lib/types";

export const config: PlasmoCSConfig = {
  matches: ["https://shopee.co.id/*"],
  run_at: "document_idle",
};

console.log("[Mote LAB] shopee.tsx content script loaded");

export const getStyle = () => {
  console.log("[Mote LAB] getStyle called");
  const style = document.createElement("style");
  style.textContent = `
    :host {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 0 !important;
      height: 0 !important;
      z-index: 2147483647 !important;
      overflow: visible !important;
      display: block !important;
    }
  `;
  return style;
};

export const getRootContainer = async () => {
  console.log("[Mote LAB] getRootContainer called");
  const container = document.createElement("div");
  container.id = "mote-lab-shopee-overlay";
  document.body.appendChild(container);
  return container;
};

type Status = "idle" | "scraping" | "sending" | "done" | "error" | "unauthenticated";

const PAGE_TYPE_LABEL: Record<ShopeePageType, string> = {
  "product-list": "List Produk",
  "product-detail": "Detail Produk",
  "shop": "Toko",
  "unknown": "Tidak Didukung",
};

export default function ShopeeOverlay() {
  console.log("[Mote LAB] ShopeeOverlay rendered");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [itemCount, setItemCount] = useState<number>(0);
  const [queueLen, setQueueLen] = useState(0);
  const [quota, setQuota] = useState<{ used: number; limit: number; remaining: number } | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [authenticated, setAuthenticated] = useState(true);
  const [products, setProducts] = useState<ShopeeProduct[]>([]);
  const [estimate, setEstimate] = useState<AggregateEstimate | undefined>();
  const [detectedPageType, setDetectedPageType] = useState<ShopeePageType>("unknown");

  useEffect(() => {
    console.log("[Mote LAB] Shopee content script aktif:", window.location.href);
    chrome.runtime.sendMessage({ type: "GET_AUTH_STATUS" }, (res) => {
      if (chrome.runtime.lastError) return;
      if (!res?.authenticated) setAuthenticated(false);
      if (res?.quota) setQuota(res.quota);
    });
    chrome.runtime.sendMessage({ type: "GET_QUEUE_LENGTH" }, (res) => {
      if (chrome.runtime.lastError) return;
      setQueueLen(res?.length ?? 0);
    });
  }, []);

  async function handleScrape() {
    if (!authenticated) {
      setStatus("unauthenticated");
      return;
    }

    setStatus("scraping");
    setError(undefined);

    try {
      const scrapedAt = new Date().toISOString();
      const pageUrl = window.location.href;

      // Detect page type with DOM inside requestIdleCallback so Shopee's React has time to render
      const pageType = await new Promise<ShopeePageType>((resolve) => {
        requestIdleCallback(() => resolve(detectShopeePageType()), { timeout: 3000 });
      });
      setDetectedPageType(pageType);
      console.log("[Mote LAB] Detected page type:", pageType);

      if (pageType === "unknown") {
        setStatus("error");
        setError("Halaman ini tidak didukung. Buka halaman search, toko, atau produk Shopee.");
        return;
      }

      if (pageType === "product-list" || pageType === "shop") {
        const scraped = await new Promise<ReturnType<typeof scrapeShopeeProductList>>((resolve) => {
          requestIdleCallback(() => resolve(scrapeShopeeProductList()), { timeout: 3000 });
        });

        if (scraped.length === 0) {
          setStatus("error");
          setError("Tidak ada produk ditemukan di halaman ini");
          return;
        }

        setProducts(scraped);
        setEstimate(aggregateEstimate(scraped));
        setItemCount(scraped.length);
        setStatus("sending");

        const batch = scraped.slice(0, 50);
        const res = await new Promise<{ ok: boolean; queued?: number; offline?: boolean }>((resolve) =>
          chrome.runtime.sendMessage(
            { type: "INGEST_SHOPEE_PRODUCTS", payload: { scraped_at: scrapedAt, page_url: pageUrl, data: batch } },
            resolve,
          ),
        );

        if (res.ok) {
          setStatus("done");
          if (quota) setQuota((q) => q && { ...q, used: q.used + (res.queued ?? batch.length) });
          // Also push shop metadata when on a shop page
          if (pageType === "shop") {
            const shop = scrapeShopeeShop();
            if (shop) {
              chrome.runtime.sendMessage({
                type: "INGEST_SHOPEE_SHOP",
                payload: { scraped_at: scrapedAt, page_url: pageUrl, data: shop },
              });
            }
          }
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
      }

      chrome.runtime.sendMessage({ type: "GET_QUEUE_LENGTH" }, (res) => {
        if (chrome.runtime.lastError) return;
        setQueueLen(res?.length ?? 0);
      });
    } catch (err) {
      setStatus("error");
      setError(String(err));
    }
  }

  const handleOpenPanel = () => {
    setOpen(true);
    if (products.length === 0) {
      handleScrape();
    }
  };

  const statusForPanel: Status = !authenticated ? "unauthenticated" : status;

  return (
    <>
      <FAB
        onClick={() => (open ? setOpen(false) : handleOpenPanel())}
        active={open}
        queued={queueLen}
      />
      <SidePanel
        open={open}
        onClose={() => setOpen(false)}
        status={statusForPanel}
        itemCount={itemCount}
        pageType={PAGE_TYPE_LABEL[detectedPageType]}
        marketplace="Shopee"
        quota={quota}
        error={error}
        onScrape={handleScrape}
        estimate={estimate}
        products={products}
      />
    </>
  );
}

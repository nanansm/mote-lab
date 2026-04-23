import type {
  IngestResponse,
  ProductsIngestPayload,
  ShopeeProduct,
  ShopeeShop,
  ShopIngestPayload,
  TiktokProduct,
  TiktokShop,
  VerifyResponse,
} from "./types";

const API_URL = process.env.PLASMO_PUBLIC_API_URL ?? "https://lab.motekreatif.com";

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delayMs = 1000,
): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429 || res.status >= 500) {
        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, attempt)));
          continue;
        }
      }
      return res;
    } catch (err) {
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, attempt)));
      } else {
        throw err;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

export async function verifyToken(token: string): Promise<VerifyResponse> {
  const res = await fetchWithRetry(`${API_URL}/api/extension/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`Verify failed: ${res.status}`);
  return res.json();
}

export async function ingestShopeeProducts(
  token: string,
  payload: ProductsIngestPayload<ShopeeProduct>,
): Promise<IngestResponse> {
  const res = await fetchWithRetry(`${API_URL}/api/ingest/shopee/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return res.json() as Promise<IngestResponse>;
}

export async function ingestShopeeShop(
  token: string,
  payload: ShopIngestPayload<ShopeeShop>,
): Promise<IngestResponse> {
  const res = await fetchWithRetry(`${API_URL}/api/ingest/shopee/shop`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return res.json() as Promise<IngestResponse>;
}

export async function ingestTiktokProducts(
  token: string,
  payload: ProductsIngestPayload<TiktokProduct>,
): Promise<IngestResponse> {
  const res = await fetchWithRetry(`${API_URL}/api/ingest/tiktok/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return res.json() as Promise<IngestResponse>;
}

export async function ingestTiktokShop(
  token: string,
  payload: ShopIngestPayload<TiktokShop>,
): Promise<IngestResponse> {
  const res = await fetchWithRetry(`${API_URL}/api/ingest/tiktok/shop`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return res.json() as Promise<IngestResponse>;
}

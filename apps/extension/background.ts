import {
  ingestShopeeProducts,
  ingestShopeeShop,
  ingestTokopediaProducts,
  ingestTokopediaShop,
  verifyToken,
} from "./lib/api";
import { dequeue, enqueue, queueLength, requeueWithBackoff } from "./lib/queue";
import { clearAuth, getAuth, setAuth } from "./lib/storage";
import type {
  IngestResponse,
  ProductsIngestPayload,
  ShopeeProduct,
  ShopeeShop,
  ShopIngestPayload,
  StoredAuth,
  TokopediaProduct,
  TokopediaShop,
} from "./lib/types";

export {};

// Throttle: max 1 ingest batch per 2 seconds
let lastPushAt = 0;
const PUSH_THROTTLE_MS = 2000;

async function getToken(): Promise<string | null> {
  const auth = await getAuth();
  if (!auth) return null;
  // Expire after 30 days of inactivity
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - auth.savedAt > thirtyDays) {
    await clearAuth();
    return null;
  }
  return auth.token;
}

type IngestMessage =
  | { type: "INGEST_SHOPEE_PRODUCTS"; payload: ProductsIngestPayload<ShopeeProduct> }
  | { type: "INGEST_SHOPEE_SHOP"; payload: ShopIngestPayload<ShopeeShop> }
  | { type: "INGEST_TOKOPEDIA_PRODUCTS"; payload: ProductsIngestPayload<TokopediaProduct> }
  | { type: "INGEST_TOKOPEDIA_SHOP"; payload: ShopIngestPayload<TokopediaShop> };

type ExtMessage =
  | IngestMessage
  | { type: "MOTE_LAB_AUTH_TOKEN"; token: string; user: StoredAuth["user"] }
  | { type: "GET_AUTH_STATUS" }
  | { type: "LOGOUT" }
  | { type: "GET_QUEUE_LENGTH" };

async function doIngest(token: string, msg: IngestMessage): Promise<IngestResponse> {
  switch (msg.type) {
    case "INGEST_SHOPEE_PRODUCTS":
      return ingestShopeeProducts(token, msg.payload);
    case "INGEST_SHOPEE_SHOP":
      return ingestShopeeShop(token, msg.payload);
    case "INGEST_TOKOPEDIA_PRODUCTS":
      return ingestTokopediaProducts(token, msg.payload);
    case "INGEST_TOKOPEDIA_SHOP":
      return ingestTokopediaShop(token, msg.payload);
  }
}

async function handleIngest(msg: IngestMessage): Promise<{ ok: boolean; queued?: number; offline?: boolean }> {
  const now = Date.now();
  if (now - lastPushAt < PUSH_THROTTLE_MS) {
    await enqueue(msg.type, msg.payload);
    return { ok: true, offline: true };
  }

  const token = await getToken();
  if (!token) {
    await enqueue(msg.type, msg.payload);
    return { ok: true, offline: true };
  }

  try {
    lastPushAt = now;
    const res = await doIngest(token, msg);
    if (res.ok) {
      const auth = await getAuth();
      if (auth && res.quotaRemaining !== undefined) {
        const used = auth.quota.limit - res.quotaRemaining;
        await setAuth({ ...auth, quota: { ...auth.quota, used, remaining: res.quotaRemaining } });
      }
    }
    return { ok: res.ok ?? false, queued: res.queued };
  } catch {
    await enqueue(msg.type, msg.payload);
    return { ok: true, offline: true };
  }
}

// Drain offline queue periodically
async function drainQueue() {
  const token = await getToken();
  if (!token) return;

  let drained = 0;
  while (drained < 5) {
    const item = await dequeue();
    if (!item) break;

    try {
      await doIngest(token, { type: item.endpoint, payload: item.payload } as IngestMessage);
      drained++;
      await new Promise((r) => setTimeout(r, PUSH_THROTTLE_MS));
    } catch {
      await requeueWithBackoff(item);
      break;
    }
  }
}

chrome.alarms.create("drain-queue", { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "drain-queue") drainQueue();
});

chrome.runtime.onMessage.addListener((message: ExtMessage, _sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case "MOTE_LAB_AUTH_TOKEN": {
        try {
          const verify = await verifyToken(message.token);
          if (verify.valid) {
            const auth: StoredAuth = {
              token: message.token,
              user: verify.user,
              quota: verify.quota,
              savedAt: Date.now(),
            };
            await setAuth(auth);
            sendResponse({ ok: true, user: verify.user, quota: verify.quota });
          } else {
            sendResponse({ ok: false, error: "Token invalid" });
          }
        } catch (err) {
          sendResponse({ ok: false, error: String(err) });
        }
        break;
      }

      case "GET_AUTH_STATUS": {
        const auth = await getAuth();
        if (!auth) {
          sendResponse({ authenticated: false });
          break;
        }
        try {
          const verify = await verifyToken(auth.token);
          if (verify.valid) {
            await setAuth({ ...auth, quota: verify.quota });
            sendResponse({ authenticated: true, user: verify.user, quota: verify.quota });
          } else {
            await clearAuth();
            sendResponse({ authenticated: false });
          }
        } catch {
          sendResponse({ authenticated: true, user: auth.user, quota: auth.quota, cached: true });
        }
        break;
      }

      case "LOGOUT": {
        await clearAuth();
        sendResponse({ ok: true });
        break;
      }

      case "GET_QUEUE_LENGTH": {
        const len = await queueLength();
        sendResponse({ length: len });
        break;
      }

      case "INGEST_SHOPEE_PRODUCTS":
      case "INGEST_SHOPEE_SHOP":
      case "INGEST_TOKOPEDIA_PRODUCTS":
      case "INGEST_TOKOPEDIA_SHOP": {
        const result = await handleIngest(message);
        sendResponse(result);
        break;
      }
    }
  })();
  return true;
});

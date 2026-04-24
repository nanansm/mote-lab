import crypto from "crypto";

const IPAYMU_BASE_URL = process.env.IPAYMU_URL ?? "https://my.ipaymu.com";
const IPAYMU_VA = process.env.IPAYMU_VA!;
const IPAYMU_API_KEY = process.env.IPAYMU_API_KEY!;

// ─── Signature ────────────────────────────────────────────────────────────────
// Formula: SHA256("POST:{va}:{sha256(body)}:{apiKey}") — plain SHA256, NOT HMAC
function buildSignature(bodyJson: string): string {
  const bodyHash = crypto.createHash("sha256").update(bodyJson).digest("hex");
  const stringToSign = `POST:${IPAYMU_VA}:${bodyHash}:${IPAYMU_API_KEY}`;
  return crypto.createHash("sha256").update(stringToSign).digest("hex");
}

// iPaymu requires timestamp in WIB (GMT+7), format YYYYMMDDHHmmss
function buildTimestamp(): string {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
}

function buildHeaders(bodyJson: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    va: IPAYMU_VA,
    signature: buildSignature(bodyJson),
    timestamp: buildTimestamp(),
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CreatePaymentParams {
  orderId: string;    // our internal UUID → iPaymu referenceId
  plan: string;       // human-readable product name
  amount: number;     // IDR integer
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
}

export interface IpaymuPaymentResult {
  sessionId: string;
  paymentUrl: string;
}

export interface IpaymuTransactionStatus {
  statusCode: number;   // 1=Berhasil, 6=Berhasil-Unsettled, 7=Escrow
  status: string;       // human readable
  amount: number;
  referenceId: string;
  trxId: string;
}

// ─── Create redirect payment ──────────────────────────────────────────────────
export async function createPaymentRedirect(
  params: CreatePaymentParams,
): Promise<IpaymuPaymentResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const body = {
    product: [params.plan],
    qty: [1],
    price: [params.amount],
    returnUrl: `${appUrl}/billing/success?orderId=${params.orderId}`,
    cancelUrl: `${appUrl}/billing/cancel?orderId=${params.orderId}`,
    notifyUrl: `${appUrl}/api/billing/webhook`,
    referenceId: params.orderId,
    buyerName: params.buyerName,
    buyerEmail: params.buyerEmail,
    buyerPhone: params.buyerPhone,
  };

  const bodyJson = JSON.stringify(body);

  const res = await fetch(`${IPAYMU_BASE_URL}/api/v2/payment`, {
    method: "POST",
    headers: buildHeaders(bodyJson),
    body: bodyJson,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`iPaymu HTTP ${res.status}: ${text}`);
  }

  const json = await res.json();

  // iPaymu returns { Status: 200, Message: "...", Data: { SessionID, Url } }
  if (json.Status !== 200 || !json.Data?.Url) {
    throw new Error(`iPaymu error: ${json.Message ?? JSON.stringify(json)}`);
  }

  return {
    sessionId: json.Data.SessionID as string,
    paymentUrl: json.Data.Url as string,
  };
}

// ─── Fetch transaction status (used by webhook for server-side verification) ──
// iPaymu does NOT send a signature in webhook payloads, so we verify by
// calling this API with the trx_id from the callback before activating a plan.
export async function fetchTransactionStatus(
  trxId: string,
): Promise<IpaymuTransactionStatus> {
  const body = {
    transactionId: trxId,
    account: IPAYMU_VA,
  };
  const bodyJson = JSON.stringify(body);

  const res = await fetch(`${IPAYMU_BASE_URL}/api/v2/transaction`, {
    method: "POST",
    headers: buildHeaders(bodyJson),
    body: bodyJson,
  });

  if (!res.ok) {
    throw new Error(`iPaymu transaction check HTTP ${res.status}`);
  }

  const json = await res.json();
  if (json.Status !== 200 || !json.Data) {
    throw new Error(`iPaymu transaction check failed: ${json.Message}`);
  }

  return {
    statusCode: json.Data.StatusCode ?? json.Data.Status,
    status: json.Data.StatusDesc ?? "",
    amount: Number(json.Data.Amount),
    referenceId: json.Data.ReferenceId ?? "",
    trxId: json.Data.TransactionId ?? trxId,
  };
}

// ─── Plan config ──────────────────────────────────────────────────────────────
export const PLAN_PRICES: Record<string, number> = {
  starter: 99_000,
  pro: 199_000,
  lifetime: 1_999_000,
};

export const PLAN_LABELS: Record<string, string> = {
  starter: "Mote LAB Starter (1 bulan)",
  pro: "Mote LAB Pro (1 bulan)",
  lifetime: "Mote LAB Lifetime",
};

// Plans that require a monthly subscription expiry (lifetime = never expires)
export const RECURRING_PLANS = new Set(["starter", "pro"]);

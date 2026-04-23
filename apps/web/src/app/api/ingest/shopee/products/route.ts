import { NextRequest } from "next/server";
import { shopeeProductsIngestSchema } from "@mote-lab/shared";
import { createIngestHandler } from "@/lib/ingest-route-handler";
import type { ShopeeProductsIngest } from "@mote-lab/shared";

const handler = createIngestHandler({
  marketplace: "shopee",
  dataType: "products",
  schema: shopeeProductsIngestSchema,
  quotaIncrement: (body) => (body as ShopeeProductsIngest).data.length,
});

export async function POST(request: NextRequest) { return handler(request); }
export async function OPTIONS(request: NextRequest) { return handler(request); }

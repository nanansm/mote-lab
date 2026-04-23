import { NextRequest } from "next/server";
import { tiktokProductsIngestSchema } from "@mote-lab/shared";
import { createIngestHandler } from "@/lib/ingest-route-handler";
import type { TiktokProductsIngest } from "@mote-lab/shared";

const handler = createIngestHandler({
  marketplace: "tiktok",
  dataType: "products",
  schema: tiktokProductsIngestSchema,
  quotaIncrement: (body) => (body as TiktokProductsIngest).data.length,
});

export async function POST(request: NextRequest) { return handler(request); }
export async function OPTIONS(request: NextRequest) { return handler(request); }

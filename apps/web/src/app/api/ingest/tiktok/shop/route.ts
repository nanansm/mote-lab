import { NextRequest } from "next/server";
import { tiktokShopIngestSchema } from "@mote-lab/shared";
import { createIngestHandler } from "@/lib/ingest-route-handler";

const handler = createIngestHandler({
  marketplace: "tiktok",
  dataType: "shop",
  schema: tiktokShopIngestSchema,
  quotaIncrement: () => 1,
});

export async function POST(request: NextRequest) { return handler(request); }
export async function OPTIONS(request: NextRequest) { return handler(request); }

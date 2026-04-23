import { NextRequest } from "next/server";
import { tokopediaShopIngestSchema } from "@mote-lab/shared";
import { createIngestHandler } from "@/lib/ingest-route-handler";

const handler = createIngestHandler({
  marketplace: "tokopedia",
  dataType: "shop",
  schema: tokopediaShopIngestSchema,
  quotaIncrement: () => 1,
});

export async function POST(request: NextRequest) { return handler(request); }
export async function OPTIONS(request: NextRequest) { return handler(request); }

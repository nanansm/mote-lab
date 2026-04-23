import { NextRequest } from "next/server";
import { tokopediaProductsIngestSchema } from "@mote-lab/shared";
import { createIngestHandler } from "@/lib/ingest-route-handler";
import type { TokopediaProductsIngest } from "@mote-lab/shared";

const handler = createIngestHandler({
  marketplace: "tokopedia",
  dataType: "products",
  schema: tokopediaProductsIngestSchema,
  quotaIncrement: (body) => (body as TokopediaProductsIngest).data.length,
});

export async function POST(request: NextRequest) { return handler(request); }
export async function OPTIONS(request: NextRequest) { return handler(request); }

import { NextResponse } from "next/server";

import { getCurrencyRateSnapshot } from "@/lib/commerce/fx-rates";

export async function GET() {
  const snapshot = await getCurrencyRateSnapshot();
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

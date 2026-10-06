import { NextResponse } from "next/server";

import { listMaps } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const maps = await listMaps();
  return NextResponse.json({ maps });
}

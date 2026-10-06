import { NextRequest, NextResponse } from "next/server";

import { getEditorCookieName, verifyLoginKey } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { key: string };
  if (!verifyLoginKey(body.key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getEditorCookieName(), "ok", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/"
  });

  return response;
}

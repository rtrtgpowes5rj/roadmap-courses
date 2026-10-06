import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE_NAME = "edtechlab_editor";

export function isEditorAuthEnabled() {
  return Boolean(process.env.EDITOR_ACCESS_KEY);
}

export function getEditorCookieName() {
  return COOKIE_NAME;
}

export function hasEditorSession() {
  if (!isEditorAuthEnabled()) {
    return true;
  }

  return cookies().get(COOKIE_NAME)?.value === "ok";
}

export function assertEditorRequest(request: NextRequest) {
  if (!isEditorAuthEnabled()) {
    return true;
  }

  return request.cookies.get(COOKIE_NAME)?.value === "ok";
}

export function verifyLoginKey(key: string) {
  if (!isEditorAuthEnabled()) {
    return true;
  }

  return key === process.env.EDITOR_ACCESS_KEY;
}

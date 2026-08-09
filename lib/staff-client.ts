export const STAFF_CSRF_COOKIE_NAME = "recharza_staff_csrf";
export const STAFF_CSRF_HEADER_NAME = "x-recharza-csrf-token";

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const prefix = `${encodeURIComponent(name)}=`;
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : "";
}

export function staffMutationHeaders(
  headers: Record<string, string> = {},
) {
  return {
    ...headers,
    [STAFF_CSRF_HEADER_NAME]: readCookie(STAFF_CSRF_COOKIE_NAME),
  };
}

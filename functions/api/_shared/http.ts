const LOCAL_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

function parseAllowlist(env: any): string[] {
  const raw = String(env?.CORS_ALLOW_ORIGINS || "").trim();
  if (!raw) return LOCAL_ORIGINS;
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function requestOrigin(request: Request) {
  return request.headers.get("origin")?.trim() || "";
}

export function isOriginAllowed(request: Request, env: any) {
  const origin = requestOrigin(request);
  if (!origin) return true;
  const allowlist = parseAllowlist(env);
  return allowlist.includes(origin);
}

export function rejectDisallowedOrigin(request: Request, env: any) {
  if (isOriginAllowed(request, env)) return null;
  return new Response(JSON.stringify({ error: "origin_not_allowed" }), {
    status: 403,
    headers: { "content-type": "application/json" }
  });
}

function applyCorsHeaders(headers: Headers, request?: Request, env?: any, methods?: string) {
  if (!request) return;
  const origin = requestOrigin(request);
  if (!origin) return;
  if (!isOriginAllowed(request, env)) return;
  headers.set("access-control-allow-origin", origin);
  headers.set("vary", "origin");
  if (methods) {
    headers.set("access-control-allow-methods", methods);
    headers.set("access-control-allow-headers", "content-type, authorization, x-sp-user-id");
    headers.set("access-control-max-age", "86400");
  }
}

export function json(data: unknown, status = 200, request?: Request, env?: any) {
  const headers = new Headers({ "content-type": "application/json" });
  applyCorsHeaders(headers, request, env);
  return new Response(JSON.stringify(data), { status, headers });
}

export function corsOptions(methods: string, request?: Request, env?: any) {
  if (request && !isOriginAllowed(request, env)) {
    return new Response(null, { status: 403 });
  }
  const headers = new Headers();
  applyCorsHeaders(headers, request, env, methods);
  return new Response(null, { status: 204, headers });
}

export type AdminRuntimeEnv = {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_ANON_KEY?: string;
  ADMIN_EMAILS?: string;
};

export type SupabaseAdminResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  errorCode: string;
  errorMessage?: string;
  headers?: Headers;
};

function normalizeErrorCode(value: unknown) {
  const text = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]/g, "_");
  return text || "supabase_request_failed";
}

function trimSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getServerRuntimeEnvFromProcess(): AdminRuntimeEnv {
  const g = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } };
  const env = g.process?.env || {};
  return {
    SUPABASE_URL: String(env.SUPABASE_URL || "").trim(),
    SUPABASE_SERVICE_ROLE_KEY: String(env.SUPABASE_SERVICE_ROLE_KEY || "").trim(),
    SUPABASE_ANON_KEY: String(env.SUPABASE_ANON_KEY || "").trim(),
    ADMIN_EMAILS: String(env.ADMIN_EMAILS || "").trim(),
  };
}

function parseConfig(runtime?: AdminRuntimeEnv) {
  const url = trimSlash(String(runtime?.SUPABASE_URL || "").trim());
  const serviceRoleKey = String(runtime?.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const anonKey = String(runtime?.SUPABASE_ANON_KEY || "").trim();
  return { url, serviceRoleKey, anonKey };
}

async function parseJsonSafe<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function supabaseAdminRequest<T>(
  runtime: AdminRuntimeEnv,
  path: string,
  init: {
    method?: "GET" | "POST" | "PATCH" | "DELETE" | "HEAD";
    headers?: Record<string, string>;
    body?: unknown;
  } = {}
): Promise<SupabaseAdminResult<T>> {
  const cfg = parseConfig(runtime);
  if (!cfg.url || !cfg.serviceRoleKey) {
    return { ok: false, status: 0, data: null, errorCode: "supabase_not_configured" };
  }

  try {
    const method = init.method || "GET";
    const headers: Record<string, string> = {
      apikey: cfg.serviceRoleKey,
      authorization: `Bearer ${cfg.serviceRoleKey}`,
      ...init.headers,
    };
    if (method !== "GET" && method !== "HEAD") {
      headers["content-type"] = headers["content-type"] || "application/json";
    }

    const res = await fetch(`${cfg.url}${path}`, {
      method,
      headers,
      body: init.body !== undefined && method !== "GET" && method !== "HEAD"
        ? JSON.stringify(init.body)
        : undefined,
    });

    if (method === "HEAD") {
      return {
        ok: res.ok,
        status: res.status,
        data: null,
        errorCode: res.ok ? "" : normalizeErrorCode(res.statusText),
        headers: res.headers,
      };
    }

    const payload = await parseJsonSafe<Record<string, unknown> | unknown[]>(res);
    if (!res.ok) {
      const errObj = payload && !Array.isArray(payload) ? payload : null;
      return {
        ok: false,
        status: res.status,
        data: null,
        errorCode: normalizeErrorCode(
          errObj?.code || errObj?.error_code || errObj?.error || errObj?.message || res.statusText
        ),
        errorMessage: String(errObj?.message || errObj?.details || errObj?.hint || ""),
        headers: res.headers,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: (payload as T | null) ?? null,
      errorCode: "",
      headers: res.headers,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      errorCode: "supabase_network_error",
    };
  }
}

export async function supabaseAuthUser(runtime: AdminRuntimeEnv, accessToken: string) {
  const cfg = parseConfig(runtime);
  const token = String(accessToken || "").trim();
  if (!cfg.url || !token || !cfg.anonKey) {
    return { ok: false as const, status: 0, user: null as null };
  }
  try {
    const res = await fetch(`${cfg.url}/auth/v1/user`, {
      headers: {
        apikey: cfg.anonKey,
        authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return { ok: false as const, status: res.status, user: null as null };
    const user = await parseJsonSafe<{ id?: string; email?: string }>(res);
    if (!user?.id || !user?.email) return { ok: false as const, status: res.status, user: null as null };
    return { ok: true as const, status: res.status, user: { id: user.id, email: String(user.email).toLowerCase() } };
  } catch {
    return { ok: false as const, status: 0, user: null as null };
  }
}

export function parseAdminEmails(raw: string | undefined) {
  return new Set(
    String(raw || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

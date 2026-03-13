type SupabaseAdminConfig = {
  url: string;
  serviceRoleKey: string;
};

type SupabaseRequestResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  errorCode: string;
  errorMessage?: string;
};

type SupabaseAuthUser = {
  id: string;
  email?: string;
};

function normalizeErrorCode(value: unknown) {
  const text = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]/g, "_");
  return text || "supabase_request_failed";
}

function parseSupabaseConfig(env: any): SupabaseAdminConfig | null {
  const url = String(env?.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const serviceRoleKey = String(env?.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

async function parseJsonSafe<T>(response: Response): Promise<T | null> {
  try {
    return await response.json() as T;
  } catch {
    return null;
  }
}

export function hasSupabaseAdmin(env: any) {
  return Boolean(parseSupabaseConfig(env));
}

export async function supabaseAdminRequest<T>(
  env: any,
  path: string,
  init: {
    method?: "GET" | "POST" | "PATCH";
    headers?: Record<string, string>;
    body?: unknown;
  } = {}
): Promise<SupabaseRequestResult<T>> {
  const cfg = parseSupabaseConfig(env);
  if (!cfg) {
    return { ok: false, status: 0, data: null, errorCode: "supabase_not_configured" };
  }
  try {
    const res = await fetch(`${cfg.url}${path}`, {
      method: init.method || "GET",
      headers: {
        apikey: cfg.serviceRoleKey,
        authorization: `Bearer ${cfg.serviceRoleKey}`,
        "content-type": "application/json",
        ...init.headers
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined
    });
    const payload = await parseJsonSafe<Record<string, unknown> | unknown[]>(res);
    if (!res.ok) {
      const errObj = (payload && !Array.isArray(payload)) ? payload : null;
      const errorCode = normalizeErrorCode(
        errObj?.code || errObj?.error_code || errObj?.error || errObj?.message || res.statusText
      );
      return {
        ok: false,
        status: res.status,
        data: null,
        errorCode,
        errorMessage: String(errObj?.message || errObj?.error_description || errObj?.details || "")
      };
    }
    return {
      ok: true,
      status: res.status,
      data: (payload as T | null) ?? null,
      errorCode: ""
    };
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      errorCode: "supabase_network_error"
    };
  }
}

export async function verifySupabaseBearerToken(env: any, token: string): Promise<{ ok: boolean; userId?: string }> {
  const cfg = parseSupabaseConfig(env);
  const trimmed = token.trim();
  if (!cfg || !trimmed) return { ok: false };
  try {
    const res = await fetch(`${cfg.url}/auth/v1/user`, {
      headers: {
        apikey: cfg.serviceRoleKey,
        authorization: `Bearer ${trimmed}`
      }
    });
    if (!res.ok) return { ok: false };
    const user = await parseJsonSafe<SupabaseAuthUser>(res);
    if (!user?.id) return { ok: false };
    return { ok: true, userId: user.id };
  } catch {
    return { ok: false };
  }
}

export function parseRpcRow<T extends Record<string, unknown>>(payload: unknown): T | null {
  if (Array.isArray(payload)) {
    const first = payload[0];
    if (first && typeof first === "object") return first as T;
    return null;
  }
  if (payload && typeof payload === "object") return payload as T;
  return null;
}


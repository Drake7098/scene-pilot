import { requireApiAuth } from "./auth";
import { json } from "./http";

type AdminIdentity = { userId: string; email: string };

type SupabaseUser = { id?: string; email?: string };

function parseBearer(request: Request) {
  const raw = String(request.headers.get("authorization") || "").trim();
  if (!raw.toLowerCase().startsWith("bearer ")) return "";
  return raw.slice(7).trim();
}

function parseAdminEmails(raw: unknown) {
  return new Set(
    String(raw || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

async function getSupabaseUserByBearer(env: any, token: string): Promise<SupabaseUser | null> {
  const baseUrl = String(env?.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const serviceRoleKey = String(env?.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!baseUrl || !serviceRoleKey || !token) return null;
  try {
    const res = await fetch(`${baseUrl}/auth/v1/user`, {
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as SupabaseUser;
    return payload?.id ? payload : null;
  } catch {
    return null;
  }
}

export async function requireAdminApi(context: EventContext<any, any, any>): Promise<{ error: Response | null; identity: AdminIdentity | null }> {
  const originAuthError = await requireApiAuth(context);
  if (originAuthError) return { error: originAuthError, identity: null };

  const allowed = parseAdminEmails(context.env?.ADMIN_EMAILS);
  if (!allowed.size) {
    return {
      error: json({ error: "admin_emails_not_configured" }, 500, context.request, context.env),
      identity: null,
    };
  }

  const token = parseBearer(context.request);
  if (!token) {
    return {
      error: json({ error: "missing_access_token" }, 401, context.request, context.env),
      identity: null,
    };
  }

  const user = await getSupabaseUserByBearer(context.env, token);
  if (!user?.id || !user?.email) {
    return {
      error: json({ error: "invalid_access_token" }, 401, context.request, context.env),
      identity: null,
    };
  }

  const email = String(user.email || "").trim().toLowerCase();
  if (!allowed.has(email)) {
    return {
      error: json({ error: "admin_forbidden", email }, 403, context.request, context.env),
      identity: null,
    };
  }

  return {
    error: null,
    identity: { userId: String(user.id), email },
  };
}

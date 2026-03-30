import { type AdminRuntimeEnv, parseAdminEmails, supabaseAuthUser } from "./supabaseAdmin";

export class AdminGuardError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AdminGuardError";
  }
}

export type AdminIdentity = {
  userId: string;
  email: string;
};

function parseBearer(authHeader: string | null | undefined) {
  const raw = String(authHeader || "").trim();
  if (!raw.toLowerCase().startsWith("bearer ")) return "";
  return raw.slice(7).trim();
}

export async function requireAdmin(input: {
  runtime: AdminRuntimeEnv;
  authorizationHeader?: string | null;
  accessToken?: string;
}) {
  const allowed = parseAdminEmails(input.runtime.ADMIN_EMAILS);
  if (!allowed.size) {
    throw new AdminGuardError(500, "ADMIN_EMAILS not configured");
  }

  const token = String(input.accessToken || "").trim() || parseBearer(input.authorizationHeader);
  if (!token) {
    throw new AdminGuardError(401, "missing_access_token");
  }

  const auth = await supabaseAuthUser(input.runtime, token);
  if (!auth.ok || !auth.user) {
    throw new AdminGuardError(401, "invalid_access_token");
  }

  const email = String(auth.user.email || "").trim().toLowerCase();
  if (!allowed.has(email)) {
    throw new AdminGuardError(403, "admin_forbidden");
  }

  return {
    userId: auth.user.id,
    email,
  } as AdminIdentity;
}

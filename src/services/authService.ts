import type { UserSession, UserState } from "../types/account";
import {
  clearChallenge,
  createOrGetUserByEmail,
  createSessionForUser,
  getChallenge,
  getSession,
  getUser,
  saveChallenge,
  saveSession
} from "./mockAccountStore";

export type SendCodeResult = {
  ok: boolean;
  devCode: string;
  expiresAt: string;
};

export async function sendCode(email: string): Promise<SendCodeResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    throw new Error("invalid_email");
  }
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  saveChallenge(normalized, code, expiresAt);
  await wait(220);
  return {
    ok: true,
    devCode: code,
    expiresAt
  };
}

export async function verifyCode(email: string, code: string): Promise<{ session: UserSession; user: UserState }> {
  const normalized = email.trim().toLowerCase();
  const challenge = getChallenge(normalized);
  if (!challenge) throw new Error("missing_challenge");
  if (challenge.expiresAt < new Date().toISOString()) throw new Error("code_expired");
  if (challenge.code !== code.trim()) throw new Error("code_invalid");
  const user = createOrGetUserByEmail(normalized);
  const session = createSessionForUser(user);
  saveSession(session);
  clearChallenge(normalized);
  await wait(180);
  return { session, user };
}

export async function getCurrentSession(): Promise<UserSession | null> {
  await wait(60);
  return getSession();
}

export async function getCurrentUser(): Promise<UserState | null> {
  const session = getSession();
  if (!session) return null;
  await wait(60);
  return getUser(session.userId);
}

export async function logout(): Promise<void> {
  saveSession(null);
  await wait(60);
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const SESSION_COOKIE_NAME = "wert_session";
const IDLE_TIMEOUT_MINUTES = 30;
const MAX_SESSION_HOURS = 2;

/**
 * Compute SHA-256 hash of session token
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Create a new session in database and set HttpOnly cookie
 */
export async function createSession(userId: string, ipHash?: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const idHash = hashToken(token);
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + IDLE_TIMEOUT_MINUTES * 60 * 1000);
  const nowIso = now.toISOString();

  // Run session insert and user last_active_at update concurrently in parallel
  const [insertRes] = await Promise.all([
    supabaseAdmin.from("sessions").insert({
      id_hash: idHash,
      user_id: userId,
      expires_at: expiresAt.toISOString(),
      last_seen_at: nowIso,
      ip_hash: ipHash || null,
    }),
    supabaseAdmin
      .from("users")
      .update({ last_active_at: nowIso })
      .eq("id", userId),
  ]);

  if (insertRes.error) {
    throw new Error(`Gagal membuat sesi: ${insertRes.error.message}`);
  }

  // Set HttpOnly cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

/**
 * Validate current session from request cookie
 */
export async function getCurrentSession(): Promise<{
  userId: string;
  username: string;
  hasPin: boolean;
  autoDeleteEnabled: boolean;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const idHash = hashToken(token);
  const now = new Date().toISOString();

  // Query session joined with user
  const { data: session, error } = await supabaseAdmin
    .from("sessions")
    .select(`
      id_hash,
      user_id,
      expires_at,
      last_seen_at,
      users:user_id (
        id,
        username,
        pin_hash,
        auto_delete_enabled
      )
    `)
    .eq("id_hash", idHash)
    .gt("expires_at", now)
    .single();

  if (error || !session || !session.users) {
    return null;
  }

  const user = session.users as any;

  // Touch session (slide idle expiration by 30 mins) only if > 5 minutes have passed
  // This avoids a blocking write to the database on every rapid request (e.g. dashboard mount right after login)
  const lastSeenMs = session.last_seen_at ? new Date(session.last_seen_at).getTime() : 0;
  const fiveMinutesMs = 5 * 60 * 1000;
  if (Date.now() - lastSeenMs > fiveMinutesMs) {
    const newExpiresAt = new Date(Date.now() + IDLE_TIMEOUT_MINUTES * 60 * 1000);
    await supabaseAdmin
      .from("sessions")
      .update({
        expires_at: newExpiresAt.toISOString(),
        last_seen_at: now,
      })
      .eq("id_hash", idHash);

    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: newExpiresAt,
    });
  }

  return {
    userId: user.id,
    username: user.username,
    hasPin: !!user.pin_hash,
    autoDeleteEnabled: user.auto_delete_enabled,
  };
}

/**
 * Destroy current session and delete cookie
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (token) {
    const idHash = hashToken(token);
    await supabaseAdmin.from("sessions").delete().eq("id_hash", idHash);
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

import { hash, verify } from "@node-rs/argon2";

const PEPPER = process.env.PIN_PEPPER || "wert_default_insecure_pepper_must_change";

/**
 * Apply server-side pepper to PIN before hashing/verifying
 */
function pepperPin(pin: string): string {
  return `${pin}::${PEPPER}`;
}

/**
 * Hash a 4-digit PIN with Argon2id + pepper
 */
export async function hashPin(pin: string): Promise<string> {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error("PIN harus terdiri dari 4 angka numerik.");
  }
  return hash(pepperPin(pin));
}

/**
 * Verify a 4-digit PIN against Argon2id hash + pepper
 */
export async function verifyPin(pin: string, pinHash: string): Promise<boolean> {
  try {
    return await verify(pinHash, pepperPin(pin));
  } catch {
    return false;
  }
}

/**
 * Hash a recovery code (WERT-XXXX-XXXX)
 */
export async function hashRecoveryCode(code: string): Promise<string> {
  const cleanCode = code.trim().toUpperCase();
  return hash(`${cleanCode}::${PEPPER}`);
}

/**
 * Verify a recovery code against hash
 */
export async function verifyRecoveryCode(code: string, recoveryHash: string): Promise<boolean> {
  try {
    const cleanCode = code.trim().toUpperCase();
    return await verify(recoveryHash, `${cleanCode}::${PEPPER}`);
  } catch {
    return false;
  }
}

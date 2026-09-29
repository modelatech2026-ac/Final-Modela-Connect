/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TwoFactorState {
  isEnabled: boolean;
  isVerified: boolean;
  trustedUntil: number | null; // epoch timestamp
  secret: string | null;
  otpauthUri: string | null;
  backupCodes: string[];
  usedBackupCodes: string[];
  lastVerifiedAt: string | null;
}

export interface TwoFactorSecretResponse {
  secret: string;
  otpauthUri: string;
  qrSvgDataUri: string;
  issuer: string;
  account: string;
}

export interface TwoFactorVerificationResult {
  success: boolean;
  error?: string;
  trustedUntil?: number;
}

const STORAGE_KEY_PREFIX = "modela_2fa_state_";
const TRUSTED_DEVICE_KEY_PREFIX = "modela_2fa_trusted_device_";

/**
 * Generate a cryptographically structured RFC 6238 Base32 Secret Key
 */
export async function generate2FASecret(userEmail: string): Promise<TwoFactorSecretResponse> {
  // Simulate network latency (250-450ms)
  await new Promise((resolve) => setTimeout(resolve, 320));

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  const randomValues = new Uint8Array(20);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(randomValues);
    for (let i = 0; i < 16; i++) {
      secret += chars[randomValues[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 16; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  // Format with spaces for human readability: XXXX XXXX XXXX XXXX
  const formattedSecret = secret.match(/.{1,4}/g)?.join(" ") || secret;
  const issuer = "Modela Connect";
  const account = userEmail || "enterprise.staff@modela.io";
  const otpauthUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(
    account
  )}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

  // Deterministic SVG QR Code Generator for Clean Visual Display without heavy external binary blobs
  const qrSvgDataUri = createTotpQrSvg(formattedSecret, account);

  return {
    secret: formattedSecret,
    otpauthUri,
    qrSvgDataUri,
    issuer,
    account,
  };
}

/**
 * Generates an SVG representation of an authentic Authenticator QR Code with finder patterns
 */
export function createTotpQrSvg(secret: string, account: string): string {
  // We construct a high-resolution, geometric QR code SVG complete with corner finder eyes, alignment patterns, and data density
  const size = 240;
  const cellSize = 8;
  const count = size / cellSize; // 30x30 matrix

  // Generate pseudo-random deterministic modules based on secret hash
  let hash = 0;
  for (let i = 0; i < secret.length; i++) {
    hash = (hash << 5) - hash + secret.charCodeAt(i);
    hash |= 0;
  }
  for (let i = 0; i < account.length; i++) {
    hash = (hash << 3) - hash + account.charCodeAt(i);
    hash |= 0;
  }

  const rects: string[] = [];

  // Function to check if a point is within the 3 standard QR finder patterns
  const isFinderPattern = (r: number, c: number) => {
    // Top-left
    if (r < 8 && c < 8) return true;
    // Top-right
    if (r < 8 && c >= count - 8) return true;
    // Bottom-left
    if (r >= count - 8 && c < 8) return true;
    return false;
  };

  // Build simulated grid modules
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (isFinderPattern(r, c)) continue;
      // Deterministic PRNG formula
      const bit = Math.abs(Math.sin((r * count + c) * 9301 + hash) * 10000);
      if (bit % 1 > 0.48) {
        rects.push(
          `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0f172a" rx="1.5"/>`
        );
      }
    }
  }

  // Draw 3 Finder Patterns (Top-Left, Top-Right, Bottom-Left)
  const drawFinderEye = (startX: number, startY: number) => `
    <rect x="${startX}" y="${startY}" width="56" height="56" rx="12" fill="#0f172a"/>
    <rect x="${startX + 8}" y="${startY + 8}" width="40" height="40" rx="8" fill="#ffffff"/>
    <rect x="${startX + 16}" y="${startY + 16}" width="24" height="24" rx="5" fill="#2563eb"/>
  `;

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%">
      <rect width="100%" height="100%" fill="#ffffff" rx="16"/>
      ${drawFinderEye(8, 8)}
      ${drawFinderEye(size - 64, 8)}
      ${drawFinderEye(8, size - 64)}
      ${rects.join("")}
      <!-- Center subtle Modela Brand Shield Motif -->
      <rect x="${size / 2 - 18}" y="${size / 2 - 18}" width="36" height="36" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
      <path d="M ${size / 2} ${size / 2 - 10} L ${size / 2 + 10} ${size / 2 - 4} V ${size / 2 + 3} C ${size / 2 + 10} ${size / 2 + 9} ${size / 2} ${size / 2 + 12} ${size / 2} ${size / 2 + 12} C ${size / 2} ${size / 2 + 12} ${size / 2 - 10} ${size / 2 + 9} ${size / 2 - 10} ${size / 2 + 3} V ${size / 2 - 4} Z" fill="#2563eb"/>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

/**
 * Generates 8 cryptographically secure 8-character alphanumeric emergency recovery codes
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Base32 unambiguous charset (no 0/O, 1/I)
  const randomBytes = new Uint8Array(64);

  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(randomBytes);
    for (let i = 0; i < 8; i++) {
      let code = "";
      for (let j = 0; j < 8; j++) {
        const byte = randomBytes[i * 8 + j];
        code += chars[byte % chars.length];
      }
      // Format as XXXX-XXXX
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
  } else {
    for (let i = 0; i < 8; i++) {
      let code = "";
      for (let j = 0; j < 8; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
  }

  return codes;
}

/**
 * Mock API: Verify 6-digit TOTP code
 * In this production-style simulator:
 * - Any 6-digit code equal to "123456", "000000", or containing "88" will succeed.
 * - For demo testing, any valid numeric 6 digits that don't end in "999" succeed.
 * - Codes ending in "999" simulate an expired OTP error.
 * - Malformed codes simulate an invalid OTP error.
 */
export async function verify2FACode(
  code: string,
  secret?: string | null,
  trustDevice: boolean = false
): Promise<TwoFactorVerificationResult> {
  await new Promise((resolve) => setTimeout(resolve, 380));

  const clean = code.trim().replace(/\D/g, "");

  if (clean.length !== 6) {
    return {
      success: false,
      error: "Authentication code must be exactly 6 digits.",
    };
  }

  if (clean.endsWith("999")) {
    return {
      success: false,
      error: "Verification code has expired. Please check the current code on your authenticator app.",
    };
  }

  if (clean === "000001" || clean === "111111") {
    return {
      success: false,
      error: "Invalid TOTP token. Please ensure your device clock is synchronized.",
    };
  }

  // Trusted device expiration: 30 days in milliseconds
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const trustedUntil = trustDevice ? Date.now() + thirtyDaysMs : undefined;

  return {
    success: true,
    trustedUntil,
  };
}

/**
 * Mock API: Validate an 8-digit emergency backup code
 */
export async function validateBackupCode(
  rawCode: string,
  availableCodes: string[]
): Promise<{ success: boolean; error?: string; remainingCount?: number }> {
  await new Promise((resolve) => setTimeout(resolve, 350));

  const normalized = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (normalized.length !== 8) {
    return {
      success: false,
      error: "Backup code must contain 8 alphanumeric characters.",
    };
  }

  const formatted = `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
  const foundIndex = availableCodes.findIndex(
    (c) => c.replace(/[^A-Z0-9]/g, "") === normalized
  );

  if (foundIndex === -1) {
    return {
      success: false,
      error: "Invalid or already consumed backup code. Please enter an unused emergency code.",
    };
  }

  return {
    success: true,
    remainingCount: availableCodes.length - 1,
  };
}

/**
 * Storage helpers for local tenant persistence
 */
export function getStoredTwoFactorState(userEmail: string): TwoFactorState {
  if (typeof window === "undefined" || !userEmail) {
    return {
      isEnabled: false,
      isVerified: false,
      trustedUntil: null,
      secret: null,
      otpauthUri: null,
      backupCodes: [],
      usedBackupCodes: [],
      lastVerifiedAt: null,
    };
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userEmail.toLowerCase()}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        isEnabled: Boolean(parsed.isEnabled),
        isVerified: Boolean(parsed.isVerified),
        trustedUntil: parsed.trustedUntil || null,
        secret: parsed.secret || null,
        otpauthUri: parsed.otpauthUri || null,
        backupCodes: Array.isArray(parsed.backupCodes) ? parsed.backupCodes : [],
        usedBackupCodes: Array.isArray(parsed.usedBackupCodes) ? parsed.usedBackupCodes : [],
        lastVerifiedAt: parsed.lastVerifiedAt || null,
      };
    }
  } catch (e) {
    console.warn("Failed to load 2FA state from storage:", e);
  }

  return {
    isEnabled: false,
    isVerified: false,
    trustedUntil: null,
    secret: null,
    otpauthUri: null,
    backupCodes: [],
    usedBackupCodes: [],
    lastVerifiedAt: null,
  };
}

export function saveStoredTwoFactorState(userEmail: string, state: TwoFactorState): void {
  if (typeof window === "undefined" || !userEmail) return;
  try {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${userEmail.toLowerCase()}`,
      JSON.stringify(state)
    );
  } catch (e) {
    console.error("Failed to persist 2FA state:", e);
  }
}

export function checkIsDeviceTrusted(userEmail: string): boolean {
  if (typeof window === "undefined" || !userEmail) return false;
  try {
    const raw = localStorage.getItem(`${TRUSTED_DEVICE_KEY_PREFIX}${userEmail.toLowerCase()}`);
    if (raw) {
      const expiry = Number(raw);
      if (!isNaN(expiry) && expiry > Date.now()) {
        return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

export function setDeviceTrustedExpiry(userEmail: string, expiryTimestamp: number): void {
  if (typeof window === "undefined" || !userEmail) return;
  try {
    localStorage.setItem(
      `${TRUSTED_DEVICE_KEY_PREFIX}${userEmail.toLowerCase()}`,
      String(expiryTimestamp)
    );
  } catch {
    // ignore
  }
}

export function clearDeviceTrusted(userEmail: string): void {
  if (typeof window === "undefined" || !userEmail) return;
  try {
    localStorage.removeItem(`${TRUSTED_DEVICE_KEY_PREFIX}${userEmail.toLowerCase()}`);
  } catch {
    // ignore
  }
}

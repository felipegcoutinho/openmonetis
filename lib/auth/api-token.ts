/**
 * API Token utilities for OpenSheets Companion
 *
 * Handles JWT generation, validation, and token hashing for device authentication.
 */

import crypto from "crypto";

const JWT_SECRET = process.env.BETTER_AUTH_SECRET || "opensheets-secret-change-me";
const ACCESS_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds
const REFRESH_TOKEN_EXPIRY = 90 * 24 * 60 * 60; // 90 days in seconds

// ============================================================================
// TYPES
// ============================================================================

export interface JwtPayload {
  sub: string; // userId
  type: "api_access" | "api_refresh";
  tokenId: string;
  deviceId?: string;
  iat: number;
  exp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenId: string;
  expiresAt: Date;
}

// ============================================================================
// JWT UTILITIES
// ============================================================================

/**
 * Base64URL encode a string
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Base64URL decode a string
 */
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4;
  if (pad) {
    str += "=".repeat(4 - pad);
  }
  return Buffer.from(str, "base64").toString();
}

/**
 * Create HMAC-SHA256 signature
 */
function createSignature(data: string): string {
  return crypto
    .createHmac("sha256", JWT_SECRET)
    .update(data)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Create a JWT token
 */
export function createJwt(payload: Omit<JwtPayload, "iat" | "exp">, expiresIn: number): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);

  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = createSignature(`${headerEncoded}.${payloadEncoded}`);

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

/**
 * Verify and decode a JWT token
 * @returns The decoded payload or null if invalid
 */
export function verifyJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerEncoded, payloadEncoded, signature] = parts;
    const expectedSignature = createSignature(`${headerEncoded}.${payloadEncoded}`);

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: JwtPayload = JSON.parse(base64UrlDecode(payloadEncoded));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate a random token ID
 */
export function generateTokenId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a random API token with prefix
 */
export function generateApiToken(): string {
  const randomPart = crypto.randomBytes(32).toString("base64url");
  return `os_${randomPart}`;
}

/**
 * Hash a token using SHA-256
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Get the display prefix of a token (first 8 chars after prefix)
 */
export function getTokenPrefix(token: string): string {
  // Remove "os_" prefix and get first 8 chars
  const withoutPrefix = token.replace(/^os_/, "");
  return `os_${withoutPrefix.substring(0, 8)}...`;
}

/**
 * Generate a complete token pair (access + refresh)
 */
export function generateTokenPair(userId: string, deviceId?: string): TokenPair {
  const tokenId = generateTokenId();
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY * 1000);

  const accessToken = createJwt(
    { sub: userId, type: "api_access", tokenId, deviceId },
    ACCESS_TOKEN_EXPIRY
  );

  const refreshToken = createJwt(
    { sub: userId, type: "api_refresh", tokenId, deviceId },
    REFRESH_TOKEN_EXPIRY
  );

  return {
    accessToken,
    refreshToken,
    tokenId,
    expiresAt,
  };
}

/**
 * Refresh an access token using a refresh token
 */
export function refreshAccessToken(refreshToken: string): { accessToken: string; expiresAt: Date } | null {
  const payload = verifyJwt(refreshToken);

  if (!payload || payload.type !== "api_refresh") {
    return null;
  }

  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY * 1000);

  const accessToken = createJwt(
    { sub: payload.sub, type: "api_access", tokenId: payload.tokenId, deviceId: payload.deviceId },
    ACCESS_TOKEN_EXPIRY
  );

  return { accessToken, expiresAt };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Validate an API token and return the payload
 */
export function validateApiToken(token: string): JwtPayload | null {
  const payload = verifyJwt(token);
  if (!payload || payload.type !== "api_access") {
    return null;
  }
  return payload;
}

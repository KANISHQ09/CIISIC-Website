import { headers } from "next/headers";
import type { Role } from "@prisma/client";

// Only for local development without a .env. Never used in production (see getJwtSecret).
const DEV_FALLBACK_SECRET = "your-fallback-jwt-secret-key-32-chars-long";

/**
 * The key that signs login tokens. In production a real JWT_SECRET (32+ characters)
 * is required: the fallback above is public in the repository, so accepting it would
 * let anyone create their own admin token. Without it, sign-in fails loudly and every
 * token is rejected, rather than the site running insecurely.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is missing or shorter than 32 characters. Set it in the server environment.");
  }
  if (secret) return secret;
  return DEV_FALLBACK_SECRET;
}

// Web Crypto base64url helpers
function base64urlEncode(arr: Uint8Array): string {
  const binary = String.fromCharCode(...arr);
  return btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(str: string): Uint8Array {
  const binary = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Generate JWT token
export async function generateToken(payload: {
  id: string;
  email: string;
  role: Role;
  name: string;
  avatarUrl?: string | null;
}): Promise<string> {
  const encoder = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  
  // Set expiration to 7 days from now (in seconds)
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  const fullPayload = { ...payload, exp };

  const encodedHeader = base64urlEncode(encoder.encode(JSON.stringify(header)));
  const encodedPayload = base64urlEncode(encoder.encode(JSON.stringify(fullPayload)));
  
  const data = encoder.encode(`${encodedHeader}.${encodedPayload}`);
  const keyData = encoder.encode(getJwtSecret());
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, data);
  const encodedSignature = base64urlEncode(new Uint8Array(signature));
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

// Verify JWT token
export async function verifyToken(token: string): Promise<{
  id: string;
  email: string;
  role: Role;
  name: string;
  avatarUrl?: string | null;
  exp: number;
} | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const encoder = new TextEncoder();
    const data = encoder.encode(`${encodedHeader}.${encodedPayload}`);
    const keyData = encoder.encode(getJwtSecret());
    
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    const signatureBytes = base64urlDecode(encodedSignature);
    // Copy into a fresh ArrayBuffer-backed array, which is what WebCrypto expects
    const isValid = await crypto.subtle.verify("HMAC", key, new Uint8Array(signatureBytes), data);
    if (!isValid) return null;
    
    const decoder = new TextDecoder();
    const payloadJson = decoder.decode(base64urlDecode(encodedPayload));
    const payload = JSON.parse(payloadJson);
    
    // Validate expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

// Session data interface for type-safety
export interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    avatarUrl: string | null;
  };
}

// Fetch session using Authorization: Bearer header
export async function auth(): Promise<Session | null> {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    if (!payload) return null;
    
    return {
      user: {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        avatarUrl: payload.avatarUrl || null,
      },
    };
  } catch {
    return null;
  }
}

// Require a role validation wrapper
export async function requireRole(roles: Role[]): Promise<Session> {
  const session = await auth();
  if (!session) {
    throw new Error("Authentication required");
  }
  if (!roles.includes(session.user.role)) {
    throw new Error("Insufficient permissions");
  }
  return session;
}

import OAuth from "oauth-1.0a";
import crypto from "node:crypto";

export const DISCOGS_BASE = "https://api.discogs.com";
export const REQUEST_TOKEN_URL = `${DISCOGS_BASE}/oauth/request_token`;
export const AUTHORIZE_URL = "https://www.discogs.com/oauth/authorize";
export const ACCESS_TOKEN_URL = `${DISCOGS_BASE}/oauth/access_token`;
export const IDENTITY_URL = `${DISCOGS_BASE}/oauth/identity`;

export function getUserAgent(): string {
  return (
    process.env.DISCOGS_USER_AGENT ??
    "VinylAlbumDisplayRandomizer/0.1 +contact@example.com"
  );
}

export function getOAuth(): OAuth {
  const key = process.env.DISCOGS_CONSUMER_KEY;
  const secret = process.env.DISCOGS_CONSUMER_SECRET;
  if (!key || !secret) {
    throw new Error(
      "Missing DISCOGS_CONSUMER_KEY / DISCOGS_CONSUMER_SECRET env vars"
    );
  }
  return new OAuth({
    consumer: { key, secret },
    signature_method: "HMAC-SHA1",
    hash_function: (base_string, hashKey) =>
      crypto.createHmac("sha1", hashKey).update(base_string).digest("base64"),
  });
}

export function getCallbackUrl(): string {
  return (
    process.env.DISCOGS_CALLBACK_URL ??
    "http://localhost:3000/api/auth/callback"
  );
}

export function parseFormEncoded(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of body.split("&")) {
    const [k, v] = pair.split("=");
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
  }
  return out;
}

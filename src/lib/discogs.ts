import { getOAuth, getUserAgent, DISCOGS_BASE } from "@/lib/oauth";
import type { Release } from "@/types";

interface TokenPair {
  key: string;
  secret: string;
}

export async function signedFetch(
  url: string,
  method: "GET" | "POST",
  token: TokenPair
): Promise<Response> {
  const oauth = getOAuth();
  const auth = oauth.toHeader(
    oauth.authorize({ url, method }, { key: token.key, secret: token.secret })
  );
  return fetch(url, {
    method,
    headers: {
      ...auth,
      "User-Agent": getUserAgent(),
      Accept: "application/json",
    },
  });
}

export async function fetchIdentity(token: TokenPair): Promise<string> {
  const res = await signedFetch(`${DISCOGS_BASE}/oauth/identity`, "GET", token);
  if (!res.ok) {
    throw new Error(`Discogs identity fetch failed: ${res.status}`);
  }
  const body = (await res.json()) as { username: string };
  return body.username;
}

interface CollectionItem {
  id: number;
  date_added?: string;
  basic_information: {
    id: number;
    title: string;
    year: number;
    master_id?: number;
    artists?: { name: string }[];
    genres?: string[];
    styles?: string[];
    thumb?: string;
    cover_image?: string;
  };
}

interface CollectionPage {
  pagination: { page: number; pages: number };
  releases: CollectionItem[];
}

export async function fetchFullCollection(
  username: string,
  token: TokenPair
): Promise<Release[]> {
  const perPage = 100;
  const results: Release[] = [];
  let page = 1;
  let pages = 1;

  while (page <= pages) {
    const url = `${DISCOGS_BASE}/users/${encodeURIComponent(
      username
    )}/collection/folders/0/releases?per_page=${perPage}&page=${page}`;
    const res = await signedFetch(url, "GET", token);
    if (!res.ok) {
      throw new Error(`Collection fetch failed on page ${page}: ${res.status}`);
    }
    const body = (await res.json()) as CollectionPage;
    pages = body.pagination.pages;
    for (const item of body.releases) {
      const b = item.basic_information;
      results.push({
        id: b.id,
        title: b.title,
        artist: b.artists?.[0]?.name ?? "Unknown artist",
        year: b.year,
        masterId: b.master_id,
        genres: b.genres ?? [],
        styles: b.styles ?? [],
        thumb: b.thumb ?? "",
        coverImage: b.cover_image ?? b.thumb ?? "",
        dateAdded: item.date_added,
      });
    }
    page += 1;
  }

  return results;
}

export async function fetchReleaseDetails(
  id: number,
  token: TokenPair
): Promise<{ lowestPrice: number | null }> {
  const url = `${DISCOGS_BASE}/releases/${id}`;
  const res = await signedFetch(url, "GET", token);
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 60_000));
    const retry = await signedFetch(url, "GET", token);
    if (!retry.ok) return { lowestPrice: null };
    const body = (await retry.json()) as { lowest_price?: number | null };
    return { lowestPrice: body.lowest_price ?? null };
  }
  if (!res.ok) return { lowestPrice: null };
  const body = (await res.json()) as { lowest_price?: number | null };
  return { lowestPrice: body.lowest_price ?? null };
}

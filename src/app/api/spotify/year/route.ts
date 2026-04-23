import { NextResponse } from "next/server";

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET env vars");
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error(`Spotify token fetch failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const artist = searchParams.get("artist") ?? "";
  const title = searchParams.get("title") ?? "";

  if (!artist || !title) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  try {
    const token = await getAccessToken();

    const searchSpotify = async (q: string) => {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=album&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return null;
      const data = (await res.json()) as {
        albums?: { items?: { release_date?: string }[] };
      };
      const years = (data.albums?.items ?? [])
        .map((a) => (a.release_date ? parseInt(a.release_date.slice(0, 4), 10) : null))
        .filter((y): y is number => y !== null && y > 1900);
      return years.length > 0 ? Math.min(...years) : null;
    };

    // Try strict search first, fall back to broad search
    let year = await searchSpotify(`artist:${artist} album:${title}`);
    if (!year) year = await searchSpotify(`${artist} ${title}`);

    return NextResponse.json({ year });
  } catch {
    return NextResponse.json({ year: null });
  }
}

import { NextResponse } from "next/server";
import { getUserAgent } from "@/lib/oauth";

const ALLOWED_HOSTS = new Set([
  "i.discogs.com",
  "img.discogs.com",
  "s.discogs.com",
]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "missing_url" }, { status: 400 });
  }
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }
  if (!ALLOWED_HOSTS.has(parsed.host)) {
    return NextResponse.json({ error: "host_not_allowed" }, { status: 403 });
  }

  const upstream = await fetch(parsed.toString(), {
    headers: { "User-Agent": getUserAgent() },
  });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "upstream_failed", status: upstream.status },
      { status: 502 }
    );
  }

  const contentType =
    upstream.headers.get("content-type") ?? "application/octet-stream";
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

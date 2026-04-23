import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type AppSession } from "@/lib/session";
import { signedFetch } from "@/lib/discogs";
import { DISCOGS_BASE } from "@/lib/oauth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const session = await getIronSession<AppSession>(await cookies(), sessionOptions);
  if (!session.accessToken || !session.accessTokenSecret) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  try {
    const res = await signedFetch(
      `${DISCOGS_BASE}/masters/${numericId}`,
      "GET",
      { key: session.accessToken, secret: session.accessTokenSecret }
    );
    if (!res.ok) return NextResponse.json({ year: null });
    const body = (await res.json()) as { year?: number | null };
    return NextResponse.json({ year: body.year ?? null });
  } catch {
    return NextResponse.json({ year: null });
  }
}

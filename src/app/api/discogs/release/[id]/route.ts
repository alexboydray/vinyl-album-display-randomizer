import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type AppSession } from "@/lib/session";
import { fetchReleaseDetails } from "@/lib/discogs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const session = await getIronSession<AppSession>(
    await cookies(),
    sessionOptions
  );
  if (!session.accessToken || !session.accessTokenSecret) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  try {
    const details = await fetchReleaseDetails(numericId, {
      key: session.accessToken,
      secret: session.accessTokenSecret,
    });
    return NextResponse.json(details);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "release_fetch_failed", detail: msg },
      { status: 502 }
    );
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type AppSession } from "@/lib/session";
import { fetchFullCollection } from "@/lib/discogs";

export async function GET() {
  const session = await getIronSession<AppSession>(
    await cookies(),
    sessionOptions
  );
  if (
    !session.accessToken ||
    !session.accessTokenSecret ||
    !session.username
  ) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  try {
    const releases = await fetchFullCollection(session.username, {
      key: session.accessToken,
      secret: session.accessTokenSecret,
    });
    return NextResponse.json({ releases });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "collection_fetch_failed", detail: msg },
      { status: 502 }
    );
  }
}

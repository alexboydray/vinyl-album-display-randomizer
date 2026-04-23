import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type AppSession } from "@/lib/session";

export async function GET() {
  const session = await getIronSession<AppSession>(
    await cookies(),
    sessionOptions
  );
  if (!session.username || !session.accessToken) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  return NextResponse.json({
    authenticated: true,
    username: session.username,
  });
}

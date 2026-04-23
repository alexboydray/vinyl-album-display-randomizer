import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import {
  AUTHORIZE_URL,
  REQUEST_TOKEN_URL,
  getCallbackUrl,
  getOAuth,
  getUserAgent,
  parseFormEncoded,
} from "@/lib/oauth";
import { sessionOptions, type AppSession } from "@/lib/session";

export async function GET() {
  const oauth = getOAuth();
  const callback = getCallbackUrl();
  const request = {
    url: REQUEST_TOKEN_URL,
    method: "POST",
    data: { oauth_callback: callback },
  };
  const header = oauth.toHeader(oauth.authorize(request));

  let res = await fetch(REQUEST_TOKEN_URL, {
    method: "POST",
    headers: { Authorization: header.Authorization, "User-Agent": getUserAgent() },
  });

  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 10_000));
    res = await fetch(REQUEST_TOKEN_URL, {
      method: "POST",
      headers: { Authorization: header.Authorization, "User-Agent": getUserAgent() },
    });
  }

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "request_token_failed", detail: text },
      { status: 500 }
    );
  }

  const body = await res.text();
  const parsed = parseFormEncoded(body);
  const oauthToken = parsed["oauth_token"];
  const oauthTokenSecret = parsed["oauth_token_secret"];
  if (!oauthToken || !oauthTokenSecret) {
    return NextResponse.json(
      { error: "missing_request_token" },
      { status: 500 }
    );
  }

  const session = await getIronSession<AppSession>(
    await cookies(),
    sessionOptions
  );
  session.requestTokenSecret = oauthTokenSecret;
  await session.save();

  return NextResponse.redirect(`${AUTHORIZE_URL}?oauth_token=${oauthToken}`);
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import {
  ACCESS_TOKEN_URL,
  getOAuth,
  getUserAgent,
  parseFormEncoded,
} from "@/lib/oauth";
import { fetchIdentity } from "@/lib/discogs";
import { sessionOptions, type AppSession } from "@/lib/session";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const oauthToken = searchParams.get("oauth_token");
  const oauthVerifier = searchParams.get("oauth_verifier");

  if (!oauthToken || !oauthVerifier) {
    return NextResponse.json(
      { error: "missing_callback_params" },
      { status: 400 }
    );
  }

  const session = await getIronSession<AppSession>(
    await cookies(),
    sessionOptions
  );
  const requestTokenSecret = session.requestTokenSecret;
  if (!requestTokenSecret) {
    return NextResponse.json(
      { error: "missing_request_token_secret" },
      { status: 400 }
    );
  }

  const oauth = getOAuth();
  const header = oauth.toHeader(
    oauth.authorize(
      { url: ACCESS_TOKEN_URL, method: "POST", data: { oauth_verifier: oauthVerifier } },
      { key: oauthToken, secret: requestTokenSecret }
    )
  );

  const res = await fetch(ACCESS_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: header.Authorization,
      "User-Agent": getUserAgent(),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "access_token_failed", detail: text },
      { status: 500 }
    );
  }

  const body = await res.text();
  const parsed = parseFormEncoded(body);
  const accessToken = parsed["oauth_token"];
  const accessTokenSecret = parsed["oauth_token_secret"];
  if (!accessToken || !accessTokenSecret) {
    return NextResponse.json(
      { error: "missing_access_token" },
      { status: 500 }
    );
  }

  const username = await fetchIdentity({
    key: accessToken,
    secret: accessTokenSecret,
  });

  session.accessToken = accessToken;
  session.accessTokenSecret = accessTokenSecret;
  session.username = username;
  session.requestTokenSecret = undefined;
  await session.save();

  const origin = new URL(req.url).origin;
  return NextResponse.redirect(origin + "/");
}

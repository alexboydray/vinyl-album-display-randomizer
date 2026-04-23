import type { SessionOptions } from "iron-session";
import type { DiscogsSessionData } from "@/types";

export type AppSession = DiscogsSessionData;

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD ?? "",
  cookieName: "vadr_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
};

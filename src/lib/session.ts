import type { SessionOptions } from "iron-session";

export interface SessionData {
  isLoggedIn: boolean;
}

/** Auth is entirely optional — see middleware.ts. If APP_PASSWORD isn't set,
 * the app runs with no login gate at all (intended for private-network use). */
export const authEnabled = () => Boolean(process.env.APP_PASSWORD);

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? "",
  cookieName: "pdn_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

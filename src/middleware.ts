import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { authEnabled, sessionOptions, type SessionData } from "@/lib/session";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(request: NextRequest) {
  if (!authEnabled()) return NextResponse.next();

  const isPublic = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/api/login";
  if (isPublic) return NextResponse.next();

  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  if (!session.isLoggedIn) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

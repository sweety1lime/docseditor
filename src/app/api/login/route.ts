import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (!process.env.APP_PASSWORD || password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({ ok: true });
}

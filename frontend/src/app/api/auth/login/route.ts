import { NextResponse } from "next/server";
import crypto from "crypto";

function signSession(sid: string): string {
  const hmac = crypto.createHmac("sha256", process.env.AUTH_SECRET || "fallback-dev-only");
  hmac.update(sid);
  return `${sid}.${hmac.digest("hex")}`;
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.SYNAPSE_ACCESS_KEY;

    if (!correctPassword) {
      return NextResponse.json({ success: true });
    }

    if (password === correctPassword) {
      const sid = crypto.randomUUID();
      const response = NextResponse.json({ success: true });
      response.cookies.set({
        name: "synapse_session",
        value: signSession(sid),
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }

    return NextResponse.json({ success: false, error: "Incorrect access key" }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}

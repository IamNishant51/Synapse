import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

async function handleProxy(request: NextRequest, pathArray: string[]) {
  let backendUrl = process.env.COGNEE_API_URL || process.env.NEXT_PUBLIC_COGNEE_API_URL;
  if (!backendUrl && process.env.VERCEL_URL) {
    backendUrl = `https://${process.env.VERCEL_URL}/backend`;
  }
  if (!backendUrl) {
    backendUrl = "http://localhost:8000";
  }
  const path = pathArray.join("/");
  const url = new URL(`${backendUrl}/${path}`);
  url.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("cookie");
  headers.delete("authorization");
  headers.delete("set-cookie");

  // Forward the shared access key so the backend authenticates requests from the proxy
  const accessKey = process.env.SYNAPSE_ACCESS_KEY;
  if (accessKey) {
    headers.set("X-Synapse-Key", accessKey);
  }

  // Thread session user ID to backend for per-user data routing
  const session = await auth();
  if (session?.user?.id) {
    headers.set("X-User-Id", session.user.id);
  }

  try {
    const requestBody = request.method !== "GET" && request.method !== "HEAD" 
      ? await request.arrayBuffer() 
      : undefined;

    const res = await fetch(url.toString(), {
      method: request.method,
      headers,
      body: requestBody,
    });

    const data = await res.arrayBuffer();
    return new NextResponse(data, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Proxy error details:", error);
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return handleProxy(request, params.path);
}

export async function POST(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return handleProxy(request, params.path);
}

export async function PUT(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return handleProxy(request, params.path);
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return handleProxy(request, params.path);
}

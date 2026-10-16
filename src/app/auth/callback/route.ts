import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const destination = request.nextUrl.searchParams.get("next");
  const next = destination?.startsWith("/") && !destination.startsWith("//") ? destination : "/profile";
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, request.url));
    } catch { /* Fall through to the login page with a helpful configuration message. */ }
  }
  return NextResponse.redirect(new URL("/login?setup=1", request.url));
}

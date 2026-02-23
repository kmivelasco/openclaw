import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // If token exchange fails, redirect to login with error
      return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`);
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}

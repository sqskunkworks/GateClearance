import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  console.log('📧 Email confirmation request:', { token_hash: !!token_hash, type, origin });

  if (token_hash && type) {
    const supabase = await createClient();
    
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      console.log('✅ Email confirmed successfully');
      // Redirect to login page after successful confirmation
      return NextResponse.redirect(`${origin}/auth/login?confirmed=true`);
    }

    console.error('❌ Confirmation error:', error);
  }

  // Redirect to login with error if confirmation failed
  return NextResponse.redirect(`${origin}/auth/login?error=confirmation_failed`);
}
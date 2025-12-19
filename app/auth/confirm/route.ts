import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { EmailOtpType, VerifyOtpParams } from '@supabase/supabase-js';

const emailOtpTypes: EmailOtpType[] = ['signup', 'recovery', 'email_change', 'magiclink', 'invite'];

const isValidEmailOtpType = (value: string): value is EmailOtpType =>
  emailOtpTypes.includes(value as EmailOtpType);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  if (token_hash && type && isValidEmailOtpType(type)) {
    const supabase = await createClient();
    
    const emailType: EmailOtpType = type;

    const params: VerifyOtpParams = {
      type: emailType,
      token_hash,
    };

    const { error } = await supabase.auth.verifyOtp(params);

    if (!error) {

      return NextResponse.redirect(`${origin}/auth/login?confirmed=true`);
    }
  }
  return NextResponse.redirect(`${origin}/auth/login?error=confirmation_failed`);
}

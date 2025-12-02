import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  
  // Sign out from Supabase
  await supabase.auth.signOut();
  
  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  const supabase = await createClient();
  
  // Sign out from Supabase
  await supabase.auth.signOut();
  
  // Redirect to login
  return NextResponse.redirect(new URL('/auth/login', request.url));
}
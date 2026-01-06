import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // User is now authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check for existing application
        const { data: apps } = await supabase
          .from('applications')
          .select('id, status')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (apps && apps.length > 0) {
          const app = apps[0];
          
          if (app.status === 'draft') {
            // Continue existing draft
            return NextResponse.redirect(`${origin}/test-application/1?id=${app.id}`);
          } else if (app.status === 'submitted') {
            // Already submitted, show success page
            return NextResponse.redirect(`${origin}/test-application/success?id=${app.id}`);
          }
        }
        
        // No existing application, start new one
        return NextResponse.redirect(`${origin}/test-application/1`);
      }
    } else {
      console.error('Callback error:', error);
    }
  }

  // Something went wrong
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
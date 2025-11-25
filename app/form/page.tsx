import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FormClient from './FormClient';

export default async function FormPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/form');
  }

  return <FormClient user={user} />;
}


import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const getServiceSupabase = (): SupabaseClient => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const convertToDBDate = (formDate: string): string => {
  if (!formDate) return '';
  const [month, day, year] = formDate.split('-');
  return `${year}-${month}-${day}`;
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  

    const authSupabase = await createClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

  
    const updateData: {
      first_name: string;
      last_name: string;
      other_names: string | null;
      date_of_birth: string;
      gender: string;
      updated_at: string;
    } = {
      first_name: body.firstName,
      last_name: body.lastName,
      other_names: body.otherNames || null,
      date_of_birth: convertToDBDate(body.dateOfBirth), 
      gender: body.gender,
      updated_at: new Date().toISOString(),
    };

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: `Failed to update: ${error.message}` },
        { status: 500 }
      );
    }

   

    return NextResponse.json({
      success: true,
      message: 'Personal info saved',
    });

  } catch (error) {
    console.error('Failed to update personal info', error);

    return NextResponse.json(
      { error: 'Failed to update personal info' },
      { status: 500 }
    );
  }
}

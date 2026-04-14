import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const getServiceSupabase = (): SupabaseClient => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
};

const convertToDBDate = (formDate: string): string | null => {
  if (!formDate) return null;
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
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const updateData: Record<string, string | boolean | null> = {
      is_us_citizen: body.isUsCitizen === 'true' ? true : body.isUsCitizen === 'false' ? false : null,
      government_id_type: body.governmentIdType || null,
      government_id_number: body.governmentIdNumber || null,
      id_state: body.idState || null,
      id_expiration: body.idExpiration ? convertToDBDate(body.idExpiration) : null,

      additional_comments: body.additionalComments || null,
      updated_at: new Date().toISOString(),
    };

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: `Failed to update: ${error.message}` }, { status: 500 });

    return NextResponse.json({ success: true, message: 'Security info saved' });

  } catch (error) {
    console.error('Failed to update security info', error);
    return NextResponse.json({ error: 'Failed to update security info' }, { status: 500 });
  }
}
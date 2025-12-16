

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

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

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

   

    const updateData: any = {
      government_id_type: body.governmentIdType,
      government_id_number: body.governmentIdNumber,
      id_state: body.idState || null,
      id_expiration: convertToDBDate(body.idExpiration),
      digital_signature: body.digitalSignature || null,
      
      former_inmate: body.formerInmate === 'yes',
      on_probation_parole: body.onParole === 'yes',
      
      updated_at: new Date().toISOString(),
    };


    const { error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Update error:', error);
      return NextResponse.json(
        { error: `Failed to update: ${error.message}` },
        { status: 500 }
      );
    }

  

    return NextResponse.json({
      success: true,
      message: 'Security info saved',
    });

  } catch (error) {
    console.error('❌ Update security error:', error);
    return NextResponse.json(
      { error: 'Failed to update security info' },
      { status: 500 }
    );
  }
}
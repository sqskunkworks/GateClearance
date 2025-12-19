

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
      email: string;
      phone_number: string;
      company_or_organization: string;
      purpose_of_visit: string | null;
      updated_at: string;
    } = {
      email: body.email,
      phone_number: body.phoneNumber,
      company_or_organization: body.companyOrOrganization,
      purpose_of_visit: body.purposeOfVisit || null,
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
      message: 'Contact info saved',
    });

  } catch (error) {
    console.error('Failed to update contact info', error);

    return NextResponse.json(
      { error: 'Failed to update contact info' },
      { status: 500 }
    );
  }
}

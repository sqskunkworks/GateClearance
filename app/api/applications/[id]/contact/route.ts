

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

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
      email: body.email,
      phone_number: body.phoneNumber,
      company_or_organization: body.companyOrOrganization,
      purpose_of_visit: body.purposeOfVisit || null,
      updated_at: new Date().toISOString(),
    };

   

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

    return NextResponse.json(
      { error: 'Failed to update contact info' },
      { status: 500 }
    );
  }
}
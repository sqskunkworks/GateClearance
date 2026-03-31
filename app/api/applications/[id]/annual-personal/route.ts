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

    const updateData = {
      // Base personal fields (shared with short_gc)
      first_name: body.firstName || null,
      middle_initial: body.middleInitial || null,
      last_name: body.lastName || null,
      date_of_birth: convertToDBDate(body.dateOfBirth),
      gender: body.gender || null,

      // Annual_gc specific personal fields (CDCR 966 Section I)
      address_street: body.addressStreet || null,
      address_apt: body.addressApt || null,
      address_city: body.addressCity || null,
      address_state: body.addressState || null,
      address_zip: body.addressZip || null,
      phone_number: body.phoneNumber || null,
      cell_number: body.cellNumber || null,
      height: body.height || null,
      weight: body.weight || null,
      eye_color: body.eyeColor || null,
      hair_color: body.hairColor || null,
      occupation: body.occupation || null,
      special_skills: body.specialSkills || null,
      company_or_organization: body.organizationName || '',
      organization_address: body.organizationAddress || null,

      updated_at: new Date().toISOString(),
    };

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: `Failed to update: ${error.message}` }, { status: 500 });

    return NextResponse.json({ success: true, message: 'Personal details saved' });
  } catch (error) {
    console.error('Failed to update annual GC personal details', error);
    return NextResponse.json({ error: 'Failed to update personal details' }, { status: 500 });
  }
}
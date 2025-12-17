import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { DRAFT_PLACEHOLDERS } from '@/lib/constants';

export const runtime = 'nodejs';

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const convertToDBDate = (formDate: string): string => {
  if (!formDate) return '';
  const [month, day, year] = formDate.split('-');
  return `${year}-${month}-${day}`;
};

export async function POST(req: Request) {
  try {
    const authSupabase = await createClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { applicationId, ...formData } = body;

    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender'];
    const missing = requiredFields.filter(f => !formData[f]);

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const draftData = {
      id: applicationId,
      user_id: user.id,
      
      // Step 1: Personal info (real data)
      first_name: formData.firstName,
      last_name: formData.lastName,
      other_names: formData.otherNames || null,
      date_of_birth: convertToDBDate(formData.dateOfBirth),
      gender: formData.gender,
      
      // Step 2: Contact (placeholders - updated via PATCH in Step 2)
      email: DRAFT_PLACEHOLDERS.EMAIL,
      phone_number: DRAFT_PLACEHOLDERS.PHONE,
      company_or_organization: DRAFT_PLACEHOLDERS.COMPANY,
      purpose_of_visit: null,
      
      // Step 5: Security (placeholders - replaced on final submit)
      government_id_type: DRAFT_PLACEHOLDERS.GOV_ID_TYPE,
      government_id_number: DRAFT_PLACEHOLDERS.GOV_ID_NUMBER,
      
      authorization_type: 'gate_clearance',
      status: 'draft',
      
      visited_inmate: false,
      former_inmate: false,
      restricted_access: false,
      felony_conviction: false,
      on_probation_parole: false,
      pending_charges: false,
    };

    const { data, error } = await supabase
      .from('applications')
      .insert(draftData)
      .select()
      .single();

    if (error) {

      return NextResponse.json(
        { error: `Failed to create draft: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      applicationId: data.id,
      message: 'Draft created successfully',
    });

  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to create draft', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
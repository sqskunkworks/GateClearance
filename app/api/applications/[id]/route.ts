import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { DRAFT_PLACEHOLDERS, isPlaceholder } from '@/lib/constants';

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

const convertToFormDate = (dbDate: string | null): string => {
  if (!dbDate) return '';
  const [year, month, day] = dbDate.split('-');
  return `${month}-${day}-${year}`;
};

export async function GET(
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

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const isNewDraft = data.status === 'draft' && !data.submitted_at;

    const formData: Record<string, unknown> = {
      // Step 1: Personal
      firstName: data.first_name || '',
      middleName: data.middle_name || '',
      lastName: data.last_name || '',
      otherNames: data.other_names || '',
      dateOfBirth: convertToFormDate(data.date_of_birth),
      gender: data.gender || '',

      // Step 2: Contact (filter placeholders)
      email: isPlaceholder(data.email, DRAFT_PLACEHOLDERS.EMAIL) ? '' : data.email,
      phoneNumber: isPlaceholder(data.phone_number, DRAFT_PLACEHOLDERS.PHONE) ? '' : data.phone_number,
      companyOrOrganization: isPlaceholder(data.company_or_organization, DRAFT_PLACEHOLDERS.COMPANY) ? '' : data.company_or_organization,
      purposeOfVisit: data.purpose_of_visit || '',

      // Visit dates
      hasConfirmedDate: data.has_confirmed_date || '',
      visitDate1: convertToFormDate(data.visit_date_1),
      visitDate2: convertToFormDate(data.visit_date_2),
      visitDate3: convertToFormDate(data.visit_date_3),

      // Step 3: Experience (from JSONB)
      ...(data.impact_responses || {}),

      // Step 4: Rules (from JSONB)
      ...(data.rules_quiz_answers || {}),

      // Step 5: Security (filter placeholders)
      governmentIdType: isPlaceholder(data.government_id_number, DRAFT_PLACEHOLDERS.GOV_ID_NUMBER) ? '' : data.government_id_type,
      governmentIdNumber: isPlaceholder(data.government_id_number, DRAFT_PLACEHOLDERS.GOV_ID_NUMBER) ? '' : data.government_id_number,
      governmentIdNumberConfirm: isPlaceholder(data.government_id_number, DRAFT_PLACEHOLDERS.GOV_ID_NUMBER) ? '' : data.government_id_number,
      idState: data.id_state || '',
      idExpiration: convertToFormDate(data.id_expiration),
      digitalSignature: data.digital_signature || '',
      isUsCitizen: data.is_us_citizen === null ? '' : (data.is_us_citizen ? 'true' : 'false'),

      // Background questions (only for submitted applications)
      formerInmate: isNewDraft ? '' : (data.former_inmate ? 'yes' : 'no'),
      onParole: isNewDraft ? '' : (data.on_probation_parole ? 'yes' : 'no'),
    };

    return NextResponse.json({ draft: formData });

  } catch (error) {
    console.error('Failed to fetch draft', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { DRAFT_PLACEHOLDERS, isPlaceholder } from '@/lib/constants';

export const runtime = 'nodejs';

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

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

    // Transform to form format, filtering out placeholder values
    const formData: Record<string, any> = {
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      otherNames: data.other_names || '',
      dateOfBirth: convertToFormDate(data.date_of_birth),
      gender: data.gender || '',

      // Only include real contact data (filter placeholders)
      email: isPlaceholder(data.email, DRAFT_PLACEHOLDERS.EMAIL) ? '' : data.email,
      phoneNumber: isPlaceholder(data.phone_number, DRAFT_PLACEHOLDERS.PHONE) ? '' : data.phone_number,
      companyOrOrganization: isPlaceholder(data.company_or_organization, DRAFT_PLACEHOLDERS.COMPANY) ? '' : data.company_or_organization,
      purposeOfVisit: data.purpose_of_visit || '',

      // Experience data from JSONB
      ...(data.impact_responses || {}),

      // Rules data from JSONB
      ...(data.rules_quiz_answers || {}),

      // Only include real security data (filter placeholders)
      governmentIdType: isPlaceholder(data.government_id_number, DRAFT_PLACEHOLDERS.GOV_ID_NUMBER) ? '' : data.government_id_type,
      governmentIdNumber: isPlaceholder(data.government_id_number, DRAFT_PLACEHOLDERS.GOV_ID_NUMBER) ? '' : data.government_id_number,
      governmentIdNumberConfirm: isPlaceholder(data.government_id_number, DRAFT_PLACEHOLDERS.GOV_ID_NUMBER) ? '' : data.government_id_number,
      idState: data.id_state || '',
      idExpiration: convertToFormDate(data.id_expiration),
      digitalSignature: data.digital_signature || '',
      
      // Background questions (only for submitted applications)
      formerInmate: isNewDraft ? '' : (data.former_inmate ? 'yes' : 'no'),
      onParole: isNewDraft ? '' : (data.on_probation_parole ? 'yes' : 'no'),
    };

    return NextResponse.json({ draft: formData });

  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}
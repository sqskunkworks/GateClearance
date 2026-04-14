import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { DRAFT_PLACEHOLDERS } from '@/lib/constants';

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

const VALID_APPLICATION_TYPES = ['short_gc', 'annual_gc', 'brown_card'] as const;
type ApplicationType = typeof VALID_APPLICATION_TYPES[number];

// Derive escort_required from application_type.
// GC and short_gc: escort always required.
// BC (brown_card): no escort required.
const deriveEscortRequired = (applicationType: string): boolean => {
  return applicationType !== 'brown_card';
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

    // Read application_type from body, validate against enum, fall back to short_gc
    const rawType = formData.applicationType ?? 'short_gc';
    const applicationType: ApplicationType = VALID_APPLICATION_TYPES.includes(rawType as ApplicationType)
      ? (rawType as ApplicationType)
      : 'short_gc';

    // Derive escort_required at creation time — never from user input
    const escortRequired = deriveEscortRequired(applicationType);

    const draftData = {
      id: applicationId,
      user_id: user.id,

      // Set application_type from URL/body — never hardcoded
      application_type: applicationType,

      // ✅ GC/BC derived field set at creation
      escort_required: escortRequired,

      // Step 1: Personal info (real data)
      first_name: formData.firstName,
      middle_name: formData.middleName || null,
      last_name: formData.lastName,
      other_names: formData.otherNames || null,
      date_of_birth: convertToDBDate(formData.dateOfBirth),
      gender: formData.gender,

      // Step 2: Contact (placeholders — replaced on step 2 PATCH)
      email: DRAFT_PLACEHOLDERS.EMAIL,
      phone_number: DRAFT_PLACEHOLDERS.PHONE,
      company_or_organization: DRAFT_PLACEHOLDERS.COMPANY,
      purpose_of_visit: null,

      // Step 5: Security (placeholders — replaced on final submit)
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

    const supabase = getServiceSupabase();
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
      applicationType,
      escortRequired,
      message: 'Draft created successfully',
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create draft', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
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

const boolToYesNo = (val: boolean | null): string => {
  if (val === null || val === undefined) return '';
  return val ? 'yes' : 'no';
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
      // ── Application metadata ───────────────────────────────────
      applicationType: data.application_type || 'short_gc',
      // ✅ GC/BC derived field — returned so client can show correct UI labels
      escortRequired: data.escort_required ?? true,

      // ── SHORT GC: Step 1 Personal ─────────────────────────────
      firstName: data.first_name || '',
      middleName: data.middle_name || '',
      lastName: data.last_name || '',
      otherNames: data.other_names || '',
      dateOfBirth: convertToFormDate(data.date_of_birth),
      gender: data.gender || '',

      // ── SHORT GC: Step 2 Contact (filter placeholders) ────────
      email: isPlaceholder(data.email, DRAFT_PLACEHOLDERS.EMAIL) ? '' : data.email,
      phoneNumber: isPlaceholder(data.phone_number, DRAFT_PLACEHOLDERS.PHONE) ? '' : data.phone_number,
      companyOrOrganization: isPlaceholder(data.company_or_organization, DRAFT_PLACEHOLDERS.COMPANY) ? '' : data.company_or_organization,
      purposeOfVisit: data.purpose_of_visit || '',

      // Visit dates
      hasConfirmedDate: data.has_confirmed_date || '',
      visitDate1: convertToFormDate(data.visit_date_1),
      visitDate2: convertToFormDate(data.visit_date_2),
      visitDate3: convertToFormDate(data.visit_date_3),

      // ── SHORT GC: Step 3 Experience (from JSONB) ──────────────
      ...(data.impact_responses || {}),

      // ── SHORT GC: Step 4 Rules (from JSONB) ───────────────────
      ...(data.rules_quiz_answers || {}),

      // ── SHORT GC: Step 5 Security (filter placeholders) ───────
      governmentIdType: isPlaceholder(data.government_id_number, DRAFT_PLACEHOLDERS.GOV_ID_NUMBER) ? '' : data.government_id_type,
      governmentIdNumber: isPlaceholder(data.government_id_number, DRAFT_PLACEHOLDERS.GOV_ID_NUMBER) ? '' : data.government_id_number,
      governmentIdNumberConfirm: isPlaceholder(data.government_id_number, DRAFT_PLACEHOLDERS.GOV_ID_NUMBER) ? '' : data.government_id_number,
      idState: data.id_state || '',
      idExpiration: convertToFormDate(data.id_expiration),
      digitalSignature: data.digital_signature || '',
      isUsCitizen: data.is_us_citizen === null ? '' : (data.is_us_citizen ? 'true' : 'false'),
      additionalComments: data.additional_comments || '',
      formerInmate: isNewDraft ? '' : (data.former_inmate ? 'yes' : 'no'),
      onParole: isNewDraft ? '' : (data.on_probation_parole ? 'yes' : 'no'),

      // ── ANNUAL GC: Step 1 Cover sheet ─────────────────────────
      ppName: data.pp_name || '',
      contactNumber: isPlaceholder(data.phone_number, DRAFT_PLACEHOLDERS.PHONE) ? '' : data.phone_number,
      birthday: convertToFormDate(data.birthday),
      programName: data.program_name || '',
      isRenewal: data.is_renewal === null ? '' : (data.is_renewal ? 'renewal' : 'new'),
      ppFacilitator: data.pp_facilitator || '',

      // ── ANNUAL GC: Step 2 Personal details (CDCR 966) ─────────
      middleInitial: data.middle_initial || '',
      cellNumber: data.cell_number || '',
      addressStreet: data.address_street || '',
      addressApt: data.address_apt || '',
      addressCity: data.address_city || '',
      addressState: data.address_state || '',
      addressZip: data.address_zip || '',
      height: data.height || '',
      weight: data.weight || '',
      eyeColor: data.eye_color || '',
      hairColor: data.hair_color || '',
      occupation: data.occupation || '',
      specialSkills: data.special_skills || '',
      organizationName: isPlaceholder(data.company_or_organization, DRAFT_PLACEHOLDERS.COMPANY) ? '' : data.company_or_organization,
      organizationAddress: data.organization_address || '',

      // ── ANNUAL GC: Step 3 Background questions (CDCR 966 Q1-Q7)
      q1LiveScan: boolToYesNo(data.q1_live_scan),
      q1LiveScanDetails: data.q1_live_scan_details || '',
      q2OtherCdcr: boolToYesNo(data.q2_other_cdcr),
      q2OtherCdcrDetails: data.q2_other_cdcr_details || '',
      q3VisitInmates: boolToYesNo(data.q3_visit_inmates),
      q3VisitInmatesDetails: data.q3_visit_inmates_details || '',
      q4RelatedToInmate: boolToYesNo(data.q4_related_to_inmate),
      q4RelatedDetails: data.q4_related_details || '',
      q5ArrestedConvicted: boolToYesNo(data.q5_arrested_convicted),
      criminalHistory: data.criminal_history || '',
      q6OnParole: boolToYesNo(data.q6_on_parole),
      q6ParoleDetails: data.q6_parole_details || '',
      q7Discharged: boolToYesNo(data.q7_discharged),
      q7DischargeDetails: data.q7_discharge_details || '',

      // ── ANNUAL GC: Step 4 Emergency contacts (CDCR 894) ───────
      ssnLast4: data.ssn_last4 || '',
      ec1Name: data.ec1_name || '',
      ec1Relationship: data.ec1_relationship || '',
      ec1Address: data.ec1_address || '',
      ec1HomePhone: data.ec1_home_phone || '',
      ec1WorkPhone: data.ec1_work_phone || '',
      ec1CellPhone: data.ec1_cell_phone || '',
      ec2Name: data.ec2_name || '',
      ec2Relationship: data.ec2_relationship || '',
      ec2Address: data.ec2_address || '',
      ec2HomePhone: data.ec2_home_phone || '',
      ec2WorkPhone: data.ec2_work_phone || '',
      ec2CellPhone: data.ec2_cell_phone || '',
      physicianName: data.physician_name || '',
      physicianPhone: data.physician_phone || '',
      medicalPlanName: data.medical_plan_name || '',
      medicalPlanCardNumber: data.medical_plan_card_number || '',
      medicalFacility: data.medical_facility || '',
      specialConditions: data.special_conditions || '',
      specialInstructions: data.special_instructions || '',

      // ── ANNUAL GC: Step 5 Acknowledgment ──────────────────────
      certificationAgreement: data.certification_agreement || false,
      reasonableAccommodationAck: data.reasonable_accommodation_ack || false,
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
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { validateFullAnnualApplication } from '@/lib/validation/annualGCSchema';
import { uploadPDFToDrive } from '@/lib/googleDrive';

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

export async function POST(req: Request) {
  try {
    const authSupabase = await createClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const applicationId = formData.get('applicationId') as string;
    if (!applicationId) return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });

    const supabase = getServiceSupabase();
    const { data: application, error: loadError } = await supabase
      .from('applications').select('*').eq('id', applicationId).eq('user_id', user.id).single();

    if (loadError || !application) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Build formDataObj from FormData
    const formDataObj: Record<string, string | boolean | File> = {};
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) formDataObj[key] = value;
      else formDataObj[key] = value;
    }

    const getString = (key: string) => {
      const v = formDataObj[key];
      return typeof v === 'string' ? v : '';
    };

    // Server-side validation
    const validationResult = validateFullAnnualApplication(formDataObj);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', allErrors: validationResult.errors },
        { status: 400 }
      );
    }

    // Update all annual_gc fields on final submit
    const updateData: Record<string, string | boolean | null> = {
      // Cover sheet
      pp_name: getString('ppName') || null,
      program_name: getString('programName') || null,
      is_renewal: getString('isRenewal') === 'renewal',
      birthday: convertToDBDate(getString('birthday')),
      phone_number: getString('contactNumber') || null,
      email: getString('email') || null,

      // Personal (CDCR 966 Section I)
      first_name: getString('firstName'),
      middle_initial: getString('middleInitial') || null,
      last_name: getString('lastName'),
      date_of_birth: convertToDBDate(getString('dateOfBirth')),
      gender: getString('gender'),
      address_street: getString('addressStreet'),
      address_apt: getString('addressApt') || null,
      address_city: getString('addressCity'),
      address_state: getString('addressState'),
      address_zip: getString('addressZip'),
      cell_number: getString('cellNumber') || null,
      height: getString('height') || null,
      weight: getString('weight') || null,
      eye_color: getString('eyeColor') || null,
      hair_color: getString('hairColor') || null,
      occupation: getString('occupation') || null,
      special_skills: getString('specialSkills') || null,
      company_or_organization: getString('organizationName') || '',
      organization_address: getString('organizationAddress') || null,

      // Background questions
      q1_live_scan: getString('q1LiveScan') === 'yes',
      q1_live_scan_details: getString('q1LiveScanDetails') || null,
      q2_other_cdcr: getString('q2OtherCdcr') === 'yes',
      q2_other_cdcr_details: getString('q2OtherCdcrDetails') || null,
      q3_visit_inmates: getString('q3VisitInmates') === 'yes',
      q3_visit_inmates_details: getString('q3VisitInmatesDetails') || null,
      q4_related_to_inmate: getString('q4RelatedToInmate') === 'yes',
      q4_related_details: getString('q4RelatedDetails') || null,
      q5_arrested_convicted: getString('q5ArrestedConvicted') === 'yes',
      q6_on_parole: getString('q6OnParole') === 'yes',
      q6_parole_details: getString('q6ParoleDetails') || null,
      q7_discharged: getString('q7Discharged') === 'yes',
      q7_discharge_details: getString('q7DischargeDetails') || null,

      // Emergency contacts
      ssn_last4: getString('ssnLast4') || null,
      ec1_name: getString('ec1Name') || null,
      ec1_relationship: getString('ec1Relationship') || null,
      ec1_address: getString('ec1Address') || null,
      ec1_home_phone: getString('ec1HomePhone') || null,
      ec1_work_phone: getString('ec1WorkPhone') || null,
      ec1_cell_phone: getString('ec1CellPhone') || null,
      ec2_name: getString('ec2Name') || null,
      ec2_relationship: getString('ec2Relationship') || null,
      ec2_address: getString('ec2Address') || null,
      ec2_home_phone: getString('ec2HomePhone') || null,
      ec2_work_phone: getString('ec2WorkPhone') || null,
      ec2_cell_phone: getString('ec2CellPhone') || null,
      physician_name: getString('physicianName') || null,
      physician_phone: getString('physicianPhone') || null,
      medical_plan_name: getString('medicalPlanName') || null,
      medical_plan_card_number: getString('medicalPlanCardNumber') || null,
      medical_facility: getString('medicalFacility') || null,
      special_conditions: getString('specialConditions') || null,
      special_instructions: getString('specialInstructions') || null,

      // Acknowledgment + signature
      certification_agreement: true,
      reasonable_accommodation_ack: true,
      digital_signature: getString('digitalSignature'),

      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('applications').update(updateData).eq('id', applicationId).eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: `Failed to submit: ${updateError.message}` }, { status: 500 });
    }

    // Upload warden letter if discharged (Q7)
    const wardenLetterFile = formData.get('wardenLetter');
    if (getString('q7Discharged') === 'yes' && wardenLetterFile instanceof File) {
      try {
        const buffer = Buffer.from(await wardenLetterFile.arrayBuffer());
        const ext = wardenLetterFile.type.includes('pdf') ? 'pdf' : 'jpg';
        const fn = `${getString('firstName').replace(/[^a-zA-Z]/g, '')}_${getString('lastName').replace(/[^a-zA-Z]/g, '')}_warden_letter.${ext}`;
        await uploadPDFToDrive(buffer, fn);
        await supabase.from('documents').insert({
          application_id: applicationId, filename: fn, url: ' ',
          mime_type: wardenLetterFile.type, size_bytes: buffer.length, uploaded_by_user_id: user.id,
        });
      } catch (e) {
        console.error('Warden letter upload failed:', e);
      }
    }

    return NextResponse.json({ success: true, message: 'Annual GC application submitted', applicationId });

  } catch (error) {
    console.error('Annual GC submit failed:', error);
    return NextResponse.json({ error: 'Failed to submit application', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}
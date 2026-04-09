import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { validateFullApplication } from '@/lib/validation/applicationSchema';
import { loadBlank2311, fill2311, type AppRecord } from '@/lib/pdf2311';
import { uploadPDFToDrive } from '@/lib/googleDrive';
import { DRAFT_PLACEHOLDERS, isPlaceholder } from '@/lib/constants';
import { generateSummaryPDF } from '@/lib/generateSummaryPDF';
import { sendApplicationNotification } from '@/lib/email';

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

const deriveEscortRequired = (applicationType: string): boolean =>
  applicationType !== 'brown_card';

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

    if (loadError || !application) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    const applicationType = application.application_type || 'short_gc';
    const escortRequired = deriveEscortRequired(applicationType);

    type FormValue = string | boolean | File;
    const formDataObj: Record<string, FormValue> = {};
    const booleanFields = ['acknowledgmentAgreement', 'confirmAccuracy', 'consentToDataUse'];

    const getString = (key: keyof typeof formDataObj) => {
      const value = formDataObj[key];
      return typeof value === 'string' ? value : '';
    };

    const toGender = (value: string): AppRecord['gender'] => {
      if (['male','female','nonbinary','prefer_not_to_say','other'].includes(value)) return value as AppRecord['gender'];
      return undefined;
    };

    const toGovIdType = (value: string): AppRecord['gov_id_type'] => {
      if (value === 'driver_license' || value === 'passport') return value;
      return undefined;
    };

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) formDataObj[key] = value;
      else formDataObj[key] = booleanFields.includes(key) ? value === 'true' : value;
    }

    const dataForValidation = { applicationId, applicationType, ...formDataObj };
    const validationResult = validateFullApplication(dataForValidation);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Validation failed', allErrors: validationResult.errors }, { status: 400 });
    }

    const governmentIdNumber = getString('governmentIdNumber');
    const email = getString('email');
    const phoneNumber = getString('phoneNumber');

    if (
      isPlaceholder(governmentIdNumber, DRAFT_PLACEHOLDERS.GOV_ID_NUMBER) ||
      isPlaceholder(email, DRAFT_PLACEHOLDERS.EMAIL) ||
      isPlaceholder(phoneNumber, DRAFT_PLACEHOLDERS.PHONE)
    ) {
      return NextResponse.json({ error: 'Please complete all required fields before submitting' }, { status: 400 });
    }

    const governmentIdType = getString('governmentIdType');

    const updateData: Record<string, string | boolean | null | undefined> = {
      first_name: getString('firstName'),
      middle_name: getString('middleName') || null,
      last_name: getString('lastName'),
      other_names: getString('otherNames') || null,
      date_of_birth: convertToDBDate(getString('dateOfBirth')),
      gender: getString('gender'),
      email,
      phone_number: phoneNumber,
      company_or_organization: getString('companyOrOrganization'),
      purpose_of_visit: getString('purposeOfVisit') || null,
      has_confirmed_date: getString('hasConfirmedDate') || null,
      visit_date_1: convertToDBDate(getString('visitDate1')),
      visit_date_2: convertToDBDate(getString('visitDate2')),
      visit_date_3: convertToDBDate(getString('visitDate3')),
      government_id_type: governmentIdType,
      government_id_number: governmentIdNumber,

      // ✅ FIX: Only persist id_state for driver_license submissions.
      // If a user entered a state for driver_license then switched to passport,
      // the hidden field value lingers in form state. Nulling it out here
      // ensures stale idState never contaminates passport submissions.
      id_state: governmentIdType === 'driver_license' ? getString('idState') || null : null,

      id_expiration: convertToDBDate(getString('idExpiration')),
      digital_signature: getString('digitalSignature'),
      is_us_citizen: getString('isUsCitizen') === 'true',
      former_inmate: getString('formerInmate') === 'yes',
      on_probation_parole: getString('onParole') === 'yes',
      additional_comments: getString('additionalComments') || null,
      escort_required: escortRequired,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('applications').update(updateData).eq('id', applicationId).eq('user_id', user.id);

    if (updateError) return NextResponse.json({ error: `Failed to submit: ${updateError.message}` }, { status: 500 });

    const pdfRecord: AppRecord = {
      first_name: getString('firstName'),
      middle_name: getString('middleName'),
      last_name: getString('lastName'),
      other_names: getString('otherNames'),
      date_of_birth: getString('dateOfBirth'),
      phone_number: phoneNumber,
      email,
      company: getString('companyOrOrganization'),
      purpose_of_visit: getString('purposeOfVisit'),
      gender: toGender(getString('gender')),
      gov_id_type: toGovIdType(governmentIdType),
      gov_id_number: governmentIdNumber,
      id_state: getString('idState'),
      id_expiration: getString('idExpiration'),
      signature_data_url: getString('digitalSignature'),
      visited_inmate: false,
      former_inmate: getString('formerInmate') === 'yes',
      restricted_access: false,
      felony_conviction: false,
      on_probation_parole: getString('onParole') === 'yes',
      pending_charges: false,
      ssn_full: getString('ssnFull') || getString('ssnFirstFive') || undefined,
    };

    // ── 1. Generate and upload CDCR 2311 PDF ────────────────────
    try {
      const pdfDoc = await loadBlank2311();
      const filledPdf = await fill2311(pdfDoc, pdfRecord);
      const bytes = await filledPdf.save();
      if (!bytes || bytes.length === 0) throw new Error('PDF generation returned empty buffer');
      const firstName = getString('firstName').replace(/[^a-zA-Z]/g, '');
      const lastName = getString('lastName').replace(/[^a-zA-Z]/g, '');
      const filename = `${firstName}_${lastName}_2311.pdf`;
      await uploadPDFToDrive(Buffer.from(bytes), filename);
      await supabase.from('documents').insert({ application_id: applicationId, filename, url: ' ', mime_type: 'application/pdf', size_bytes: bytes.length, uploaded_by_user_id: user.id });
      console.log('✓ CDCR 2311 PDF uploaded successfully');
    } catch (pdfError: unknown) {
      console.error('PDF generation failed:', pdfError);
      throw new Error(`Failed to generate PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
    }

    // ── 2. Generate and upload Summary PDF ──────────────────────
    try {
      const summaryData = {
        firstName: getString('firstName'), middleName: getString('middleName'),
        lastName: getString('lastName'), otherNames: getString('otherNames'),
        dateOfBirth: getString('dateOfBirth'), gender: getString('gender'),
        email: getString('email'), phoneNumber: getString('phoneNumber'),
        visitDate: getString('visitDate1') || getString('visitDate') || getString('preferredVisitDate'),
        companyOrOrganization: getString('companyOrOrganization'),
        purposeOfVisit: getString('purposeOfVisit'),
        engagedDirectly: getString('engagedDirectly'), perceptions: getString('perceptions'),
        expectations: getString('expectations'), justiceReformBefore: getString('justiceReformBefore'),
        interestsMost: getString('interestsMost'), reformFuture: getString('reformFuture'),
        additionalNotes: getString('additionalNotes'),
        governmentIdType: getString('governmentIdType'), idState: getString('idState'),
        idExpiration: getString('idExpiration'), ssnMethod: getString('ssnMethod'),
        ssnFirstFive: getString('ssnFirstFive'), formerInmate: getString('formerInmate'),
        onParole: getString('onParole'), isUsCitizen: getString('isUsCitizen'),
        passportScan: formData.get('passportScan') as File | undefined,
        wardenLetter: formData.get('wardenLetter') as File | undefined,
        additionalComments: getString('additionalComments'),
        applicationId, submittedAt: new Date().toISOString(),
      };
      const summaryPdfBytes = await generateSummaryPDF(summaryData);
      const firstName = getString('firstName').replace(/[^a-zA-Z]/g, '');
      const lastName = getString('lastName').replace(/[^a-zA-Z]/g, '');
      const summaryFilename = `${firstName}_${lastName}_additional_info.pdf`;
      await uploadPDFToDrive(Buffer.from(summaryPdfBytes), summaryFilename);
      await supabase.from('documents').insert({ application_id: applicationId, filename: summaryFilename, url: ' ', mime_type: 'application/pdf', size_bytes: summaryPdfBytes.length, uploaded_by_user_id: user.id });
      console.log('✓ Summary PDF uploaded successfully');
    } catch (summaryError: unknown) {
      console.error('Summary PDF generation failed:', summaryError);
    }

    // ── 3. Upload passport scan if applicable ───────────────────
    const passportScanFile = formData.get('passportScan');
    const isNonUsCitizen = application.is_us_citizen === false;
    const isPassportId = governmentIdType === 'passport';
    if (isNonUsCitizen || isPassportId) {
      if (!passportScanFile || !(passportScanFile instanceof File)) {
        return NextResponse.json({ error: isNonUsCitizen ? 'Passport scan is required for non-US citizens' : 'Passport scan is required when using passport as ID' }, { status: 400 });
      }
      try {
        const passportBuffer = Buffer.from(await passportScanFile.arrayBuffer());
        if (!passportBuffer || passportBuffer.length === 0) throw new Error('Passport file is empty');
        let extension = 'pdf';
        if (passportScanFile.type === 'image/jpeg' || passportScanFile.type === 'image/jpg') extension = 'jpg';
        else if (passportScanFile.type === 'image/png') extension = 'png';
        const firstName = getString('firstName').replace(/[^a-zA-Z]/g, '');
        const lastName = getString('lastName').replace(/[^a-zA-Z]/g, '');
        const passportFilename = `${firstName}_${lastName}_passport.${extension}`;
        await uploadPDFToDrive(passportBuffer, passportFilename);
        await supabase.from('documents').insert({ application_id: applicationId, filename: passportFilename, url: ' ', mime_type: passportScanFile.type, size_bytes: passportBuffer.length, uploaded_by_user_id: user.id });
        console.log('✓ Passport scan uploaded successfully');
      } catch (passportError: unknown) {
        return NextResponse.json({ error: 'Failed to upload passport scan', details: passportError instanceof Error ? passportError.message : 'Unknown error' }, { status: 500 });
      }
    }

    // ── 4. Upload clearance letter if on parole ──────────────────
    const wardenLetterFile = formData.get('wardenLetter');
    if (getString('onParole') === 'yes') {
      if (!wardenLetterFile || !(wardenLetterFile instanceof File)) {
        return NextResponse.json({ error: 'Clearance letter is required for applicants on parole or probation' }, { status: 400 });
      }
      try {
        const wardenBuffer = Buffer.from(await wardenLetterFile.arrayBuffer());
        if (!wardenBuffer || wardenBuffer.length === 0) throw new Error('Clearance letter file is empty');
        const extension = wardenLetterFile.type.includes('pdf') ? 'pdf' : 'jpg';
        const firstName = getString('firstName').replace(/[^a-zA-Z]/g, '');
        const lastName = getString('lastName').replace(/[^a-zA-Z]/g, '');
        const wardenFilename = `${firstName}_${lastName}_clearance_letter.${extension}`;
        await uploadPDFToDrive(wardenBuffer, wardenFilename);
        await supabase.from('documents').insert({ application_id: applicationId, filename: wardenFilename, url: ' ', mime_type: wardenLetterFile.type, size_bytes: wardenBuffer.length, uploaded_by_user_id: user.id });
        console.log('✓ Clearance letter uploaded successfully');
      } catch (wardenError: unknown) {
        console.error('Clearance letter upload failed:', wardenError);
        return NextResponse.json({ error: 'Failed to upload clearance letter', details: wardenError instanceof Error ? wardenError.message : 'Unknown error' }, { status: 500 });
      }
    }

    // ── 5. Send email notification ───────────────────────────────
    try {
      const applicantName = [getString('firstName'), getString('middleName'), getString('lastName')].filter(Boolean).join(' ');
      await sendApplicationNotification({
        applicantName, applicationId, submittedAt: new Date().toISOString(),
        email: getString('email'), phoneNumber: getString('phoneNumber'),
        companyOrOrganization: getString('companyOrOrganization'),
        hasConfirmedDate: getString('hasConfirmedDate'),
        visitDate1: getString('visitDate1') || undefined,
        visitDate2: getString('visitDate2') || undefined,
        visitDate3: getString('visitDate3') || undefined,
        additionalComments: getString('additionalComments') || undefined,
      });
      console.log('✓ Email notification sent successfully');
    } catch (emailError: unknown) {
      console.error('Email notification failed:', emailError);
    }

    return NextResponse.json({ success: true, message: 'Application submitted successfully', applicationId });

  } catch (error: unknown) {
    console.error('Submit failed:', error);
    return NextResponse.json({ error: 'Failed to submit application', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
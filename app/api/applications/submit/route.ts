import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { validateFullApplication } from '@/lib/validation/applicationSchema';
import { loadBlank2311, fill2311, type AppRecord } from '@/lib/pdf2311';
import { uploadPDFToDrive } from '@/lib/googleDrive';
import { DRAFT_PLACEHOLDERS, isPlaceholder } from '@/lib/constants';

export const runtime = 'nodejs';

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const convertToDBDate = (formDate: string): string | null => {
  if (!formDate) return null;
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

    const formData = await req.formData();

    const applicationId = formData.get('applicationId') as string;
    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const { data: existingDraft, error: loadError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single();

    if (loadError) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const formDataObj: Record<string, any> = {};
    const booleanFields = ['acknowledgmentAgreement', 'confirmAccuracy', 'consentToDataUse'];

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        formDataObj[key] = value;
      } else {
        if (booleanFields.includes(key)) {
          formDataObj[key] = value === 'true';
        } else {
          formDataObj[key] = value;
        }
      }
    }

    const dataForValidation = {
      applicationId,
      ...formDataObj,
    };

    const validationResult = validateFullApplication(dataForValidation);

    if (!validationResult.success) {
      const allErrors = validationResult.error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        {
          error: 'Validation failed',
          allErrors,
        },
        { status: 400 }
      );
    }

    if (isPlaceholder(formDataObj.governmentIdNumber, DRAFT_PLACEHOLDERS.GOV_ID_NUMBER) ||
        isPlaceholder(formDataObj.email, DRAFT_PLACEHOLDERS.EMAIL) ||
        isPlaceholder(formDataObj.phoneNumber, DRAFT_PLACEHOLDERS.PHONE)) {
      return NextResponse.json(
        { error: 'Please complete all required fields before submitting' },
        { status: 400 }
      );
    }

    const updateData: any = {
      first_name: formDataObj.firstName,
      last_name: formDataObj.lastName,
      other_names: formDataObj.otherNames || null,
      date_of_birth: convertToDBDate(formDataObj.dateOfBirth),
      gender: formDataObj.gender,

      email: formDataObj.email,
      phone_number: formDataObj.phoneNumber,
      company_or_organization: formDataObj.companyOrOrganization,
      purpose_of_visit: formDataObj.purposeOfVisit || null,

      government_id_type: formDataObj.governmentIdType,
      government_id_number: formDataObj.governmentIdNumber,
      id_state: formDataObj.idState || null,
      id_expiration: convertToDBDate(formDataObj.idExpiration),
      digital_signature: formDataObj.digitalSignature,
      
      former_inmate: formDataObj.formerInmate === 'yes',
      on_probation_parole: formDataObj.onParole === 'yes',
      
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', applicationId)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to submit: ${updateError.message}` },
        { status: 500 }
      );
    }

    const pdfRecord: AppRecord = {
      first_name: formDataObj.firstName,
      last_name: formDataObj.lastName,
      other_names: formDataObj.otherNames || '',
      date_of_birth: formDataObj.dateOfBirth,
      phone_number: formDataObj.phoneNumber,
      email: formDataObj.email,
      company: formDataObj.companyOrOrganization,
      purpose_of_visit: formDataObj.purposeOfVisit || '',
      gender: formDataObj.gender,
      gov_id_type: formDataObj.governmentIdType,
      gov_id_number: formDataObj.governmentIdNumber,
      id_state: formDataObj.idState || '',
      id_expiration: formDataObj.idExpiration,
      signature_data_url: formDataObj.digitalSignature,
      visited_inmate: false,
      former_inmate: formDataObj.formerInmate === 'yes',
      restricted_access: false,
      felony_conviction: false,
      on_probation_parole: formDataObj.onParole === 'yes',
      pending_charges: false,
      ssn_full: formDataObj.ssnFull || formDataObj.ssnFirstFive || undefined,
    };

    const pdfDoc = await loadBlank2311();
    await fill2311(pdfDoc, pdfRecord);
    const pdfBytes = await pdfDoc.save();
    
    const filename = `CDCR_2311_${formDataObj.firstName}_${formDataObj.lastName}_${applicationId}.pdf`;
    
    await uploadPDFToDrive(Buffer.from(pdfBytes), filename);

    await supabase.from('documents').insert({
      application_id: applicationId,
      filename: filename,
      url: ' ',
      mime_type: 'application/pdf',
      size_bytes: pdfBytes.length,
      uploaded_by_user_id: user.id,
    });

    const passportScanFile = formData.get('passportScan') as File | null;
    
    if (formDataObj.governmentIdType === 'passport' && passportScanFile instanceof File) {
      try {
        const passportBuffer = Buffer.from(await passportScanFile.arrayBuffer());
        
        let extension = 'pdf';
        if (passportScanFile.type === 'image/jpeg' || passportScanFile.type === 'image/jpg') {
          extension = 'jpg';
        } else if (passportScanFile.type === 'image/png') {
          extension = 'png';
        }
        
        const passportFilename = `Passport_${formDataObj.firstName}_${formDataObj.lastName}_${applicationId}.${extension}`;
        
        await uploadPDFToDrive(passportBuffer, passportFilename);
        
        await supabase.from('documents').insert({
          application_id: applicationId,
          filename: passportFilename,
          url: ' ',
          mime_type: passportScanFile.type,
          size_bytes: passportBuffer.length,
          uploaded_by_user_id: user.id,
        });
      } catch (passportError) {
      }
    }

    const wardenLetterFile = formData.get('wardenLetter') as File | null;
    
    if (formDataObj.formerInmate === 'yes' && wardenLetterFile instanceof File) {
      try {
        const wardenBuffer = Buffer.from(await wardenLetterFile.arrayBuffer());
        const extension = wardenLetterFile.type.includes('pdf') ? 'pdf' : 'jpg';
        const wardenFilename = `WardenLetter_${formDataObj.firstName}_${formDataObj.lastName}_${applicationId}.${extension}`;
        
        await uploadPDFToDrive(wardenBuffer, wardenFilename);
        
        await supabase.from('documents').insert({
          application_id: applicationId,
          filename: wardenFilename,
          url: ' ',
          mime_type: wardenLetterFile.type,
          size_bytes: wardenBuffer.length,
          uploaded_by_user_id: user.id,
        });
      } catch (wardenError) {
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId,
    });

  } catch (error) {
    
    return NextResponse.json(
      { 
        error: 'Failed to submit application',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
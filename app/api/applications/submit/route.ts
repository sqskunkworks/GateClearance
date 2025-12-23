import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { validateFullApplication } from '@/lib/validation/applicationSchema';
import { loadBlank2311, fill2311, type AppRecord } from '@/lib/pdf2311';
import { uploadPDFToDrive } from '@/lib/googleDrive';
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

    const supabase = getServiceSupabase();
    const { error: loadError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single();

    if (loadError) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    type FormValue = string | boolean | File;
    const formDataObj: Record<string, FormValue> = {};
    const booleanFields = ['acknowledgmentAgreement', 'confirmAccuracy', 'consentToDataUse'];

    const getString = (key: keyof typeof formDataObj) => {
      const value = formDataObj[key];
      return typeof value === 'string' ? value : '';
    };

    const toGender = (value: string): AppRecord['gender'] => {
      if (
        value === 'male' ||
        value === 'female' ||
        value === 'nonbinary' ||
        value === 'prefer_not_to_say' ||
        value === 'other'
      ) {
        return value;
      }
      return undefined;
    };

    const toGovIdType = (value: string): AppRecord['gov_id_type'] => {
      if (value === 'driver_license' || value === 'passport') {
        return value;
      }
      return undefined;
    };

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
      const allErrors = validationResult.error.issues.map((err) => ({
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

    const governmentIdNumber = getString('governmentIdNumber');
    const email = getString('email');
    const phoneNumber = getString('phoneNumber');

    if (isPlaceholder(governmentIdNumber, DRAFT_PLACEHOLDERS.GOV_ID_NUMBER) ||
        isPlaceholder(email, DRAFT_PLACEHOLDERS.EMAIL) ||
        isPlaceholder(phoneNumber, DRAFT_PLACEHOLDERS.PHONE)) {
      return NextResponse.json(
        { error: 'Please complete all required fields before submitting' },
        { status: 400 }
      );
    }

    const updateData: Record<string, string | boolean | null | undefined> = {
      first_name: getString('firstName'),
      last_name: getString('lastName'),
      other_names: getString('otherNames') || null,
      date_of_birth: convertToDBDate(getString('dateOfBirth')),
      gender: getString('gender'),

      email,
      phone_number: phoneNumber,
      company_or_organization: getString('companyOrOrganization'),
      purpose_of_visit: getString('purposeOfVisit') || null,

      government_id_type: getString('governmentIdType'),
      government_id_number: governmentIdNumber,
      id_state: getString('idState') || null,
      id_expiration: convertToDBDate(getString('idExpiration')),
      digital_signature: getString('digitalSignature'),
      
      former_inmate: getString('formerInmate') === 'yes',
      on_probation_parole: getString('onParole') === 'yes',
      
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
      first_name: getString('firstName'),
      last_name: getString('lastName'),
      other_names: getString('otherNames'),
      date_of_birth: getString('dateOfBirth'),
      phone_number: phoneNumber,
      email,
      company: getString('companyOrOrganization'),
      purpose_of_visit: getString('purposeOfVisit'),
      gender: toGender(getString('gender')),
      gov_id_type: toGovIdType(getString('governmentIdType')),
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
// After line 205, before try block:
const fs = require('fs');
const path = require('path');

const oldPath = path.join(process.cwd(), 'public', 'templates', 'CDCR_2311_blank.pdf');
const newPath = path.join(process.cwd(), 'lib', 'assets', 'CDCR_2311_blank.pdf');

const debugInfo = {
  cwd: process.cwd(),
  oldPathExists: fs.existsSync(oldPath),
  newPathExists: fs.existsSync(newPath),
  libContents: fs.existsSync(path.join(process.cwd(), 'lib')) 
    ? fs.readdirSync(path.join(process.cwd(), 'lib')) 
    : 'lib dir not found',
  libAssetsContents: fs.existsSync(path.join(process.cwd(), 'lib', 'assets'))
    ? fs.readdirSync(path.join(process.cwd(), 'lib', 'assets'))
    : 'assets dir not found'
};

if (!debugInfo.newPathExists) {
  return NextResponse.json({ 
    error: 'DEBUG: File still not in deployment',
    debug: debugInfo 
  }, { status: 500 });
}
    try {
      const pdfDoc = await loadBlank2311();
      await fill2311(pdfDoc, pdfRecord);
      const pdfBytes = await pdfDoc.save();
      
      if (!pdfBytes || pdfBytes.length === 0) {
        throw new Error('PDF generation returned empty buffer');
      }
      
      const filename = `CDCR_2311_${formDataObj.firstName}_${formDataObj.lastName}_${applicationId}.pdf`;
      const pdfBuffer = Buffer.from(pdfBytes);
      
      await uploadPDFToDrive(pdfBuffer, filename);

      await supabase.from('documents').insert({
        application_id: applicationId,
        filename: filename,
        url: ' ',
        mime_type: 'application/pdf',
        size_bytes: pdfBytes.length,
        uploaded_by_user_id: user.id,
      });

    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError);
      throw new Error(`Failed to generate PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
    }

    const passportScanFile = formData.get('passportScan') as File | null;
    
    if (getString('governmentIdType') === 'passport' && passportScanFile instanceof File) {
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
        console.error('Passport upload failed:', passportError);
      }
    }

    const wardenLetterFile = formData.get('wardenLetter') as File | null;
    
    if (getString('formerInmate') === 'yes' && wardenLetterFile instanceof File) {
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
        console.error('Warden letter upload failed:', wardenError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId,
    });

  } catch (error) {
    console.error('Submit failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to submit application',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
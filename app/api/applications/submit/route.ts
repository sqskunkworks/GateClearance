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

    // Generate and upload main PDF
  // Generate and upload main PDF
try {
  console.log('=== PDF GENERATION START ===');
  console.log('📋 PDF Record:', JSON.stringify(pdfRecord, null, 2));
  
  console.log('📄 Step 1: Loading PDF template...');
  const pdfDoc = await loadBlank2311();
  console.log('✅ PDF template loaded successfully');
  
  console.log('✍️ Step 2: Filling PDF with data...');
  await fill2311(pdfDoc, pdfRecord);
  console.log('✅ PDF filled successfully');
  
  console.log('💾 Step 3: Saving PDF...');
  const pdfBytes = await pdfDoc.save();
  console.log('✅ PDF saved, checking result...');
  console.log('🔍 PDF Bytes check:', {
    exists: !!pdfBytes,
    type: typeof pdfBytes,
    isUint8Array: pdfBytes instanceof Uint8Array,
    length: pdfBytes?.length,
    firstFewBytes: pdfBytes ? Array.from(pdfBytes.slice(0, 10)) : null,
  });
  
  if (!pdfBytes || pdfBytes.length === 0) {
    throw new Error('PDF generation returned empty buffer');
  }
  
  console.log('🔄 Step 4: Converting to Buffer...');
  const pdfBuffer = Buffer.from(pdfBytes);
  console.log('🔍 Buffer check:', {
    exists: !!pdfBuffer,
    type: typeof pdfBuffer,
    isBuffer: Buffer.isBuffer(pdfBuffer),
    length: pdfBuffer?.length,
    firstFewBytes: pdfBuffer ? Array.from(pdfBuffer.slice(0, 10)) : null,
  });
  
  const filename = `CDCR_2311_${formDataObj.firstName}_${formDataObj.lastName}_${applicationId}.pdf`;
  console.log('📝 Filename:', filename);
  
  console.log('☁️ Step 5: Uploading to Google Drive...');
  console.log('🔍 Upload parameters:', {
    bufferExists: !!pdfBuffer,
    bufferType: typeof pdfBuffer,
    bufferLength: pdfBuffer?.length,
    filename: filename,
  });
  
  await uploadPDFToDrive(pdfBuffer, filename);
  console.log('✅ Upload to Drive successful');

  console.log('💾 Step 6: Saving to database...');
  await supabase.from('documents').insert({
    application_id: applicationId,
    filename: filename,
    url: ' ',
    mime_type: 'application/pdf',
    size_bytes: pdfBytes.length,
    uploaded_by_user_id: user.id,
  });
  console.log('✅ Database record saved');
  
  console.log('=== PDF GENERATION COMPLETE ===');

} catch (pdfError) {
  console.error('❌ PDF generation failed at some step');
  console.error('Error details:', pdfError);
  console.error('Error type:', typeof pdfError);
  console.error('Error constructor:', pdfError?.constructor?.name);
  if (pdfError instanceof Error) {
    console.error('Error message:', pdfError.message);
    console.error('Error stack:', pdfError.stack);
  }
  throw new Error(`Failed to generate PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
}

    // Upload passport scan if applicable
    const passportScanFile = formData.get('passportScan');
    
    if (getString('governmentIdType') === 'passport') {
      if (!passportScanFile || !(passportScanFile instanceof File)) {
        console.error('❌ Passport required but file is missing');
        return NextResponse.json(
          { error: 'Passport scan is required when using passport as ID' },
          { status: 400 }
        );
      }
      
      try {
        console.log('📄 Processing passport upload...');
        const passportBuffer = Buffer.from(await passportScanFile.arrayBuffer());
        
        if (!passportBuffer || passportBuffer.length === 0) {
          throw new Error('Passport file is empty');
        }
        
        let extension = 'pdf';
        if (passportScanFile.type === 'image/jpeg' || passportScanFile.type === 'image/jpg') {
          extension = 'jpg';
        } else if (passportScanFile.type === 'image/png') {
          extension = 'png';
        }
        
        const passportFilename = `Passport_${formDataObj.firstName}_${formDataObj.lastName}_${applicationId}.${extension}`;
        
        console.log('☁️ Uploading passport to Drive...');
        await uploadPDFToDrive(passportBuffer, passportFilename);
        
        await supabase.from('documents').insert({
          application_id: applicationId,
          filename: passportFilename,
          url: ' ',
          mime_type: passportScanFile.type,
          size_bytes: passportBuffer.length,
          uploaded_by_user_id: user.id,
        });
        
        console.log('✅ Passport uploaded successfully');
      } catch (passportError) {
        console.error('❌ Passport upload failed:', passportError);
        return NextResponse.json(
          { error: 'Failed to upload passport scan', details: passportError instanceof Error ? passportError.message : 'Unknown error' },
          { status: 500 }
        );
      }
    }

    // Upload warden letter if applicable
    const wardenLetterFile = formData.get('wardenLetter');
    
    if (getString('formerInmate') === 'yes') {
      if (!wardenLetterFile || !(wardenLetterFile instanceof File)) {
        console.error('❌ Warden letter required but file is missing');
        return NextResponse.json(
          { error: 'Warden letter is required for former inmates' },
          { status: 400 }
        );
      }
      
      try {
        console.log('📄 Processing warden letter upload...');
        const wardenBuffer = Buffer.from(await wardenLetterFile.arrayBuffer());
        
        if (!wardenBuffer || wardenBuffer.length === 0) {
          throw new Error('Warden letter file is empty');
        }
        
        const extension = wardenLetterFile.type.includes('pdf') ? 'pdf' : 'jpg';
        const wardenFilename = `WardenLetter_${formDataObj.firstName}_${formDataObj.lastName}_${applicationId}.${extension}`;
        
        console.log('☁️ Uploading warden letter to Drive...');
        await uploadPDFToDrive(wardenBuffer, wardenFilename);
        
        await supabase.from('documents').insert({
          application_id: applicationId,
          filename: wardenFilename,
          url: ' ',
          mime_type: wardenLetterFile.type,
          size_bytes: wardenBuffer.length,
          uploaded_by_user_id: user.id,
        });
        
        console.log('✅ Warden letter uploaded successfully');
      } catch (wardenError) {
        console.error('❌ Warden letter upload failed:', wardenError);
        return NextResponse.json(
          { error: 'Failed to upload warden letter', details: wardenError instanceof Error ? wardenError.message : 'Unknown error' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId,
    });

  } catch (error) {
    console.error('❌ Submit failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to submit application',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
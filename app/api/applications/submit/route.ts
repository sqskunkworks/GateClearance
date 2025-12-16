import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { validateFullApplication } from '@/lib/validation/applicationSchema';
import { loadBlank2311, fill2311, type AppRecord } from '@/lib/pdf2311';
import { uploadPDFToDrive } from '@/lib/googleDrive';

export const runtime = 'nodejs';

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Helper: Convert form date (MM-DD-YYYY) to DB date (YYYY-MM-DD)
const convertToDBDate = (formDate: string): string | null => {
  if (!formDate) return null;
  const [month, day, year] = formDate.split('-');
  return `${year}-${month}-${day}`;
};

export async function POST(req: Request) {
  try {
    console.log('\n=== FINAL SUBMIT STARTED ===');

    const authSupabase = await createClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    const formData = await req.formData();
    console.log('📥 Received FormData');

    // Extract applicationId
    const applicationId = formData.get('applicationId') as string;
    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    console.log('📥 Application ID:', applicationId);

    // Load existing draft
    const { data: existingDraft, error: loadError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single();

    if (loadError) {
      console.error('❌ Failed to load draft:', loadError);
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    console.log('✅ Loaded existing draft');

    //  Convert FormData to object for validation
const formDataObj: Record<string, any> = {};

// Fields that should be boolean
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

    console.log('📋 Form fields:', Object.keys(formDataObj));

    // Prepare validation data
    const dataForValidation = {
      applicationId,
      ...formDataObj,
    };

    console.log('🔍 Validating...');

    // Validate all data
    const validationResult = validateFullApplication(dataForValidation);

    if (!validationResult.success) {
      console.error('❌ Validation failed:', validationResult.error.issues);
      
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

    console.log('✅ Validation passed');

    // Check for dummy values
    if (formDataObj.governmentIdNumber === 'PENDING' || 
        formDataObj.email === 'pending@example.com' ||
        formDataObj.phoneNumber === '0000000000') {
      return NextResponse.json(
        { error: 'Please complete all required fields before submitting' },
        { status: 400 }
      );
    }

    // ========================================
    // UPDATE DATABASE
    // ========================================
    console.log('💾 Updating database...');

    const updateData: any = {
      // Step 1
      first_name: formDataObj.firstName,
      last_name: formDataObj.lastName,
      other_names: formDataObj.otherNames || null,
      date_of_birth: convertToDBDate(formDataObj.dateOfBirth),
      gender: formDataObj.gender,

      // Step 2
      email: formDataObj.email,
      phone_number: formDataObj.phoneNumber,
      company_or_organization: formDataObj.companyOrOrganization,
      purpose_of_visit: formDataObj.purposeOfVisit || null,

      // Step 5
      government_id_type: formDataObj.governmentIdType,
      government_id_number: formDataObj.governmentIdNumber,
      id_state: formDataObj.idState || null,
      id_expiration: convertToDBDate(formDataObj.idExpiration),
      digital_signature: formDataObj.digitalSignature,
      
      // Background
      former_inmate: formDataObj.formerInmate === 'yes',
      on_probation_parole: formDataObj.onParole === 'yes',
      
      // Status
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
      console.error('❌ Update failed:', updateError);
      return NextResponse.json(
        { error: `Failed to submit: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Database updated');

    // ========================================
    // GENERATE PDF
    // ========================================
    console.log('📄 Generating PDF...');

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

    console.log('✅ PDF generated, size:', pdfBytes.length, 'bytes');

    // ========================================
    // UPLOAD TO GOOGLE DRIVE
    // ========================================
    console.log('📤 Uploading application PDF to Google Drive...');

    const filename = `CDCR_2311_${formDataObj.firstName}_${formDataObj.lastName}_${applicationId}.pdf`;
    
    const { fileId } = await uploadPDFToDrive(
      Buffer.from(pdfBytes),
      filename
    );

    console.log('✅ Application PDF uploaded, File ID:', fileId);

    // ========================================
    // SAVE DOCUMENT METADATA
    // ========================================
    console.log('💾 Saving document metadata...');

    const { error: docError } = await supabase
      .from('documents')
      .insert({
        application_id: applicationId,
        filename: filename,
        url: ' ',
        mime_type: 'application/pdf',
        size_bytes: pdfBytes.length,
        uploaded_by_user_id: user.id,
      });

    if (docError) {
      console.error('⚠️ Document metadata error:', docError);
    } else {
      console.log('✅ Document metadata saved');
    }

    // ========================================
    // UPLOAD PASSPORT SCAN (IF PROVIDED)
    // ========================================
    const passportScanFile = formData.get('passportScan') as File | null;
    
    if (formDataObj.governmentIdType === 'passport' && passportScanFile instanceof File) {
      console.log('📤 Uploading passport scan...');
      
      try {
        const passportBuffer = Buffer.from(await passportScanFile.arrayBuffer());
        const passportFilename = `Passport_${formDataObj.firstName}_${formDataObj.lastName}_${applicationId}.pdf`;
        
        const { fileId: passportFileId } = await uploadPDFToDrive(
          passportBuffer,
          passportFilename
        );
        
        console.log('✅ Passport scan uploaded, File ID:', passportFileId);
        
        // Save passport document metadata
        const { error: passportDocError } = await supabase
          .from('documents')
          .insert({
            application_id: applicationId,
            filename: passportFilename,
            url: ' ',
            mime_type: 'application/pdf',
            size_bytes: passportBuffer.length,
            uploaded_by_user_id: user.id,
          });
        
        if (passportDocError) {
          console.error('⚠️ Passport document metadata error:', passportDocError);
        } else {
          console.log('✅ Passport document metadata saved');
        }
      } catch (passportError) {
        console.error('❌ Passport upload error:', passportError);
      }
    }

    // ========================================
    // UPLOAD WARDEN LETTER (IF PROVIDED)
    // ========================================
    const wardenLetterFile = formData.get('wardenLetter') as File | null;
    
    if (formDataObj.formerInmate === 'yes' && wardenLetterFile instanceof File) {
      console.log('📤 Uploading warden letter...');
      
      try {
        const wardenBuffer = Buffer.from(await wardenLetterFile.arrayBuffer());
        const extension = wardenLetterFile.type.includes('pdf') ? 'pdf' : 'jpg';
        const wardenFilename = `WardenLetter_${formDataObj.firstName}_${formDataObj.lastName}_${applicationId}.${extension}`;
        
        const { fileId: wardenFileId } = await uploadPDFToDrive(
          wardenBuffer,
          wardenFilename
        );
        
        console.log('✅ Warden letter uploaded, File ID:', wardenFileId);
        
        // Save warden letter metadata
        const { error: wardenDocError } = await supabase
          .from('documents')
          .insert({
            application_id: applicationId,
            filename: wardenFilename,
            url: ' ',
            mime_type: wardenLetterFile.type,
            size_bytes: wardenBuffer.length,
            uploaded_by_user_id: user.id,
          });
        
        if (wardenDocError) {
          console.error('⚠️ Warden letter metadata error:', wardenDocError);
        } else {
          console.log('✅ Warden letter metadata saved');
        }
      } catch (wardenError) {
        console.error('❌ Warden letter upload error:', wardenError);
      }
    }

    console.log('✅✅✅ APPLICATION SUBMISSION COMPLETE');
    console.log('=== FINAL SUBMIT COMPLETED ===\n');

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId,
    });

  } catch (error) {
    console.error('❌ Submit error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { 
        error: 'Failed to submit application',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
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

    const body = await req.json();
    const { applicationId, ...formData } = body;

    console.log('📥 Submit data received:', { applicationId, hasFormData: !!formData });

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

    // Include applicationId in validation data
    const dataForValidation = {
      applicationId,
      ...formData,
      dateOfBirth: formData.dateOfBirth, // Keep as MM-DD-YYYY for validation
      idExpiration: formData.idExpiration, // Keep as MM-DD-YYYY for validation
    };

    console.log('🔍 Validating with dates:', {
      applicationId: dataForValidation.applicationId,
      dateOfBirth: dataForValidation.dateOfBirth,
      idExpiration: dataForValidation.idExpiration,
    });

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
    if (formData.governmentIdNumber === 'PENDING' || 
        formData.email === 'pending@example.com' ||
        formData.phoneNumber === '0000000000') {
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
      first_name: formData.firstName,
      last_name: formData.lastName,
      other_names: formData.otherNames || null,
      date_of_birth: convertToDBDate(formData.dateOfBirth),
      gender: formData.gender,

      // Step 2
      email: formData.email,
      phone_number: formData.phoneNumber,
      company_or_organization: formData.companyOrOrganization,
      purpose_of_visit: formData.purposeOfVisit || null,

      // Step 5
      government_id_type: formData.governmentIdType,
      government_id_number: formData.governmentIdNumber,
      id_state: formData.idState || null,
      id_expiration: convertToDBDate(formData.idExpiration),
      digital_signature: formData.digitalSignature,
      
      // Background
      former_inmate: formData.formerInmate === 'yes',
      on_probation_parole: formData.onParole === 'yes',
      
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
      first_name: formData.firstName,
      last_name: formData.lastName,
      other_names: formData.otherNames || '',
      date_of_birth: formData.dateOfBirth, // Keep MM-DD-YYYY for PDF
      phone_number: formData.phoneNumber,
      email: formData.email,
      company: formData.companyOrOrganization,
      purpose_of_visit: formData.purposeOfVisit || '',
      gender: formData.gender,
      gov_id_type: formData.governmentIdType,
      gov_id_number: formData.governmentIdNumber,
      id_state: formData.idState || '',
      id_expiration: formData.idExpiration, // Keep MM-DD-YYYY for PDF
      signature_data_url: formData.digitalSignature,
      visited_inmate: false,
      former_inmate: formData.formerInmate === 'yes',
      restricted_access: false,
      felony_conviction: false,
      on_probation_parole: formData.onParole === 'yes',
      pending_charges: false,
      ssn_full: formData.ssnFull || formData.ssnFirstFive || undefined,
    };

    const pdfDoc = await loadBlank2311();
    await fill2311(pdfDoc, pdfRecord);
    const pdfBytes = await pdfDoc.save();

    console.log('✅ PDF generated, size:', pdfBytes.length, 'bytes');

    // ========================================
    // UPLOAD TO GOOGLE DRIVE
    // ========================================
    console.log('📤 Uploading to Google Drive...');

    const filename = `CDCR_2311_${formData.firstName}_${formData.lastName}_${applicationId}.pdf`;
    
    const { fileId } = await uploadPDFToDrive(
      Buffer.from(pdfBytes),
      filename
    );

    console.log('✅ Uploaded to Drive, File ID:', fileId);

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


// app/api/applications/submit/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { loadBlank2311, fill2311, type AppRecord } from '@/lib/pdf2311';
import { uploadPDFToDrive } from '@/lib/googleDrive';

export const runtime = 'nodejs';

// ✅ Server-only Supabase client (PR feedback addressed)
const supabase = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function POST(req: Request) {
  try {
    console.log('=== APPLICATION SUBMIT STARTED ===');
    
    // Authenticate user
    const authSupabase = await createClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    const body = await req.json();
    console.log('📥 Request body keys:', Object.keys(body));

    // Validate required fields
    const requiredFields = [
      'applicationId',
      'firstName',
      'lastName',
      'dateOfBirth',
      'gender',
      'email',
      'phoneNumber',
      'companyOrOrganization',
      'governmentIdType',
      'governmentIdNumber',
      'digitalSignature',
    ];

    const missingFields = requiredFields.filter(field => !body[field]);

    // Check SSN if direct submission
    if (body.submissionType === 'direct' && !body.ssn) {
      missingFields.push('ssn (required for direct submission)');
    }

    if (missingFields.length > 0) {
      console.error('❌ Missing fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // ========================================
    // SAVE TO DATABASE
    // ========================================
    console.log('💾 Saving to database...');

    // ✅ Using snake_case for applications table (Drizzle default naming)
    const applicationData = {
      id: body.applicationId,
      user_id: user.id,
      
      // Personal info
      email: body.email,
      first_name: body.firstName,
      last_name: body.lastName,
      other_names: body.otherNames || null,
      date_of_birth: body.dateOfBirth,
      gender: body.gender,
      
      // Contact info
      phone_number: body.phoneNumber,
      company_or_organization: body.companyOrOrganization,
      purpose_of_visit: body.purposeOfVisit || null,
      
      // Government ID
      government_id_type: body.governmentIdType,
      government_id_number: body.governmentIdNumber,
      id_state: body.idState || null,
      id_expiration: body.idExpiration || null,
      
      // Background questions
      visited_inmate: body.visitedInmate === 'yes',
      former_inmate: body.formerInmate === 'yes',
      restricted_access: body.restrictedAccess === 'yes',
      felony_conviction: body.felonyConviction === 'yes',
      on_probation_parole: body.onProbationParole === 'yes',
      pending_charges: body.pendingCharges === 'yes',
      
      // Signature
      digital_signature: body.digitalSignature,
      
      // System fields
      authorization_type: 'gate_clearance',
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    };

    const { data: savedApp, error: saveError } = await supabase
      .from('applications')
      .upsert(applicationData, { onConflict: 'id' })
      .select()
      .single();

    if (saveError) {
      console.error('❌ Database error:', saveError);
      return NextResponse.json(
        { error: `Database error: ${saveError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Saved to database');

    // ========================================
    // GENERATE PDF
    // ========================================
    console.log('📄 Generating PDF...');

    const formatDate = (dateStr: string | null | undefined) => {
      if (!dateStr) return '';
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
      const [year, month, day] = dateStr.split('-');
      return `${month}-${day}-${year}`;
    };

    const pdfRecord: AppRecord = {
      first_name: body.firstName,
      last_name: body.lastName,
      other_names: body.otherNames || '',
      date_of_birth: formatDate(body.dateOfBirth),
      phone_number: body.phoneNumber,
      email: body.email,
      company: body.companyOrOrganization,
      purpose_of_visit: body.purposeOfVisit || '',
      gender: body.gender,
      gov_id_type: body.governmentIdType,
      gov_id_number: body.governmentIdNumber,
      id_state: body.idState || '',
      id_expiration: formatDate(body.idExpiration),
      signature_data_url: body.digitalSignature,
      visited_inmate: body.visitedInmate === 'yes',
      former_inmate: body.formerInmate === 'yes',
      restricted_access: body.restrictedAccess === 'yes',
      felony_conviction: body.felonyConviction === 'yes',
      on_probation_parole: body.onProbationParole === 'yes',
      pending_charges: body.pendingCharges === 'yes',
      ssn_full: body.ssn,
    };

    const pdfDoc = await loadBlank2311();
    await fill2311(pdfDoc, pdfRecord);
    const pdfBytes = await pdfDoc.save();

    console.log('✅ PDF generated, size:', pdfBytes.length, 'bytes');

    // ========================================
    // UPLOAD TO GOOGLE DRIVE
    // ========================================
    console.log('📤 Uploading to Google Drive...');

    const filename = `CDCR_2311_${body.firstName}_${body.lastName}_${body.applicationId}.pdf`;
    
    // ✅ FIX: Destructure the return value
    const { fileId } = await uploadPDFToDrive(
      Buffer.from(pdfBytes),
      filename
    );

    console.log('✅ Uploaded to Drive, File ID:', fileId);

    // ========================================
    // SAVE DOCUMENT METADATA
    // ========================================
    console.log('💾 Saving document metadata...');

    // ✅ CRITICAL: Using snake_case column names to match Drizzle schema
    // Your schema uses: applicationId, url, filename, mimeType, sizeBytes, uploadedByUserId
    // But Drizzle converts these to snake_case in Postgres: application_id, mime_type, etc.
    const { error: docError } = await supabase
      .from('documents')
      .insert({
        application_id: body.applicationId,     // ✅ snake_case (Drizzle default)
        url: ` `,                 
        filename: filename,                      // ✅ Already snake_case
        mime_type: 'application/pdf',           // ✅ snake_case
        size_bytes: pdfBytes.length,            // ✅ snake_case
        uploaded_by_user_id: user.id,           // ✅ snake_case
      });

    if (docError) {
      console.error('⚠️ Document metadata error:', docError);
      // ✅ Don't fail the whole request - PDF is already uploaded
    } else {
      console.log('✅ Document metadata saved');
    }

    console.log('✅✅✅ APPLICATION SUBMISSION COMPLETE');

    // ✅ PR Feedback: No webViewLink in response
    return NextResponse.json({
      success: true,
      applicationId: body.applicationId,
      message: 'Application submitted successfully',
    });

  } catch (error) {
    console.error('❌❌❌ FATAL ERROR:', error);
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
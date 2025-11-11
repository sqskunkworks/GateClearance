
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { loadBlank2311, fill2311, type AppRecord } from '@/lib/pdf2311';
import { uploadPDFToDrive } from '@/lib/googleDrive';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function POST(request: NextRequest) {
  try {
    console.log('=== APPLICATION SUBMIT STARTED ===');
    const body = await request.json();
    
    const { applicationId, ssnFull, ssnMethod, ssnFirstFive, wardenLetter, digitalSignature, ...formData } = body;
    
    // Helper to convert dates
    const convertDate = (dateStr: string | undefined) => {
      if (!dateStr) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const [month, day, year] = dateStr.split('-');
        return `${year}-${month}-${day}`;
      }
      return null;
    };

    // STEP 1: Save to database
    console.log('→ STEP 1: Saving to database...');
    const applicationData = {
      id: applicationId,
      user_id: 'test-user',
      first_name: formData.firstName,
      last_name: formData.lastName,
      other_names: formData.otherNames,
      date_of_birth: convertDate(formData.dateOfBirth),
      gender: formData.gender,
      email: formData.email,
      phone_number: formData.phoneNumber,
      company_or_organization: formData.companyOrOrganization,
      purpose_of_visit: formData.purposeOfVisit,
      government_id_type: formData.governmentIdType,
      government_id_number: formData.governmentIdNumber,
      id_state: formData.idState,
      id_expiration: convertDate(formData.idExpiration),
      digital_signature: digitalSignature,
      former_inmate: formData.formerInmate === 'yes',
      on_probation_parole: formData.onParole === 'yes',
      visited_inmate: formData.visitedInmate === 'yes',
      restricted_access: formData.restrictedAccess === 'yes',
      felony_conviction: formData.felonyConviction === 'yes',
      pending_charges: formData.pendingCharges === 'yes',
      authorization_type: 'Gate Clearance',
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('applications')
      .upsert(applicationData, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('✅ Saved to database:', data.id);
    
    // STEP 2: Generate PDF
    console.log('→ STEP 2: Generating PDF...');
    
    const formatDateForPDF = (dateStr: string | null) => {
      if (!dateStr) return '';
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
      const [year, month, day] = dateStr.split('-');
      return `${month}-${day}-${year}`;
    };

    const record: AppRecord = {
      first_name: data.first_name,
      last_name: data.last_name,
      other_names: data.other_names,
      date_of_birth: formatDateForPDF(data.date_of_birth),
      phone_number: data.phone_number,
      email: data.email,
      company: data.company_or_organization,
      purpose_of_visit: data.purpose_of_visit,
      gender: data.gender,
      gov_id_type: data.government_id_type,
      gov_id_number: data.government_id_number,
      id_state: data.id_state ?? '',
      id_expiration: formatDateForPDF(data.id_expiration),
      signature_data_url: data.digital_signature ?? '',
      visited_inmate: data.visited_inmate ?? false,
      former_inmate: data.former_inmate ?? false,
      restricted_access: data.restricted_access ?? false,
      felony_conviction: data.felony_conviction ?? false,
      on_probation_parole: data.on_probation_parole ?? false,
      pending_charges: data.pending_charges ?? false,
      ssn_full: ssnFull,
    };

    const pdf = await loadBlank2311();
    await fill2311(pdf, record);
    const pdfBytes = await pdf.save();
    
    console.log('✅ PDF generated, size:', pdfBytes.length, 'bytes');
    
    // STEP 3: Upload to Google Drive
    console.log('→ STEP 3: Uploading to Google Drive...');
    const filename = `CDCR_2311_${data.first_name}_${data.last_name}_${applicationId}.pdf`;
    
    const { fileId, webViewLink } = await uploadPDFToDrive(
      Buffer.from(pdfBytes), 
      filename
    );
    
    console.log('✅ Uploaded to Google Drive');
    console.log('   File ID:', fileId);
    console.log('   URL:', webViewLink);
    
    // STEP 4: Save document metadata
    console.log('→ STEP 4: Saving document metadata...');
    const { error: docError } = await supabase
      .from('documents')
      .insert({
        application_id: applicationId,
        url: webViewLink,
        filename: filename,
        mime_type: 'application/pdf',
        size_bytes: pdfBytes.length,
        uploaded_by_user_id: 'system',
      });
    
    if (docError) {
      console.warn('⚠️ Warning: Failed to save document metadata:', docError.message);
    } else {
      console.log('✅ Document metadata saved');
    }
    
    console.log('=== APPLICATION SUBMIT COMPLETED ===');
    
    return NextResponse.json({
      success: true,
      applicationId: data.id,
      driveFileId: fileId,
      driveFileUrl: webViewLink,
      message: 'Application submitted and PDF uploaded to Google Drive',
    });
    
  } catch (error: any) {
    console.error('❌ Error in submit route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save application' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { loadBlank2311, fill2311, type AppRecord } from '@/lib/pdf2311';
import { uploadPDFToDrive } from '@/lib/googleDrive';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function POST(req: Request) {
  try {
    console.log('\n🔐 Checking authentication...');
    
    // Get authenticated user
    const authSupabase = await createClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('✅ User authenticated:', user.email);

    const body = await req.json();
    const { applicationId, ssn_full, ...formData } = body;

    console.log('📦 Processing application submission...');

    // Format date helper
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '';
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
      const [year, month, day] = dateStr.split('-');
      return `${month}-${day}-${year}`;
    };

    // Prepare application data
   // Prepare application data
const applicationData = {
  id: applicationId,
  user_id: user.id,
  email: formData.email || user.email,
  first_name: formData.firstName,
  last_name: formData.lastName,
  other_names: formData.otherNames,
  date_of_birth: formatDate(formData.dateOfBirth),
  phone_number: formData.phoneNumber,
  company_or_organization: formData.companyOrOrganization,
  purpose_of_visit: formData.purposeOfVisit,
  gender: formData.gender,
  government_id_type: formData.governmentIdType,
  government_id_number: formData.governmentIdNumber,
  id_state: formData.idState,
  id_expiration: formatDate(formData.idExpiration),
  digital_signature: formData.digitalSignature,
  visited_inmate: formData.visitedInmate === 'yes',
  former_inmate: formData.formerInmate === 'yes',
  restricted_access: formData.restrictedAccess === 'yes',
  felony_conviction: formData.felonyConviction === 'yes',
  on_probation_parole: formData.onProbationParole === 'yes',
  pending_charges: formData.pendingCharges === 'yes',
  authorization_type: 'gate_clearance',
  status: 'submitted',
  submitted_at: new Date().toISOString(),
};

    console.log('💾 Saving to database...');
    const { data, error } = await supabase
      .from('applications')
      .upsert(applicationData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('✅ Application saved to database');

    // Prepare data for PDF
    const record: AppRecord = {
      first_name: data.first_name,
      last_name: data.last_name,
      other_names: data.other_names,
      date_of_birth: data.date_of_birth,
      phone_number: data.phone_number,
      email: data.email,
      company: data.company_or_organization,
      purpose_of_visit: data.purpose_of_visit,
      gender: data.gender,
      gov_id_type: data.government_id_type,
      gov_id_number: data.government_id_number,
      id_state: data.id_state ?? '',
      id_expiration: data.id_expiration,
      signature_data_url: data.digital_signature ?? '',
      visited_inmate: data.visited_inmate ?? false,
      former_inmate: data.former_inmate ?? false,
      restricted_access: data.restricted_access ?? false,
      felony_conviction: data.felony_conviction ?? false,
      on_probation_parole: data.on_probation_parole ?? false,
      pending_charges: data.pending_charges ?? false,
      ssn_full: ssn_full || undefined,
    };

    console.log('📄 Generating PDF...');
    const pdf = await loadBlank2311();
    await fill2311(pdf, record);
    const pdfBytes = await pdf.save();
    console.log('✅ PDF generated, size:', pdfBytes.length, 'bytes');

    const filename = `CDCR_2311_${data.first_name}_${data.last_name}_${applicationId}.pdf`;

    console.log('📤 Uploading PDF to Google Drive...');
    const { fileId, webViewLink } = await uploadPDFToDrive(
      Buffer.from(pdfBytes),
      filename
    );
    console.log('✅ PDF uploaded to Drive');

    console.log('💾 Saving document metadata...');
    const { error: docError } = await supabase
      .from('documents')
      .insert({
        application_id: applicationId,
        url: webViewLink,
        filename: filename,
        mime_type: 'application/pdf',
        size_bytes: pdfBytes.length,
      });

    if (docError) {
      console.error('⚠️  Error saving document metadata:', docError);
    } else {
      console.log('✅ Document metadata saved');
    }

    console.log('✅✅✅ Application submission complete!\n');

    return NextResponse.json({
      success: true,
      applicationId: applicationId,
      driveFileUrl: webViewLink,
    });
  } catch (error) {
    console.error('❌ Error in submit route:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to submit application',
      },
      { status: 500 }
    );
  }
}
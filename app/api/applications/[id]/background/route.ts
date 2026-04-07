import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { uploadPDFToDrive } from '@/lib/googleDrive';

export const runtime = 'nodejs';

const getServiceSupabase = (): SupabaseClient => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSupabase = await createClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Use FormData instead of JSON so we can receive the warden letter file
    const formData = await req.formData();

    const getString = (key: string) => {
      const val = formData.get(key);
      return typeof val === 'string' ? val : '';
    };

    const updateData = {
      q1_live_scan: getString('q1LiveScan') === 'yes',
      q1_live_scan_details: getString('q1LiveScanDetails') || null,
      q2_other_cdcr: getString('q2OtherCdcr') === 'yes',
      q2_other_cdcr_details: getString('q2OtherCdcrDetails') || null,
      q3_visit_inmates: getString('q3VisitInmates') === 'yes',
      q3_visit_inmates_details: getString('q3VisitInmatesDetails') || null,
      q4_related_to_inmate: getString('q4RelatedToInmate') === 'yes',
      q4_related_details: getString('q4RelatedDetails') || null,
      q5_arrested_convicted: getString('q5ArrestedConvicted') === 'yes',
      criminal_history: getString('criminalHistory') || null,
      q6_on_parole: getString('q6OnParole') === 'yes',
      q6_parole_details: getString('q6ParoleDetails') || null,
      q7_discharged: getString('q7Discharged') === 'yes',
      q7_discharge_details: getString('q7DischargeDetails') || null,
      updated_at: new Date().toISOString(),
    };

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: `Failed to update: ${error.message}` }, { status: 500 });

    // ── Upload warden letter eagerly at step 3 ───────────────────
    // Uploading here (not at submit) means the file is preserved even if
    // the user leaves and resumes the draft later. On resume, the submit
    // route checks the documents table instead of requiring a live File object.
    const wardenLetterFile = formData.get('wardenLetter');
    if (getString('q7Discharged') === 'yes' && wardenLetterFile instanceof File) {
      try {
        // Fetch applicant name for filename
        const { data: app } = await supabase
          .from('applications')
          .select('first_name, last_name')
          .eq('id', id)
          .single();

        const firstName = (app?.first_name || 'applicant').replace(/[^a-zA-Z]/g, '');
        const lastName = (app?.last_name || '').replace(/[^a-zA-Z]/g, '');
        const ext = wardenLetterFile.type.includes('pdf') ? 'pdf' : 'jpg';
        const filename = `${firstName}_${lastName}_warden_letter.${ext}`;

        const buffer = Buffer.from(await wardenLetterFile.arrayBuffer());
        await uploadPDFToDrive(buffer, filename);

        // Upsert — delete any existing warden letter for this application
        // then insert the new one, so re-uploads replace the old file record
        await supabase
          .from('documents')
          .delete()
          .eq('application_id', id)
          .ilike('filename', '%warden_letter%');

        await supabase.from('documents').insert({
          application_id: id,
          filename,
          url: ' ',
          mime_type: wardenLetterFile.type,
          size_bytes: buffer.length,
          uploaded_by_user_id: user.id,
        });

        console.log('✓ Warden letter uploaded at step 3');
      } catch (uploadError) {
        console.error('Warden letter upload failed at step 3:', uploadError);
        // Don't fail the whole PATCH — return a warning so client can inform user
        return NextResponse.json({
          success: true,
          message: 'Background questions saved',
          warning: 'Warden letter upload failed — please try re-uploading before submitting',
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Background questions saved' });
  } catch (error) {
    console.error('Failed to update background questions', error);
    return NextResponse.json({ error: 'Failed to update background questions' }, { status: 500 });
  }
}
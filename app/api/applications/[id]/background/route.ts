import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

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
    const body = await req.json();

    const updateData = {
      // Q1
      q1_live_scan: body.q1LiveScan === 'yes',
      q1_live_scan_details: body.q1LiveScanDetails || null,
      // Q2
      q2_other_cdcr: body.q2OtherCdcr === 'yes',
      q2_other_cdcr_details: body.q2OtherCdcrDetails || null,
      // Q3
      q3_visit_inmates: body.q3VisitInmates === 'yes',
      q3_visit_inmates_details: body.q3VisitInmatesDetails || null,
      // Q4
      q4_related_to_inmate: body.q4RelatedToInmate === 'yes',
      q4_related_details: body.q4RelatedDetails || null,
      // Q5
      q5_arrested_convicted: body.q5ArrestedConvicted === 'yes',
      criminal_history: body.criminalHistory || null,
      // Q6
      q6_on_parole: body.q6OnParole === 'yes',
      q6_parole_details: body.q6ParoleDetails || null,
      // Q7
      q7_discharged: body.q7Discharged === 'yes',
      q7_discharge_details: body.q7DischargeDetails || null,
      updated_at: new Date().toISOString(),
    };

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: `Failed to update: ${error.message}` }, { status: 500 });

    return NextResponse.json({ success: true, message: 'Background questions saved' });
  } catch (error) {
    console.error('Failed to update background questions', error);
    return NextResponse.json({ error: 'Failed to update background questions' }, { status: 500 });
  }
}
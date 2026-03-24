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
      // SSN last 4
      ssn_last4: body.ssnLast4 || null,

      // Emergency contact 1
      ec1_name: body.ec1Name || null,
      ec1_relationship: body.ec1Relationship || null,
      ec1_address: body.ec1Address || null,
      ec1_home_phone: body.ec1HomePhone || null,
      ec1_work_phone: body.ec1WorkPhone || null,
      ec1_cell_phone: body.ec1CellPhone || null,

      // Emergency contact 2 (optional)
      ec2_name: body.ec2Name || null,
      ec2_relationship: body.ec2Relationship || null,
      ec2_address: body.ec2Address || null,
      ec2_home_phone: body.ec2HomePhone || null,
      ec2_work_phone: body.ec2WorkPhone || null,
      ec2_cell_phone: body.ec2CellPhone || null,

      // Medical info
      physician_name: body.physicianName || null,
      physician_phone: body.physicianPhone || null,
      medical_plan_name: body.medicalPlanName || null,
      medical_plan_card_number: body.medicalPlanCardNumber || null,
      medical_facility: body.medicalFacility || null,
      special_conditions: body.specialConditions || null,
      special_instructions: body.specialInstructions || null,

      updated_at: new Date().toISOString(),
    };

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: `Failed to update: ${error.message}` }, { status: 500 });

    return NextResponse.json({ success: true, message: 'Emergency contacts saved' });
  } catch (error) {
    console.error('Failed to update emergency contacts', error);
    return NextResponse.json({ error: 'Failed to update emergency contacts' }, { status: 500 });
  }
}
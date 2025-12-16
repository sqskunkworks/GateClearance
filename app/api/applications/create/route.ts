

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Helper: Convert form date )
const convertToDBDate = (formDate: string): string => {
  console.log('🔄 Converting date:', formDate);
  if (!formDate) {
    console.log('⚠️ Empty date received');
    return '';
  }
  const [month, day, year] = formDate.split('-');
  const dbDate = `${year}-${month}-${day}`;
  console.log('✅ Converted to:', dbDate);
  return dbDate;
};

export async function POST(req: Request) {
  try {
    console.log('\n=== CREATE DRAFT STARTED ===');

    const authSupabase = await createClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('📥 Received body:', JSON.stringify(body, null, 2));

    const { applicationId, ...formData } = body;

    // Validate Step 1 data
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender'];
    const missing = requiredFields.filter(f => !formData[f]);

    if (missing.length > 0) {
      console.log('❌ Missing fields:', missing);
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const convertedDOB = convertToDBDate(formData.dateOfBirth);
    console.log('📅 Date conversion result:', {
      input: formData.dateOfBirth,
      output: convertedDOB,
    });

   
    const draftData = {
      id: applicationId,
      user_id: user.id,
      
      // Step 1: Personal (REAL data)
      first_name: formData.firstName,
      last_name: formData.lastName,
      other_names: formData.otherNames || null,
      date_of_birth: convertedDOB,
      gender: formData.gender,
      
      // Step 2: Contact (DUMMY)
      email: 'pending@example.com',
      phone_number: '0000000000',
      company_or_organization: 'PENDING',
      purpose_of_visit: null,
      
      // Step 5: Security (DUMMY)
      government_id_type: 'driver_license',
      government_id_number: 'PENDING',
      
      // System fields
      authorization_type: 'gate_clearance',
      status: 'draft',
      
      // Initialize boolean fields
      visited_inmate: false,
      former_inmate: false,
      restricted_access: false,
      felony_conviction: false,
      on_probation_parole: false,
      pending_charges: false,
    };

    console.log('💾 About to insert:', JSON.stringify(draftData, null, 2));

    const { data, error } = await supabase
      .from('applications')
      .insert(draftData)
      .select()
      .single();

    if (error) {
      console.error('❌ DB INSERT ERROR:', error);
      return NextResponse.json(
        { error: `Failed to create draft: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Draft created successfully:', data.id);
    console.log('✅ Stored date_of_birth:', data.date_of_birth);
    console.log('=== CREATE DRAFT COMPLETED ===\n');

    return NextResponse.json({
      success: true,
      applicationId: data.id,
      message: 'Draft created successfully',
    });

  } catch (error) {
    console.error('❌ CREATE DRAFT EXCEPTION:', error);
    return NextResponse.json(
      { error: 'Failed to create draft', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
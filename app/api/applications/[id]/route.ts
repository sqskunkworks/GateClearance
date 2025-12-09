// FILE: /api/applications/[id]/route.ts - CLEAN VERSION

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Helper: Convert DB date (YYYY-MM-DD) to form format (MM-DD-YYYY)
const convertToFormDate = (dbDate: string | null): string => {
  console.log('🔄 Converting DB date to form:', dbDate);
  if (!dbDate) {
    console.log('⚠️ Empty date received');
    return '';
  }
  const [year, month, day] = dbDate.split('-');
  const formDate = `${month}-${day}-${year}`;
  console.log('✅ Converted to:', formDate);
  return formDate;
};

// Helper: Check if value is a dummy
const isDummy = (value: any, dummyValue: string) => {
  const result = !value || value === dummyValue;
  console.log(`🔍 isDummy check: "${value}" vs "${dummyValue}" = ${result}`);
  return result;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('\n=== GET DRAFT STARTED ===');

    const authSupabase = await createClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    console.log('📥 Loading draft for ID:', id);

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('❌ DB SELECT ERROR:', error);
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    console.log('📊 RAW DB DATA:');
    console.log('  first_name:', data.first_name);
    console.log('  last_name:', data.last_name);
    console.log('  date_of_birth (raw):', data.date_of_birth);
    console.log('  status:', data.status);
    console.log('  submitted_at:', data.submitted_at);
    console.log('  former_inmate:', data.former_inmate);
    console.log('  on_probation_parole:', data.on_probation_parole);

    // ✅ FIX: Check if this is a NEW draft (not yet filled out Step 5)
    const isNewDraft = data.status === 'draft' && !data.submitted_at;

    // Transform to form format
    const formData: Record<string, any> = {
      // Step 1: Personal
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      otherNames: data.other_names || '',
      dateOfBirth: convertToFormDate(data.date_of_birth),
      gender: data.gender || '',

      // Step 2: Contact (filter dummy values)
      email: isDummy(data.email, 'pending@example.com') ? '' : data.email,
      phoneNumber: isDummy(data.phone_number, '0000000000') ? '' : data.phone_number,
      companyOrOrganization: isDummy(data.company_or_organization, 'PENDING') ? '' : data.company_or_organization,
      purposeOfVisit: data.purpose_of_visit || '',
      // ✅ Visit date handled by sessionStorage in frontend

      // Step 3: Experience (from JSONB)
      ...(data.impact_responses || {}),

      // Step 4: Rules (from JSONB)
      ...(data.rules_quiz_answers || {}),

      // Step 5: Security (filter dummy values)
      governmentIdType: isDummy(data.government_id_number, 'PENDING') ? '' : data.government_id_type,
      governmentIdNumber: isDummy(data.government_id_number, 'PENDING') ? '' : data.government_id_number,
      governmentIdNumberConfirm: isDummy(data.government_id_number, 'PENDING') ? '' : data.government_id_number, // ✅ Pre-fill confirmation
      idState: data.id_state || '',
      idExpiration: convertToFormDate(data.id_expiration),
      digitalSignature: data.digital_signature || '',
      
      // ✅ FIX: Background questions - empty for new drafts, yes/no for saved drafts
      formerInmate: isNewDraft ? '' : (data.former_inmate ? 'yes' : 'no'),
      onParole: isNewDraft ? '' : (data.on_probation_parole ? 'yes' : 'no'),
    };

    console.log('📤 TRANSFORMED FORM DATA:');
    console.log('  firstName:', formData.firstName);
    console.log('  lastName:', formData.lastName);
    console.log('  dateOfBirth:', formData.dateOfBirth);
    console.log('  formerInmate:', formData.formerInmate, '(empty = unanswered)');
    console.log('  onParole:', formData.onParole, '(empty = unanswered)');
    console.log('=== GET DRAFT COMPLETED ===\n');

    return NextResponse.json({ draft: formData });

  } catch (error) {
    console.error('❌ GET DRAFT EXCEPTION:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}
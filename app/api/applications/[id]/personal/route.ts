// FILE: /api/applications/[id]/personal/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Helper: Convert form date (MM-DD-YYYY) to DB date (YYYY-MM-DD)
const convertToDBDate = (formDate: string): string => {
  if (!formDate) return '';
  const [month, day, year] = formDate.split('-');
  return `${year}-${month}-${day}`;
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('📝 Updating personal info...');

    const authSupabase = await createClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Update Step 1 data - CONVERT DATE
    const updateData: any = {
      first_name: body.firstName,
      last_name: body.lastName,
      other_names: body.otherNames || null,
      date_of_birth: convertToDBDate(body.dateOfBirth), // ✅ Convert to DB format
      gender: body.gender,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: `Failed to update: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Personal info updated');

    return NextResponse.json({
      success: true,
      message: 'Personal info saved',
    });

  } catch (error) {
    console.error('❌ Update personal error:', error);
    return NextResponse.json(
      { error: 'Failed to update personal info' },
      { status: 500 }
    );
  }
}
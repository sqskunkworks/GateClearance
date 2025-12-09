import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('📝 Updating rules acknowledgment...');

    const authSupabase = await createClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // ✅ Store Step 4 data in JSONB column
    const rulesQuizData = {
      rulesColor: body.rulesColor,
      rulesPhonePolicy: body.rulesPhonePolicy,
      rulesShareContact: body.rulesShareContact,
      rulesWrittenMaterials: body.rulesWrittenMaterials,
      acknowledgmentAgreement: body.acknowledgmentAgreement,
    };

    const { error } = await supabase
      .from('applications')
      .update({
        rules_quiz_answers: rulesQuizData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: `Failed to update: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Rules quiz saved to rules_quiz_answers JSONB');

    return NextResponse.json({
      success: true,
      message: 'Rules acknowledgment saved',
    });

  } catch (error) {
    console.error('❌ Update rules error:', error);
    return NextResponse.json(
      { error: 'Failed to update rules' },
      { status: 500 }
    );
  }
}
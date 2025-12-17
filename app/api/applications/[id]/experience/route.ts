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


    const authSupabase = await createClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const impactResponsesData = {
      engagedDirectly: body.engagedDirectly,
      perceptions: body.perceptions,
      expectations: body.expectations,
      justiceReformBefore: body.justiceReformBefore,
      interestsMost: body.interestsMost,
      reformFuture: body.reformFuture,
      additionalNotes: body.additionalNotes || null,
    };

    const { error } = await supabase
      .from('applications')
      .update({
        impact_responses: impactResponsesData,
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

    

    return NextResponse.json({
      success: true,
      message: 'Experience data saved',
    });

  } catch (error) {
   
    return NextResponse.json(
      { error: 'Failed to update experience' },
      { status: 500 }
    );
  }
}

// User-facing PDF download endpoint — authenticates via session, not admin secret
// Returns the CDCR 2311 PDF for the logged-in user's own application

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadBlank2311, fill2311, type AppRecord } from '@/lib/pdf2311';

export const runtime = 'nodejs';

const getServiceSupabase = (): SupabaseClient => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '';
  // Already in MM-DD-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
  // Convert from YYYY-MM-DD (DB format) to MM-DD-YYYY
  const [year, month, day] = dateStr.split('-');
  return `${month}-${day}-${year}`;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate via user session
    const authSupabase = await createClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // ✅ ensure user can only download their own application
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const record: AppRecord = {
      first_name: data.first_name,
      middle_name: data.middle_name,
      last_name: data.last_name,
      other_names: data.other_names,
      date_of_birth: formatDate(data.date_of_birth),
      phone_number: data.phone_number,
      email: data.email,
      company: data.company_or_organization,
      purpose_of_visit: data.purpose_of_visit,
      gender: data.gender,
      gov_id_type: data.government_id_type,
      gov_id_number: data.government_id_number,
      id_state: data.id_state ?? '',
      id_expiration: formatDate(data.id_expiration),
      signature_data_url: data.digital_signature ?? '',
      visited_inmate: data.visited_inmate ?? false,
      former_inmate: data.former_inmate ?? false,
      restricted_access: data.restricted_access ?? false,
      felony_conviction: data.felony_conviction ?? false,
      on_probation_parole: data.on_probation_parole ?? false,
      pending_charges: data.pending_charges ?? false,
      // SSN not stored in DB — omitted intentionally for security
      ssn_full: undefined,
    };

    const pdf = await loadBlank2311();
    await fill2311(pdf, record);
    const bytes = await pdf.save();

    const firstName = (data.first_name || '').replace(/[^a-zA-Z]/g, '');
    const lastName = (data.last_name || '').replace(/[^a-zA-Z]/g, '');
    const filename = `${firstName}_${lastName}_CDCR_2311.pdf`;

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });

  } catch (err) {
    console.error('PDF download failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
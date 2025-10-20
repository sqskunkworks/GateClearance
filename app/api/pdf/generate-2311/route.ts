import { NextResponse } from 'next/server';
import { loadBlank2311, fill2311, type AppRecord } from '@/lib/pdf2311';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';

// We won’t touch your existing client; use a SERVER client here.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Simple admin guard so we don’t change your auth flow:
// Send this header from your admin UI or cURL:  X-Admin-Secret: <value>
const ADMIN_SECRET = process.env.ADMIN_DOWNLOAD_SECRET!;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const applicationId = url.searchParams.get('applicationId');
    const secret = req.headers.get('x-admin-secret');

    if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!applicationId) {
      return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 });
    }

    // Fetch the app row. Adjust table/column names to your schema.
    // Expect a signature stored either at applications.signature_data_url
    // or inside a JSON field such as applications.form_values.digitalSignature
    const { data, error } = await supabase
      .from('applications')
      .select(`
        id,
        first_name,
        last_name,
        date_of_birth,
        phone_number,
        email,
        company,
        gov_id_type,
        gov_id_number,
        id_state,
        id_expiration,
        signature_data_url,
        form_values
      `)
      .eq('id', applicationId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Not found' }, { status: 404 });
    }

    // Normalize into our AppRecord type
    const record: AppRecord = {
      first_name: data.first_name ?? data.form_values?.firstName ?? '',
      last_name: data.last_name ?? data.form_values?.lastName ?? '',
      date_of_birth: data.date_of_birth ?? data.form_values?.dateOfBirth ?? '',
      phone_number: data.phone_number ?? data.form_values?.phoneNumber ?? '',
      email: data.email ?? data.form_values?.email ?? '',
      company: data.company ?? data.form_values?.companyOrOrganization ?? '',
      gov_id_type: (data.gov_id_type ?? data.form_values?.governmentIdType) as AppRecord['gov_id_type'],
      gov_id_number: data.gov_id_number ?? data.form_values?.governmentIdNumber ?? '',
      id_state: data.id_state ?? data.form_values?.idState ?? '',
      id_expiration: data.id_expiration ?? data.form_values?.idExpiration ?? '',
      signature_data_url:
        data.signature_data_url ??
        data.form_values?.digitalSignature ?? // if you stored from the signature pad
        '',
    };

    const pdf = await loadBlank2311();
    await fill2311(pdf, record);
    const bytes = await pdf.save();

    const filename = `CDCR_2311_${applicationId}.pdf`;
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to generate PDF' }, { status: 500 });
  }
}

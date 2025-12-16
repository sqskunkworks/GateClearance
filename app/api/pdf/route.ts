// app/api/pdf/route.ts

import { NextResponse } from 'next/server';
import { loadBlank2311, fill2311, type AppRecord } from '@/lib/pdf2311';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  // process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const ADMIN_SECRET = process.env.ADMIN_DOWNLOAD_SECRET!;

export async function POST(req: Request) {
  try {
  
    
    const secret = req.headers.get('x-admin-secret');
    
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAdminSecret: !!ADMIN_SECRET,
    });

    if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
      console.error('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { applicationId, ssn_full, ...extraFields } = body;

    if (!applicationId) {
      return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    if (!data) {

      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }



    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '';
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
      const [year, month, day] = dateStr.split('-');
      return `${month}-${day}-${year}`;
    };


    const record: AppRecord = {
      // From DB
      first_name: data.first_name,
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
      
      ssn_full: ssn_full || undefined,
    };

    let pdf;
    try {
      pdf = await loadBlank2311();
   
      await fill2311(pdf, record);

    } catch (pdfErr) {
      console.error('❌ PDF generation error:', pdfErr);
      console.error('Stack trace:', pdfErr instanceof Error ? pdfErr.stack : 'N/A');
      return NextResponse.json(
        { 
          error: 'PDF generation failed', 
          details: pdfErr instanceof Error ? pdfErr.message : String(pdfErr) 
        },
        { status: 500 }
      );
    }

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

  } catch (err: unknown) {
    console.error('Unhandled error in API route:', err);
    console.error('Error type:', typeof err);
    console.error('Stack trace:', err instanceof Error ? err.stack : 'N/A');
    const message = err instanceof Error ? err.message : 'Failed to generate PDF';
    return NextResponse.json({ 
      error: message,
      type: typeof err,
      details: err instanceof Error ? { message: err.message, stack: err.stack } : String(err)
    }, { status: 500 });
  }
}
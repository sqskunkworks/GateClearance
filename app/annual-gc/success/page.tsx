import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function AnnualGCSuccessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f9f8f6' }}>
      <div className="max-w-lg w-full text-center">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{ backgroundColor: '#1C3D5A' }}
        >
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-4" style={{ color: '#1F2933' }}>
          Application Submitted
        </h1>

        <p className="text-lg mb-6" style={{ color: '#1C3D5A' }}>
          Your Annual Gate Clearance application has been received. Our team will review your
          information and reach out if anything is needed.
        </p>

        <div
          className="rounded-2xl p-6 mb-8 text-left"
          style={{ backgroundColor: '#ffffff', border: '1px solid #E6E1D8' }}
        >
          <h2 className="font-semibold mb-3" style={{ color: '#1F2933' }}>What happens next</h2>
          <ul className="space-y-2 text-sm" style={{ color: '#1C3D5A' }}>
            <li>• Our team will review your application and supporting documents</li>
            <li>• You will be contacted if additional information is needed</li>
            <li>• CDCR processing typically takes 14+ business days</li>
            <li>• You will receive clearance status updates via the email you provided</li>
          </ul>
        </div>

        <div className="text-sm mb-8" style={{ color: '#1C3D5A' }}>
          Questions? Email us at{' '}
          <a
            href="mailto:clearance@sanquentinskunkworks.org"
            className="font-semibold hover:underline"
            style={{ color: '#355F7A' }}
          >
            clearance@sanquentinskunkworks.org
          </a>
        </div>

        {user && (
          <Link
            href="/"
            className="inline-block px-8 py-3 rounded-xl font-semibold text-white transition-colors"
            style={{ backgroundColor: '#355F7A' }}
          >
            Return Home
          </Link>
        )}
      </div>
    </div>
  );
}
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicationId = searchParams.get('id');
  const [downloading, setDownloading] = useState(false);
  const [applicantName, setApplicantName] = useState<{ first: string; last: string } | null>(null);

  useEffect(() => {
    if (!applicationId) {
      router.push('/test-application/1');
      return;
    }

    // Fetch applicant name for PDF filename
    fetch(`/api/applications/${applicationId}`)
      .then(res => res.json())
      .then(({ draft }) => {
        if (draft?.firstName && draft?.lastName) {
          setApplicantName({ first: draft.firstName, last: draft.lastName });
        }
      })
      .catch(() => {});
  }, [applicationId, router]);

  if (!applicationId) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/pdf/${applicationId}`);
      if (!response.ok) throw new Error('Failed to generate PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Use first_last_cdcr2311.pdf if name available, fallback to id
      const firstName = (applicantName?.first || '').replace(/[^a-zA-Z]/g, '');
      const lastName = (applicantName?.last || '').replace(/[^a-zA-Z]/g, '');
      a.download = firstName && lastName
        ? `${firstName}_${lastName}_cdcr2311.pdf`
        : `${applicationId}_cdcr2311.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download PDF. Please try again.');
      console.error('PDF download error:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen py-12" style={{ backgroundColor: '#f9f8f6' }}>
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg border p-8" style={{ borderColor: '#E6E1D8' }}>

          {/* Success header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#E6E1D8' }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#355F7A' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1F2933' }}>
              Application Submitted Successfully
            </h1>
            <p className="text-sm" style={{ color: '#1C3D5A' }}>
              Thank you for submitting your gate clearance application.
            </p>
          </div>

          <div className="border-t mb-6" style={{ borderColor: '#E6E1D8' }} />

          {/* Processing notice */}
          <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: '#E6E1D8' }}>
            <p className="text-sm font-medium" style={{ color: '#1C3D5A' }}>
              Our team will review and process your application shortly.
            </p>
          </div>

          {/* Important reminders */}
          <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: '#E6E1D8', border: '1px solid #CBB892' }}>
            <p className="text-sm font-semibold mb-2" style={{ color: '#1F2933' }}>Important Reminders</p>
            <ul className="text-sm space-y-1" style={{ color: '#1C3D5A' }}>
              <li>• Dress code: Wear black or professional attire</li>
              <li>• No electronics: Leave phones and keys in your car</li>
              <li>• Arrive early: Security screening takes time</li>
            </ul>
          </div>

          <div className="border-t mb-6" style={{ borderColor: '#E6E1D8' }} />

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#355F7A', color: '#ffffff' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2A4F67')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#355F7A')}
            >
              {downloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download CDCR 2311 (PDF)
                </>
              )}
            </button>

            <Link
              href="/"
              className="flex-1 flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-colors"
              style={{ backgroundColor: '#355F7A', color: '#ffffff' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2A4F67')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#355F7A')}
            >
              Return to Home
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
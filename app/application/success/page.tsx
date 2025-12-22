'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

function ApplicationSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicationId = searchParams.get('id');

  useEffect(() => {
    if (!applicationId) {
      router.push('/test-application');
    }
  }, [applicationId, router]);

  if (!applicationId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Application Submitted Successfully!
          </h1>
          <p className="text-gray-600">
            Your gate clearance application has been submitted Successfully.
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/test-application')}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Submit Another Application
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationSuccessPage() {
  return (
    <Suspense fallback={null}>
      <ApplicationSuccessContent />
    </Suspense>
  );
}

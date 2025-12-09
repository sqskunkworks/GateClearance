'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicationId = searchParams.get('id');
  const [application, setApplication] = useState<any>(null);

  useEffect(() => {
    if (!applicationId) {
      router.push('/test-application/1');
      return;
    }

    fetch(`/api/applications/${applicationId}`)
      .then((res) => res.json())
      .then((data) => setApplication(data.draft))
      .catch((err) => console.error('Error:', err));
  }, [applicationId, router]);

  if (!applicationId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg border p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold mb-4">Application Submitted Successfully</h1>
          <p className="text-gray-600 mb-6">Thank you for submitting your gate clearance application.</p>


          <div className="text-left bg-blue-50 border border-blue-200 rounded p-6 mb-6">
            <h2 className="font-bold mb-3">Our team will process the application shortly. </h2>
          </div>

          <div className="text-left bg-yellow-50 border border-yellow-200 rounded p-6 mb-6">
            <h2 className="font-bold mb-3">Important Reminders</h2>
            <ul className="space-y-2 text-sm">
              <li>Dress code: Wear black or professional attire</li>
              <li>No electronics: Leave phones and keys in your car</li>
              <li>Arrive early: Security screening takes time</li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center">
            <Link href="/" className="px-6 py-3 bg-black text-white rounded font-semibold hover:bg-gray-800">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
          <p className="text-gray-600 mt-2">We have sent you a verification link</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {email && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-1">Email sent to:</p>
              <p className="text-sm font-semibold text-gray-900 break-all">{email}</p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Check your inbox</p>
                <p className="text-sm text-gray-600 mt-1">
                  Look for an email from us and check spam folder too
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Click the verification link</p>
                <p className="text-sm text-gray-600 mt-1">
                  You will be automatically logged in and redirected to your application
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Start your application</p>
                <p className="text-sm text-gray-600 mt-1">
                  Begin filling out your clearance application form
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 my-6"></div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center">Did not receive the email?</p>
            
            <div className="flex flex-col gap-2">
              <Link
                href="/auth/signup"
                className="w-full py-2.5 px-4 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:border-gray-400 hover:bg-gray-50 transition-colors text-center text-sm"
              >
                Try signing up again
              </Link>
              
              <Link
                href="/"
                className="w-full py-2.5 px-4 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors text-center text-sm flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to home
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? <a href="mailto:devs@sqskunkworks.com" className="font-semibold text-black hover:underline">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </div>
    }>
      <CheckEmailContent />
    </Suspense>
  );
}
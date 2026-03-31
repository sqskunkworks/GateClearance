'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f9f8f6' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ backgroundColor: '#E6E1D8' }}
          >
            <Mail className="w-8 h-8" style={{ color: '#355F7A' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1F2933' }}>Check Your Email</h1>
          <p className="mt-2 text-sm" style={{ color: '#1C3D5A' }}>We have sent you a verification link</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8" style={{ border: '1px solid #E6E1D8' }}>
          {email && (
            <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#E6E1D8' }}>
              <p className="text-sm mb-1" style={{ color: '#1C3D5A' }}>Email sent to:</p>
              <p className="text-sm font-semibold break-all" style={{ color: '#1F2933' }}>{email}</p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                style={{ backgroundColor: '#1C3D5A' }}
              >
                1
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#1F2933' }}>Check your inbox</p>
                <p className="text-sm mt-1" style={{ color: '#1C3D5A' }}>
                  Look for an email from us and check spam folder too
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                style={{ backgroundColor: '#1C3D5A' }}
              >
                2
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#1F2933' }}>Click the verification link</p>
                <p className="text-sm mt-1" style={{ color: '#1C3D5A' }}>
                  You will be automatically logged in and redirected to your application
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: '#355F7A' }}
              >
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#1F2933' }}>Start your application</p>
                <p className="text-sm mt-1" style={{ color: '#1C3D5A' }}>
                  Begin filling out your clearance application form
                </p>
              </div>
            </div>
          </div>

          <div className="my-6" style={{ borderTop: '1px solid #E6E1D8' }} />

          <div className="space-y-3">
            <p className="text-sm text-center" style={{ color: '#1C3D5A' }}>Did not receive the email?</p>

            <div className="flex flex-col gap-2">
              <Link
                href="/auth/signup"
                className="w-full py-2.5 px-4 rounded-xl font-medium transition-colors text-center text-sm"
                style={{ border: '2px solid #355F7A', color: '#355F7A' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#E6E1D8'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'; }}
              >
                Try signing up again
              </Link>

              <Link
                href="/"
                className="w-full py-2.5 px-4 rounded-xl font-medium transition-colors text-center text-sm flex items-center justify-center gap-2"
                style={{ color: '#1C3D5A' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#E6E1D8'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'; }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to home
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: '#1C3D5A' }}>
            Need help?{' '}
            <a
              href="mailto:devs@sqskunkworks.com"
              className="font-semibold hover:underline"
              style={{ color: '#355F7A' }}
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9f8f6' }}>
        <div
          className="inline-block animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderBottomColor: '#355F7A' }}
        />
      </div>
    }>
      <CheckEmailContent />
    </Suspense>
  );
}
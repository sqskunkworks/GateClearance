import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/LogoutButton';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If logged in, check for existing draft
  let draftStatus = null;
  if (user) {
    const { data: apps } = await supabase
      .from('applications')
      .select('id, status, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (apps && apps.length > 0) {
      draftStatus = apps[0];
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">SQ Skunkworks</h1>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{user.email}</span>
              <LogoutButton />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Secure Gate Clearance Application
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Apply for gate clearance to visit San Quentin Skunkworks at San Quentin State Prison.
          </p>
          
          {/* Security Badge */}
          <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Your information is encrypted and used only for CDCR gate clearance processing.
          </div>
        </div>

        {/* About Section */}
        <div className="mb-16 text-center">
          <h3 className="text-2xl font-semibold mb-4">About San Quentin Skunkworks</h3>
          <p className="text-gray-600 mb-12">
            San Quentin Skunkworks About Section.
          </p>
          
          <h4 className="text-xl font-semibold mb-10">Clearance Process</h4>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h5 className="font-semibold mb-2">Submit at least 14 business days before your visit.</h5>
              <p className="text-sm text-gray-600">
                Allow sufficient time for CDCR background check processing.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h5 className="font-semibold mb-2">You'll need your legal name, SSN, and a valid ID.</h5>
              <p className="text-sm text-gray-600">
                Have your driver's license or passport ready for verification.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h5 className="font-semibold mb-2">Complete the online application form</h5>
              <p className="text-sm text-gray-600">
                Provide personal information, organization details, and background verification.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          {user ? (
            <>
              <p className="text-gray-700 mb-6">Ready to begin your application?</p>
              <Link
                href="/test-application/1"
                className="inline-block px-8 py-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Start Application
              </Link>
            </>
          ) : (
            <>
              <p className="text-gray-700 mb-6">Sign in or create an account to get started</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/signup"
                  className="px-8 py-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors text-center"
                >
                  Sign Up
                </Link>
                <Link
                  href="/auth/login"
                  className="px-8 py-4 bg-white text-black border-2 border-black rounded-lg font-semibold hover:bg-gray-50 transition-colors text-center"
                >
                  Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-gray-600">
          <p>
            For assistance, contact:{' '}
            <a 
              href="mailto:devs@sqskunkworks.com" 
              className="text-black font-semibold hover:underline"
            >
              devs@sqskunkworks.com
            </a>
          </p>
          <p className="mt-2">© 2026 SQ Skunkworks. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SQ Skunkworks</h1>
            <p className="text-sm text-gray-600">Gate Clearance Application System</p>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-500">Signed in</p>
              </div>
              <LogoutButton />
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Gate Clearance Application
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Apply for authorized access to San Quentin Skunkworks, an innovation lab at San Quentin State Prison.
          </p>
        </div>

        {/* Process Overview */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <h3 className="text-xl font-bold mb-6">About San Quentin Skunkworks</h3>
          <p className="text-gray-700 mb-4">
            San Quentin Skunkworks  About Section.
          </p>
          
          <h4 className="font-semibold text-lg mb-3 mt-6">Clearance Process</h4>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div>
                <p className="text-gray-600 text-sm">
                  Complete the online form with your personal information, organization details, and background verification.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* User Status & CTA */}
        {user ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">

            <Link
              href="/test-application/1"
              className="inline-block px-8 py-4 bg-black text-white rounded-xl font-semibold text-lg hover:bg-gray-800 transition-colors"
            >
              Start Application
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-black text-white rounded-xl font-semibold text-lg hover:bg-gray-800 transition-colors text-center"
            >
              Sign Up to Apply
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-4 bg-white text-black border-2 border-black rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors text-center"
            >
              Sign In
            </Link>
          </div>
        )}

        {!user && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account? <Link href="/auth/login" className="text-black font-semibold hover:underline">Sign in</Link>
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>For assistance, contact: <a href="mailto:clearance@sqskunkworks.com" className="text-black font-semibold hover:underline">clearance@sqskunkworks.com</a></p>
          <p className="mt-2">© 2024 SQ Skunkworks. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

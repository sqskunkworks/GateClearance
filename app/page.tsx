import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is logged in, go directly to form
  if (user) {
    redirect('/application/form');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">SQ Skunkworks</h1>
          <p className="text-sm text-gray-600">Gate Clearance Application System</p>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Gate Clearance Application
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Apply for authorized access to SQ Skunkworks facilities through our secure online application system.
          </p>
        </div>

        {/* Process Overview */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div>
                <h4 className="font-semibold mb-1">Submit Application</h4>
                <p className="text-gray-600 text-sm">
                  Complete the online form with your personal information, organization details, and background verification.
                </p>
              </div>
            </div>

          </div>
        </div>


        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="px-8 py-4 bg-black text-white rounded-xl font-semibold text-lg hover:bg-gray-800 transition-colors text-center"
          >
            Sign Up 
          </Link>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link href="/auth/login" className="text-black font-semibold hover:underline">Sign in</Link>
        </p>
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
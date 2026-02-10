import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/LogoutButton';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
            Gate Clearance for Visiting San Quentin SkunkWorks
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            This gate clearance application is for <strong>invited SkunkWorks guests only</strong>.
          </p>
          <p className="text-xl text-gray-600 mb-2">
            <strong>Submit at least 3 weeks before your visit.</strong> CDCR processing takes a minimum of 14 business days and can take longer.
          </p>
          <p className="text-xl text-gray-600 mb-8">
            Gate clearance is required for all visitors entering San Quentin State Prison. This process helps ensure a safe, respectful, and smooth experience for everyone inside.
          </p>
          
          {/* Security Badge */}
          <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            🔒 Your information is encrypted in transit and at rest. Access is limited to the SkunkWorks clearance coordinator and CDCR.
          </div>
        </div>

        {/* About Section */}
        <div className="mb-16 text-center">
          <h3 className="text-2xl font-semibold mb-4">About San Quentin SkunkWorks</h3>
          <p className="text-gray-600 mb-3">
            You're here because you've been invited to visit San Quentin SkunkWorks.
          </p>
          <p className="text-gray-600 mb-12">
            SkunkWorks is an incarcerated-led innovation lab inside San Quentin. When you visit, you'll meet the inside team and see the work in progress.
          </p>
          
          <h4 className="text-xl font-semibold mb-10">How Gate Clearance Works</h4>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h5 className="font-semibold mb-2">Apply in advance</h5>
              <p className="text-sm text-gray-600">
                Submit your application at least 3 weeks before your visit. CDCR background checks take time and cannot be expedited.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h5 className="font-semibold mb-2">Provide required information</h5>
              <p className="text-sm text-gray-600">
                CDCR requires your legal name, Social Security Number, and a valid, non-expired Driver's License or Passport to verify identity for prison entry.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h5 className="font-semibold mb-2">We coordinate next steps</h5>
              <p className="text-sm text-gray-600">
                Once submitted, our team reviews your application and contacts you if anything is missing. We'll use your contact information to coordinate clearance status, scheduling, and arrival logistics.
              </p>
            </div>
          </div>
        </div>

        {/* Before You Start */}
        <div className="mb-16 text-center">
          <h3 className="text-2xl font-semibold mb-4">Before You Start</h3>
          <p className="text-gray-600 mb-3">Please make sure:</p>
          <div className="max-w-2xl mx-auto text-left bg-gray-50 rounded-lg p-6">
            <ul className="space-y-2 text-gray-700">
              <li>• Your legal name matches your ID exactly</li>
              <li>• Your ID is valid and not expired</li>
              <li>• You can submit at least 3 weeks before your visit</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            You'll be asked for your SSN and ID in the next step. If you're not ready, you may want to review visitor guidelines first.
          </p>
        </div>

        {/* Know Before You Go */}
        <div className="mb-16 text-center">
          <h3 className="text-2xl font-semibold mb-4">Know Before You Go</h3>
          <p className="text-gray-600 mb-6">
            San Quentin operates under strict rules to protect everyone inside the facility. Following these guidelines helps ensure a smooth and respectful visit.
          </p>
          
          <div className="max-w-2xl mx-auto text-left bg-gray-50 rounded-lg p-6 mb-6">
            <h4 className="font-semibold mb-3">Key reminders:</h4>
            <ul className="space-y-2 text-gray-700 mb-6">
              <li>• Avoid these colors: blue, gray, green, orange, yellow, or white</li>
              <li>• Dress simply and professionally—no jeans, shorts, tight clothing, sleeveless tops, or open-toed shoes</li>
              <li>• Leave personal items behind; bring only your ID (and a clear water bottle if needed)</li>
              <li>• Please refrain from asking personal questions about people's pasts—these visits center leadership and work, not life stories</li>
            </ul>
            
            <h4 className="font-semibold mb-3">Required reading:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                • Visitor FAQ:{' '}
                <a href="https://link.sanquentinskunkworks.org/SQFAQ" target="_blank" rel="noopener noreferrer" className="text-black font-semibold hover:underline">
                  https://link.sanquentinskunkworks.org/SQFAQ
                </a>
              </li>
              <li>
                • Visitor Rules:{' '}
                <a href="https://link.sanquentinskunkworks.org/SQRules" target="_blank" rel="noopener noreferrer" className="text-black font-semibold hover:underline">
                  https://link.sanquentinskunkworks.org/SQRules
                </a>
              </li>
              <li>
                • Dress Code:{' '}
                <a href="https://link.sanquentinskunkworks.org/SQDressCode" target="_blank" rel="noopener noreferrer" className="text-black font-semibold hover:underline">
                  https://link.sanquentinskunkworks.org/SQDressCode
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Why We Ask */}
        <div className="mb-16 text-center">
          <h3 className="text-2xl font-semibold mb-4">Why We Ask for This Information</h3>
          <p className="text-gray-600 mb-3">
            CDCR requires certain information to run a mandatory background check for entry into San Quentin State Prison.
          </p>
          <p className="text-gray-600 mb-3">
            San Quentin SkunkWorks also uses your contact information to:
          </p>
          <div className="max-w-2xl mx-auto text-left bg-gray-50 rounded-lg p-6">
            <ul className="space-y-2 text-gray-700">
              <li>• Coordinate your visit</li>
              <li>• Share clearance status updates</li>
              <li>• Provide day-of arrival and logistics information</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            We do not sell your information or use it for marketing or fundraising outreach.
          </p>
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
          <h4 className="font-semibold mb-4">Need Help?</h4>
          <div className="space-y-3 mb-6">
            <p>
              Questions about clearance, scheduling, or your visit:
            </p>
            <p>
              📧{' '}
              <a 
                href="mailto:clearance@sanquentinskunkworks.org" 
                className="text-black font-semibold hover:underline"
              >
                clearance@sanquentinskunkworks.org
              </a>
              {' '}(we typically respond within one business day)
            </p>
            <p>
              Having trouble with this form? Use the legacy gate clearance form:{' '}
              <a 
                href="https://link.sanquentinskunkworks.org/gate-clearance" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-black font-semibold hover:underline"
              >
                https://link.sanquentinskunkworks.org/gate-clearance
              </a>
            </p>
            <p>
              Technical issues (login, errors, page not loading):
            </p>
            <p>
              📧{' '}
              <a 
                href="mailto:codeworks@sanquentinskunkworks.org" 
                className="text-black font-semibold hover:underline"
              >
                codeworks@sanquentinskunkworks.org
              </a>
            </p>
          </div>
          <div className="border-t pt-6">
            <p className="mb-2">© 2026 San Quentin SkunkWorks</p>
            <p>A 501(c)(3) nonprofit operating with CDCR approval inside San Quentin State Prison</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
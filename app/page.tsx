import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/LogoutButton';
import { CTAButtons } from '@/components/CTAButtons';


export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b" style={{ borderColor: '#E6E1D8' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold" style={{ color: '#1F2933' }}>SQ Skunkworks</h1>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: '#1C3D5A' }}>{user.email}</span>
              <LogoutButton />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4" style={{ color: '#1F2933' }}>
            Gate Clearance for Visiting San Quentin SkunkWorks
          </h2>
          <p className="text-xl mb-8" style={{ color: '#1C3D5A' }}>
            This gate clearance application is for <strong>invited SkunkWorks guests only</strong>.{' '}
            <strong>Submit at least 3 weeks before your visit.</strong> CDCR processing takes a minimum
            of 14 business days and can take longer. Gate clearance is required for all visitors entering
            San Quentin State Prison. This process helps ensure a safe, respectful, and smooth experience
            for everyone inside.
          </p>

          {/* Security Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
            style={{ backgroundColor: '#E6E1D8', border: '1px solid #CBB892', color: '#1C3D5A' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
             Your information is encrypted in transit and at rest. Access is limited to the SkunkWorks clearance coordinator and CDCR.
          </div>
        </div>

        {/* About Section */}
        <div className="mb-16 text-center">
          <h3 className="text-2xl font-semibold mb-4" style={{ color: '#1F2933' }}>About San Quentin SkunkWorks</h3>
          <p className="mb-4" style={{ color: '#1C3D5A' }}>
            You're here because you've been invited to visit San Quentin SkunkWorks. SkunkWorks is an
            incarcerated-led innovation lab inside San Quentin. When you visit, you'll meet the inside
            team and see the work in progress.
          </p>
          <p className="mb-12" style={{ color: '#1C3D5A' }}>
            San Quentin regularly hosts vetted visitors, including public officials, celebrities,
            researchers, educators, and community partners. Gate clearance is required for everyone
            entering the prison and helps ensure a safe, respectful, and smooth experience for everyone.
          </p>

          <h4 className="text-xl font-semibold mb-10" style={{ color: '#1F2933' }}>How Gate Clearance Works</h4>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 text-white"
                style={{ backgroundColor: '#1C3D5A' }}
              >
                1
              </div>
              <h5 className="font-semibold mb-2" style={{ color: '#1F2933' }}>Apply in advance</h5>
              <p className="text-sm" style={{ color: '#1C3D5A' }}>
                Submit your application at least 3 weeks before your visit. CDCR background checks take
                time and cannot be expedited.
              </p>
            </div>

            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 text-white"
                style={{ backgroundColor: '#1C3D5A' }}
              >
                2
              </div>
              <h5 className="font-semibold mb-2" style={{ color: '#1F2933' }}>Provide required information</h5>
              <p className="text-sm" style={{ color: '#1C3D5A' }}>
                CDCR requires your legal name, Social Security Number, and a valid, non-expired
                Driver's License or Passport to verify identity for prison entry.
              </p>
            </div>

            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 text-white"
                style={{ backgroundColor: '#1C3D5A' }}
              >
                3
              </div>
              <h5 className="font-semibold mb-2" style={{ color: '#1F2933' }}>We coordinate next steps</h5>
              <p className="text-sm" style={{ color: '#1C3D5A' }}>
                Once submitted, our team reviews your application and contacts you if anything is
                missing. We'll use your contact information to coordinate clearance status, scheduling,
                and arrival logistics.
              </p>
            </div>
          </div>
        </div>

        {/* Before You Start */}
        <div className="mb-16 text-center">
          <h3 className="text-2xl font-semibold mb-4" style={{ color: '#1F2933' }}>Before You Start</h3>
          <p className="mb-4" style={{ color: '#1C3D5A' }}>
            Please make sure: Your legal name matches your ID exactly. Your ID is valid and not expired.
            You can submit at least 3 weeks before your visit.
          </p>
          <p style={{ color: '#1C3D5A' }}>
            You'll be asked for your SSN and ID in the next step. If you're not ready, you may want to
            review visitor guidelines first.
          </p>
        </div>

        {/* Know Before You Go */}
        <div className="mb-16 text-center">
          <h3 className="text-2xl font-semibold mb-4" style={{ color: '#1F2933' }}>Know Before You Go</h3>
          <p className="mb-4" style={{ color: '#1C3D5A' }}>
            San Quentin operates under strict rules to protect everyone inside the facility. Following
            these guidelines helps ensure a smooth and respectful visit.
          </p>
          <p className="mb-4" style={{ color: '#1C3D5A' }}>
            <strong>Key reminders:</strong> Avoid these colors: blue, gray, green, orange, yellow, or
            white. Dress simply and professionally—no jeans, shorts, tight clothing, sleeveless tops, or
            open-toed shoes. Leave personal items behind; bring only your ID (and a clear water bottle if
            needed). Please refrain from asking personal questions about people's pasts—these visits
            center leadership and work, not life stories.
          </p>
          <p style={{ color: '#1C3D5A' }}>
            <strong>Required reading:</strong>{' '}
            <a href="https://link.sanquentinskunkworks.org/SQFAQ" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: '#355F7A' }}>
              Visitor FAQ
            </a>
            ,{' '}
            <a href="https://link.sanquentinskunkworks.org/SQRules" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: '#355F7A' }}>
              Visitor Rules
            </a>
            ,{' '}
            <a href="https://link.sanquentinskunkworks.org/SQDressCode" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: '#355F7A' }}>
              Dress Code
            </a>
          </p>
        </div>

        {/* Why We Ask */}
        <div className="mb-16 text-center">
          <h3 className="text-2xl font-semibold mb-4" style={{ color: '#1F2933' }}>Why We Ask for This Information</h3>
          <p className="mb-4" style={{ color: '#1C3D5A' }}>
            CDCR requires certain information to run a mandatory background check for entry into the facility.
          </p>
          <p className="mb-2" style={{ color: '#1C3D5A' }}>
            San Quentin SkunkWorks also uses your contact information to:
          </p>
          <ul className="space-y-1 max-w-md mx-auto text-left" style={{ color: '#1C3D5A' }}>
            <li>• Coordinate your visit</li>
            <li>• Share clearance status updates</li>
            <li>• Provide day-of arrival and logistics information</li>
          </ul>
        </div>

        {/* CTA */}
<div className="text-center">
  <CTAButtons isLoggedIn={!!user} />
</div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20 py-8" style={{ borderColor: '#E6E1D8' }}>
        <div className="max-w-4xl mx-auto px-6 text-center text-sm" style={{ color: '#1C3D5A' }}>
          <p className="font-semibold mb-2" style={{ color: '#1F2933' }}>Need Help?</p>
          <p className="mb-2">
            Questions about clearance, scheduling, or your visit: 📧{' '}
            <a href="mailto:clearance@sanquentinskunkworks.org" className="font-semibold hover:underline" style={{ color: '#355F7A' }}>
              clearance@sanquentinskunkworks.org
            </a>
            {' '}(we typically respond within one business day)
          </p>
          <p className="mb-2">
            Having trouble with this form? Use the legacy gate clearance form:{' '}
            <a href="https://link.sanquentinskunkworks.org/gate-clearance" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: '#355F7A' }}>
              https://link.sanquentinskunkworks.org/gate-clearance
            </a>
          </p>
          <p className="mb-4">
            Technical issues (login, errors, page not loading): 📧{' '}
            <a href="mailto:codeworks@sanquentinskunkworks.org" className="font-semibold hover:underline" style={{ color: '#355F7A' }}>
              codeworks@sanquentinskunkworks.org
            </a>
          </p>
          <p className="mt-2">© 2026 San Quentin SkunkWorks</p>
          <p>A 501(c)(3) nonprofit operating with CDCR approval inside San Quentin State Prison</p>
        </div>
      </footer>
    </div>
  );
}
'use client';

import { useRouter, useParams } from 'next/navigation';
import { LogoutButton } from '@/components/LogoutButton';

export default function AnnualGCPage() {
  const router = useRouter();
  const params = useParams();
  const currentStep = parseInt(params.step as string);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Annual Gate Clearance Application</h1>
              <p className="text-sm text-gray-500 mt-1">Extended clearance for multiple visits</p>
            </div>
            <LogoutButton />
          </div>

          {/* Progress Bar */}
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div
                key={step}
                className="flex flex-col items-center"
                style={{ width: `${100 / 6}%` }}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold mb-2 ${
                    step === currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step}
                </div>
                <span className="text-xs text-gray-500">Step {step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full mb-6">
              🚧 Under Construction
            </div>
            
            <h2 className="text-3xl font-bold mb-4">
              Annual Gate Clearance - Step {currentStep}
            </h2>
            
            <p className="text-gray-600 mb-8">
              This is a placeholder for the Annual Gate Clearance application flow.
              This form will include additional fields and requirements for annual clearance.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold mb-2">Coming Soon:</h3>
              <ul className="text-sm text-gray-700 text-left space-y-2">
                <li>• Extended personal information</li>
                <li>• Detailed organization verification</li>
                <li>• Visit frequency and schedule</li>
                <li>• Enhanced background checks</li>
                <li>• Multiple reference contacts</li>
                <li>• Annual agreement and terms</li>
              </ul>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  if (currentStep === 1) {
                    router.push('/');
                  } else {
                    router.push(`/annual-gc/${currentStep - 1}`);
                  }
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                {currentStep === 1 ? 'Back to Home' : 'Previous Step'}
              </button>

              {currentStep < 6 && (
                <button
                  onClick={() => router.push(`/annual-gc/${currentStep + 1}`)}
                  className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                >
                  Next Step (Demo)
                </button>
              )}

              {currentStep === 6 && (
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                >
                  Complete (Demo)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
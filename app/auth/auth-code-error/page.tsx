import Link from 'next/link';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Verification Failed
        </h1>
        
        <p className="text-gray-600 mb-6">
          There was a problem verifying your email. The link may have expired or already been used.
        </p>
        
        <div className="space-y-3">
          <Link
            href="/auth/signup"
            className="block w-full px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
          >
            Try Signing Up Again
          </Link>
          
          <Link
            href="/auth/login"
            className="block w-full px-6 py-3 border-2 border-black text-black rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Go to Login
          </Link>
        </div>
        
        <p className="mt-6 text-sm text-gray-500">
          Need help? <a href="mailto:devs@sqskunkworks.com" className="text-black font-semibold hover:underline">Contact support</a>
        </p>
      </div>
    </div>
  );
}
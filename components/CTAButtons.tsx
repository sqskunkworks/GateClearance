'use client';

import Link from 'next/link';

export function CTAButtons({ isLoggedIn }: { isLoggedIn: boolean }) {
  if (isLoggedIn) {
    return (
      <>
        <p className="mb-6" style={{ color: '#1C3D5A' }}>Ready to begin your application?</p>
        <Link
          href="/test-application/1"
          className="inline-block px-8 py-4 rounded-lg font-semibold text-white transition-colors"
          style={{ backgroundColor: '#355F7A' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#2A4F67'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#355F7A'; }}
        >
          Start Application
        </Link>
      </>
    );
  }

  return (
    <>
      <p className="mb-6" style={{ color: '#1C3D5A' }}>Sign in or create an account to get started</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/auth/signup"
          className="px-8 py-4 rounded-lg font-semibold text-white transition-colors text-center"
          style={{ backgroundColor: '#355F7A' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#2A4F67'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#355F7A'; }}
        >
          Sign Up
        </Link>
        <Link
          href="/auth/login"
          className="px-8 py-4 rounded-lg font-semibold transition-colors text-center"
          style={{ backgroundColor: '#ffffff', color: '#355F7A', border: '2px solid #355F7A' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#E6E1D8'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#ffffff'; }}
        >
          Sign In
        </Link>
      </div>
    </>
  );
}
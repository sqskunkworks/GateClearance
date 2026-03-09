'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/test-application/1';
  const supabase = createClient();

  useEffect(() => {
    const confirmed = searchParams.get('confirmed');
    const errorParam = searchParams.get('error');
    if (confirmed === 'true') setSuccess('Email confirmed! You can now sign in.');
    if (errorParam === 'confirmation_failed') setError('Email confirmation failed. Please try again or contact support.');
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session) throw new Error('Unable to create session. Please try again or contact support.');
      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f9f8f6' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: '#1C3D5A' }}>
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1F2933' }}>Welcome Back</h1>
          <p className="mt-2 text-sm" style={{ color: '#1C3D5A' }}>Sign in to continue to your clearance application</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8" style={{ border: '1px solid #E6E1D8' }}>
          <form onSubmit={handleLogin} className="space-y-5">
            {success && (
              <div className="flex items-start gap-3 p-4 rounded-xl text-sm" style={{ backgroundColor: '#E6E1D8', border: '1px solid #CBB892', color: '#1F2933' }}>
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#355F7A' }} />
                <span>{success}</span>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-900">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#1C3D5A' }} />
                <input
                  id="email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0"
                  style={{ border: '1px solid #E6E1D8' }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium" style={{ color: '#1F2933' }}>Password</label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium hover:underline"
                  style={{ color: '#355F7A' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#1C3D5A' }} />
                <input
                  id="password" type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2"
                  style={{ border: '1px solid #E6E1D8' }}
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-colors"
              style={{ backgroundColor: loading ? '#9ca3af' : '#355F7A', cursor: loading ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#2A4F67'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#355F7A'; }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: '#1C3D5A' }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-semibold hover:underline" style={{ color: '#355F7A' }}>
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
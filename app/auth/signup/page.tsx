'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Mail, Lock, User, AlertCircle } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          setError('This email is already registered. Please sign in instead.');
          return;
        }
        throw error;
      }
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setError('This email is already registered. Please sign in instead.');
        return;
      }
      router.push(`/auth/check-email?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
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
          <h1 className="text-2xl font-bold" style={{ color: '#1F2933' }}>Create Account</h1>
          <p className="mt-2 text-sm" style={{ color: '#1C3D5A' }}>Get started with your clearance application</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8" style={{ border: '1px solid #E6E1D8' }}>
          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-900">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#1C3D5A' }} />
                <input id="fullName" type="text" required value={fullName}
                  onChange={(e) => setFullName(e.target.value)} placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2"
                  style={{ border: '1px solid #E6E1D8' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#1C3D5A' }} />
                <input id="email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2"
                  style={{ border: '1px solid #E6E1D8' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#1C3D5A' }} />
                <input id="password" type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2"
                  style={{ border: '1px solid #E6E1D8' }}
                />
              </div>
              <p className="mt-1 text-xs" style={{ color: '#1C3D5A' }}>Must be at least 6 characters</p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-colors"
              style={{ backgroundColor: loading ? '#9ca3af' : '#355F7A', cursor: loading ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#2A4F67'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#355F7A'; }}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: '#1C3D5A' }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: '#355F7A' }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
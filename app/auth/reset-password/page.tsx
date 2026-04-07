'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Shield, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Sign out to fully clear the recovery session so future
      // forgot-password flows work cleanly
      await supabase.auth.signOut();

      setDone(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
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
          <h1 className="text-2xl font-bold" style={{ color: '#1F2933' }}>Set New Password</h1>
          <p className="mt-2 text-sm" style={{ color: '#1C3D5A' }}>Choose a new password for your account.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8" style={{ border: '1px solid #E6E1D8' }}>
          {done ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full" style={{ backgroundColor: '#E6E1D8' }}>
                <CheckCircle className="w-6 h-6" style={{ color: '#355F7A' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: '#1F2933' }}>Password updated!</p>
              <p className="text-sm" style={{ color: '#1C3D5A' }}>Redirecting you to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-900">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#1C3D5A' }} />
                  <input
                    id="password" type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2"
                    style={{ border: '1px solid #E6E1D8' }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirm" className="block text-sm font-medium mb-2" style={{ color: '#1F2933' }}>Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#1C3D5A' }} />
                  <input
                    id="confirm" type="password" required value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter new password"
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
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
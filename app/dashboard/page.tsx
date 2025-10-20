'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push('/auth/login');
  }, [user]);

  if (!user) return <p>Loading...</p>;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <h1 className="text-2xl font-bold">Welcome, {user.email}</h1>
      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-4 py-2 mt-4 rounded"
      >
        Logout
      </button>
    </div>
  );
}

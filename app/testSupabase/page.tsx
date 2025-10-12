'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TestSupabasePage() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase.from('applications').select('*').limit(1);
      if (error) setMessage(`Error: ${error.message}`);
      else setMessage(`Success! Fetched ${data.length} row(s).`);
    };

    testConnection();
  }, []);

  return <div className="p-6 text-lg">{message}</div>;
}

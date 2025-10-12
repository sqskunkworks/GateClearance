'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Define the type for the Auth Context values
type AuthContextType = {
  user: any | null; // Supabase user object or null
  isLoading: boolean; // True while the initial check is pending
};

// Initialize context with default loading values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Check for current session immediately upon component mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      // CRITICAL: Set loading to false once the initial state is determined
      setIsLoading(false); 
    });

    // 2. Set up a listener for real-time changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      // The listener automatically handles subsequent state changes
      // after the initial load.
    });

    // Cleanup the listener when the component unmounts
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

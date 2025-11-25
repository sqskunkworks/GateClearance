'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { SectionForm } from '@/components/SectionForm';
// Import your configs
import { 
  rulesConfig, 
  personalConfig, 
  contactOrgConfig, 
  experienceConfig, 
  securityConfig 
} from '@/components/SectionForm';

type FormClientProps = {
  user: User;
};

export default function FormClient({ user }: FormClientProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  const steps = [
    rulesConfig,
    personalConfig,
    contactOrgConfig,
    experienceConfig,
    securityConfig,
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  const handleSubmit = async (values: Record<string, any>) => {
    console.log('Step submitted:', values);
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      alert('Application completed!');
      // Handle final submission to your API
    }
  };

  return (
    <div className="relative">
      {/* Header with user info */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 px-4 py-2 text-sm">
          <span className="text-gray-600">Signed in as </span>
          <span className="font-medium">{user.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-white/90 backdrop-blur rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Progress */}
      <div className="fixed top-20 right-4 z-50 bg-white/90 backdrop-blur rounded-xl border border-gray-200 px-4 py-2 text-sm">
        Step {currentStep + 1} of {steps.length}
      </div>

      {/* Current form step */}
      <SectionForm
        config={steps[currentStep]}
        onSubmit={handleSubmit}
        clearOnSuccess={false}
      />
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { SectionForm } from '@/components/SectionForm';
import { LogoutButton } from '@/components/LogoutButton';
import {
  personalConfig,
  contactOrgConfig,
  experienceConfig,
  rulesConfig,
  securityConfig,
} from '@/lib/stepConfigs';

const STEP_CONFIGS = [
  { num: 1, label: 'Personal', config: personalConfig },
  { num: 2, label: 'Contact', config: contactOrgConfig },
  { num: 3, label: 'Experience', config: experienceConfig },
  { num: 4, label: 'Rules', config: rulesConfig },
  { num: 5, label: 'Security', config: securityConfig },
];

export default function StepPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const currentStep = parseInt(params.step as string);
  const applicationIdFromUrl = searchParams.get('id');
  
  const [applicationId, setApplicationId] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  console.log('🎯 StepPage render:', { currentStep, applicationIdFromUrl, hasFormData: Object.keys(formData).length > 0 });

  useEffect(() => {
    console.log('🔄 useEffect triggered:', { currentStep, applicationIdFromUrl });
    loadFormData();
  }, [applicationIdFromUrl, currentStep]);

  const loadFormData = async () => {
    try {
      console.log('📂 loadFormData called:', { currentStep, applicationIdFromUrl });

      if (applicationIdFromUrl) {
        console.log('✅ ID found in URL, loading draft...');
        setApplicationId(applicationIdFromUrl);
        await loadDraft(applicationIdFromUrl);
        return;
      }

      if (currentStep === 1) {
        const newId = crypto.randomUUID();
        console.log('🆕 Step 1 without ID, generating new:', newId);
        setApplicationId(newId);
        setFormData({});
        setLoading(false);
        return;
      }

      console.log('⚠️ No ID on Step', currentStep, '- redirecting to Step 1');
      router.push('/test-application/1');
      setLoading(false);
    } catch (error) {
      console.error('❌ loadFormData error:', error);
      setLoading(false);
    }
  };

  const loadDraft = async (appId: string) => {
    try {
      console.log('📥 loadDraft starting for:', appId);
      
      const response = await fetch(`/api/applications/${appId}`);
      console.log('📡 GET response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ GET failed:', response.status, response.statusText);
        throw new Error('Failed to load');
      }

      const { draft } = await response.json();
      console.log('✅ Draft loaded from DB:', draft);
      
      // ✅ Load visit date from sessionStorage
      const visitDate = sessionStorage.getItem(`app_${appId}_visitDate`);
      if (visitDate) {
        draft.visitDate = visitDate;
        draft.preferredVisitDate = visitDate;
        console.log('✅ Loaded visit date from sessionStorage:', visitDate);
      }
      
      setFormData(draft);
      setLoading(false);
    } catch (error) {
      console.error('❌ loadDraft error:', error);
      setLoading(false);
    }
  };

  const handleStepComplete = async (payload: any) => {
    console.log('🚀 handleStepComplete:', { currentStep, payload, applicationId });
    
    const updatedFormData = { ...formData, ...payload };
    setFormData(updatedFormData);

    try {
      if (currentStep === 1) {
        if (applicationIdFromUrl) {
          console.log('💾 Step 1: Updating existing personal info...');
          
          const response = await fetch(`/api/applications/${applicationId}/personal`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedFormData),
          });

          const result = await response.json();
          console.log('📡 PATCH response:', { status: response.status, result });

          if (!response.ok) {
            console.error('❌ Update failed:', result);
            throw new Error(result.error);
          }

          setLastSaved(new Date());
          console.log('✅ Personal info updated, navigating to Step 2');
          router.push(`/test-application/2?id=${applicationId}`);
          return;
        } else {
          console.log('💾 Step 1: Creating new draft...');
          
          const response = await fetch('/api/applications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              applicationId,
              ...updatedFormData,
            }),
          });

          const result = await response.json();
          console.log('📡 POST response:', { status: response.status, result });

          if (!response.ok) {
            console.error('❌ Create failed:', result);
            throw new Error(result.error);
          }

          setLastSaved(new Date());
          console.log('✅ Draft created, navigating to Step 2 with ID:', applicationId);
          
          window.history.replaceState(null, '', `/test-application/1?id=${applicationId}`);
          router.push(`/test-application/2?id=${applicationId}`);
          return;
        }
      }

      if (currentStep === 2) {
        console.log('💾 Step 2: Updating contact...');
        const visitDate = updatedFormData.visitDate || updatedFormData.preferredVisitDate;
        if (visitDate) {
          sessionStorage.setItem(`app_${applicationId}_visitDate`, visitDate);
          console.log('✅ Saved visit date to sessionStorage:', visitDate);
        }
        
        const response = await fetch(`/api/applications/${applicationId}/contact`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFormData),
        });

        if (!response.ok) {
          const result = await response.json();
          console.error('❌ Contact update failed:', result);
          throw new Error(result.error);
        }

        setLastSaved(new Date());
        console.log('✅ Contact saved, navigating to Step 3');
        router.push(`/test-application/3?id=${applicationId}`);
        return;
      }

      if (currentStep === 3) {
        console.log('💾 Step 3: Updating experience...');
        
        const response = await fetch(`/api/applications/${applicationId}/experience`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFormData),
        });
      
        if (!response.ok) {
          const result = await response.json();
          console.error('❌ Experience update failed:', result);
          throw new Error(result.error);
        }
      
        setLastSaved(new Date());
        console.log('✅ Experience saved, navigating to Step 4');
        router.push(`/test-application/4?id=${applicationId}`);
        return;
      }
      
      if (currentStep === 4) {
        console.log('💾 Step 4: Updating rules...');
        
        const response = await fetch(`/api/applications/${applicationId}/rules`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFormData),
        });
      
        if (!response.ok) {
          const result = await response.json();
          console.error('❌ Rules update failed:', result);
          throw new Error(result.error);
        }
      
        setLastSaved(new Date());
        console.log('✅ Rules saved, navigating to Step 5');
        router.push(`/test-application/5?id=${applicationId}`);
        return;
      }

      if (currentStep === 5) {
        setIsSubmitting(true);
        console.log('💾 Step 5: Saving security info first...');
      
        // First, save non-file security data via JSON
        const securityDataWithoutFiles = { ...updatedFormData };
        delete securityDataWithoutFiles.passportScan;
        delete securityDataWithoutFiles.wardenLetter;
      
        const securityResponse = await fetch(`/api/applications/${applicationId}/security`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(securityDataWithoutFiles),
        });
      
        if (!securityResponse.ok) {
          const result = await securityResponse.json();
          console.error('❌ Security update failed:', result);
          setIsSubmitting(false);
          throw new Error(result.error);
        }
      
        console.log('✅ Security saved, now submitting with FormData...');
      
        // ✅ Use FormData for final submit (includes files)
        const formData = new FormData();
        
        // Add applicationId
        formData.append('applicationId', applicationId);
        
        // Add all form fields
        Object.keys(updatedFormData).forEach((key) => {
          const value = updatedFormData[key];
          
          if (value instanceof File) {
            // Add files directly
            formData.append(key, value);
            console.log(`📎 Added file: ${key} (${value.name})`);
          } else if (value !== null && value !== undefined) {
            // Add regular fields as strings
            formData.append(key, String(value));
          }
        });
      
        console.log('📤 Submitting with FormData...');
      
        const submitResponse = await fetch('/api/applications/submit', {
          method: 'POST',
          body: formData, // ✅ Send FormData (no Content-Type header needed)
        });
      
        const submitResult = await submitResponse.json();
        console.log('📡 Submit response:', { status: submitResponse.status, submitResult });
      
        if (!submitResponse.ok) {
          setIsSubmitting(false);
          if (submitResult.allErrors) {
            const errors = submitResult.allErrors
              .map((e: any) => `${e.field}: ${e.message}`)
              .join('\n');
            alert(`Validation failed:\n\n${errors}`);
          } else {
            alert(`Error: ${submitResult.error}`);
          }
          return;
        }
      
        console.log('✅ Submitted successfully');
        sessionStorage.removeItem(`app_${applicationId}_visitDate`);
        router.push(`/test-application/success?id=${applicationId}`);
      }
    } catch (error) {
      setIsSubmitting(false);
      console.error('❌ handleStepComplete error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const currentConfig = STEP_CONFIGS.find((s) => s.num === currentStep);

  if (!currentConfig) {
    router.push('/test-application/1');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading Overlay for Submit */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black"></div>
              <p className="text-xl font-semibold text-center">Submitting your application...</p>
              <p className="text-sm text-gray-600 text-center">
                Please wait while we process your information. This may take a moment.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Gate Clearance Application</h1>
              {lastSaved && (
                <p className="text-xs text-gray-500 mt-1">
                  Last saved {lastSaved.toLocaleTimeString()}
                </p>
              )}
            </div>
            <LogoutButton />
          </div>

          <div className="relative">
            <div className="flex items-start justify-between">
              {STEP_CONFIGS.map((step) => (
                <div
                  key={step.num}
                  className="flex flex-col items-center"
                  style={{ width: `${100 / STEP_CONFIGS.length}%` }}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold mb-2 relative z-10 ${
                      step.num < currentStep
                        ? 'bg-green-500 text-white'
                        : step.num === currentStep
                        ? 'bg-black text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.num < currentStep ? '✓' : step.num}
                  </div>

                  <span
                    className={`text-xs text-center ${
                      step.num <= currentStep ? 'text-black font-medium' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="absolute top-5 left-0 right-0 flex items-center px-[10%]">
              <div className="flex-1 flex items-center gap-0">
                {STEP_CONFIGS.slice(0, -1).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 ${
                      currentStep > idx + 1 ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SectionForm
        config={currentConfig.config}
        initialValues={formData}
        onSubmit={handleStepComplete}
      />
    </div>
  );
}
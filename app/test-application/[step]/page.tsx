'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { SectionForm, type FormValues } from '@/components/SectionForm';
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
  const [formData, setFormData] = useState<FormValues>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const loadDraft = useCallback(
    async (appId: string) => {
      try {
        const response = await fetch(`/api/applications/${appId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load');
        }

        const { draft }: { draft: FormValues } = await response.json();
 
        const visitDate = sessionStorage.getItem(`app_${appId}_visitDate`);
        if (visitDate) {
          draft.visitDate = visitDate;
          draft.preferredVisitDate = visitDate;
        }
        
        setFormData(draft);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load draft', error);
        setLoading(false);
      }
    },
    []
  );

  const loadFormData = useCallback(async () => {
    try {
      if (applicationIdFromUrl) {
        setApplicationId(applicationIdFromUrl);
        await loadDraft(applicationIdFromUrl);
        return;
      }

      if (currentStep === 1) {
        const newId = crypto.randomUUID();
        setApplicationId(newId);
        setFormData({});
        setLoading(false);
        return;
      }

      router.push('/test-application/1');
      setLoading(false);
    } catch (error) {
      console.error('Failed to load form data', error);
      setLoading(false);
    }
  }, [applicationIdFromUrl, currentStep, loadDraft, router]);

  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

  // Auto-save draft function (reused for back button)
  const saveDraft = useCallback(async () => {
    if (!applicationId || !formData) return;

    try {
      const endpoint = currentStep === 1 ? 'personal' : 
                      currentStep === 2 ? 'contact' :
                      currentStep === 3 ? 'experience' :
                      currentStep === 4 ? 'rules' : 'security';

      await fetch(`/api/applications/${applicationId}/${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [applicationId, currentStep, formData]);

  // Handle back button
  const handleBack = async () => {
    // Save current state before navigating
    await saveDraft();

    if (currentStep === 1) {
      // Go back to landing page
      router.push('/');
    } else {
      // Go to previous step
      router.push(`/test-application/${currentStep - 1}?id=${applicationId}`);
    }
  };

  const handleStepComplete = async (payload: FormValues) => {
    const updatedFormData = { ...formData, ...payload };
    setFormData(updatedFormData);

    try {
      if (currentStep === 1) {
        if (applicationIdFromUrl) {
          const response = await fetch(`/api/applications/${applicationId}/personal`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedFormData),
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error);
          }

          setLastSaved(new Date());
          router.push(`/test-application/2?id=${applicationId}`);
          return;
        } else {
          const response = await fetch('/api/applications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              applicationId,
              ...updatedFormData,
            }),
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error);
          }

          setLastSaved(new Date());
          window.history.replaceState(null, '', `/test-application/1?id=${applicationId}`);
          router.push(`/test-application/2?id=${applicationId}`);
          return;
        }
      }

      if (currentStep === 2) {
        const visitDate = updatedFormData.visitDate || updatedFormData.preferredVisitDate;
        if (typeof visitDate === 'string' && visitDate) {
          sessionStorage.setItem(`app_${applicationId}_visitDate`, visitDate);
        }
        
        const response = await fetch(`/api/applications/${applicationId}/contact`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFormData),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error);
        }

        setLastSaved(new Date());
        router.push(`/test-application/3?id=${applicationId}`);
        return;
      }

      if (currentStep === 3) {
        const response = await fetch(`/api/applications/${applicationId}/experience`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFormData),
        });
      
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error);
        }
      
        setLastSaved(new Date());
        router.push(`/test-application/4?id=${applicationId}`);
        return;
      }
      
      if (currentStep === 4) {
        const response = await fetch(`/api/applications/${applicationId}/rules`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFormData),
        });
      
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error);
        }
      
        setLastSaved(new Date());
        router.push(`/test-application/5?id=${applicationId}`);
        return;
      }

      if (currentStep === 5) {
        setIsSubmitting(true);
        
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
          setIsSubmitting(false);
          throw new Error(result.error);
        }
      
        // Use FormData for final submit (includes files)
        const formData = new FormData();
        formData.append('applicationId', applicationId);
        
        Object.keys(updatedFormData).forEach((key) => {
          const value = updatedFormData[key];
          
          if (value instanceof File) {
            formData.append(key, value);
          } else if (value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        });
      
        const submitResponse = await fetch('/api/applications/submit', {
          method: 'POST',
          body: formData,
        });
      
        const submitResult = await submitResponse.json();
      
        if (!submitResponse.ok) {
          setIsSubmitting(false);
          if (submitResult.allErrors) {
            const errors = submitResult.allErrors
              .map((e: { field: string; message: string }) => `${e.field}: ${e.message}`)
              .join('\n');
            alert(`Validation failed:\n\n${errors}`);
          } else {
            alert(`Error: ${submitResult.error}`);
          }
          return;
        }
      
        sessionStorage.removeItem(`app_${applicationId}_visitDate`);
        router.push(`/test-application/success?id=${applicationId}`);
      }
    } catch (error) {
      setIsSubmitting(false); 
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
        onBack={handleBack}
        currentStep={currentStep}
      />
    </div>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { SectionForm, type FormValues } from '@/components/SectionForm';
import { LogoutButton } from '@/components/LogoutButton';
import {
  annualCoverConfig,
  annualPersonalConfig,
  annualBackgroundConfig,
  annualEmergencyConfig,
  annualAcknowledgmentConfig,
} from '@/lib/annualGCStepConfigs';

const STEP_CONFIGS = [
  { num: 1, label: 'Cover', config: annualCoverConfig },
  { num: 2, label: 'Personal', config: annualPersonalConfig },
  { num: 3, label: 'Background', config: annualBackgroundConfig },
  { num: 4, label: 'Emergency', config: annualEmergencyConfig },
  { num: 5, label: 'Sign', config: annualAcknowledgmentConfig },
];

export default function AnnualGCStepPage() {
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

  const loadDraft = useCallback(async (appId: string) => {
    try {
      const response = await fetch(`/api/applications/${appId}`);
      if (!response.ok) throw new Error('Failed to load');
      const { draft }: { draft: FormValues } = await response.json();

      // Map DB fields back to annual GC form field names where they differ
      if (draft.phoneNumber && !draft.contactNumber) draft.contactNumber = draft.phoneNumber;
      if (draft.companyOrOrganization && !draft.organizationName) draft.organizationName = draft.companyOrOrganization as string;

      setFormData(draft);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load draft', error);
      setLoading(false);
    }
  }, []);

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
      router.push('/annual-gc/1');
      setLoading(false);
    } catch (error) {
      console.error('Failed to load form data', error);
      setLoading(false);
    }
  }, [applicationIdFromUrl, currentStep, loadDraft, router]);

  useEffect(() => { loadFormData(); }, [loadFormData]);

 // ── REPLACE the saveDraft function in app/annual-gc/[step]/page.tsx ──
// Find the existing saveDraft (lines ~79-100) and replace with this:

const saveDraft = useCallback(async () => {
  if (!applicationId || !formData) return;
  try {
    let response: Response;

    if (currentStep === 3) {
      // ✅ FIX: Step 3 background route expects FormData not JSON
      const fd = new FormData();
      Object.keys(formData).forEach((key) => {
        const value = formData[key];
        if (value instanceof File) fd.append(key, value);
        else if (value !== null && value !== undefined) fd.append(key, String(value));
      });
      response = await fetch(`/api/applications/${applicationId}/background`, {
        method: 'PATCH',
        body: fd,
      });
    } else {
      const endpointMap: Record<number, string> = {
        1: 'cover',
        2: 'personal',
        4: 'emergency',
      };
      const endpoint = endpointMap[currentStep];
      if (!endpoint) return; // step 5 is submit only
      response = await fetch(`/api/applications/${applicationId}/${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    }

    // ✅ FIX: Check response.ok so silent failures don't show "last saved"
    if (!response.ok) {
      const result = await response.json();
      console.error('Draft save failed:', result.error);
      return;
    }

    setLastSaved(new Date());
  } catch (error) {
    console.error('Failed to save draft:', error);
  }
}, [applicationId, currentStep, formData]);

  const handleBack = async () => {
    await saveDraft();
    if (currentStep === 1) router.push('/');
    else router.push(`/annual-gc/${currentStep - 1}?id=${applicationId}`);
  };

  const handleStepComplete = async (payload: FormValues) => {
    const updatedFormData = { ...formData, ...payload };
    setFormData(updatedFormData);

    try {
      // ── Step 1: Cover sheet ──────────────────────────────────
      if (currentStep === 1) {
        if (applicationIdFromUrl) {
          // Updating existing draft
          const response = await fetch(`/api/applications/${applicationId}/cover`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedFormData),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
        } else {
          // Creating new draft — reuse existing create route with annual_gc type
          const response = await fetch('/api/applications/create', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              applicationId,
              applicationType: 'annual_gc',
              // Map cover fields to the create route's expected fields
              firstName: updatedFormData.ppName,   // temporary — overwritten in step 2
              lastName: 'PENDING',                  // placeholder until step 2
              dateOfBirth: updatedFormData.birthday,
              gender: 'prefer_not_to_say',          // placeholder until step 2
              ...updatedFormData,
            }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);

          // Also save cover-specific fields
          await fetch(`/api/applications/${applicationId}/cover`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedFormData),
          });

          window.history.replaceState(null, '', `/annual-gc/1?id=${applicationId}`);
        }
        setLastSaved(new Date());
        router.push(`/annual-gc/2?id=${applicationId}`);
        return;
      }

      // ── Step 2: Personal details ─────────────────────────────
  // Step 2 — was using shared personal route, now uses annual-specific one
if (currentStep === 2) {
  const response = await fetch(`/api/applications/${applicationId}/annual-personal`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedFormData),
  });
  if (!response.ok) { const r = await response.json(); throw new Error(r.error); }
  setLastSaved(new Date());
  router.push(`/annual-gc/3?id=${applicationId}`);
  return;
}

      // ── Step 3: Background questions ─────────────────────────
      if (currentStep === 3) {
        const fd = new FormData();
        Object.entries(updatedFormData).forEach(([k, v]) => {
          if (v instanceof File) fd.append(k, v);
          else if (v !== null && v !== undefined) fd.append(k, String(v));
        });
        const response = await fetch(`/api/applications/${applicationId}/background`, {
          method: 'PATCH',
          body: fd, // no Content-Type header — browser sets multipart boundary automatically
        });
        if (!response.ok) { const r = await response.json(); throw new Error(r.error); }
        setLastSaved(new Date());
        router.push(`/annual-gc/4?id=${applicationId}`);
        return;
      }

      // ── Step 4: Emergency contacts ───────────────────────────
      if (currentStep === 4) {
        const response = await fetch(`/api/applications/${applicationId}/emergency`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFormData),
        });
        if (!response.ok) { const r = await response.json(); throw new Error(r.error); }
        setLastSaved(new Date());
        router.push(`/annual-gc/5?id=${applicationId}`);
        return;
      }

      // ── Step 5: Acknowledgment + Submit ──────────────────────
      if (currentStep === 5) {
        console.log('Form data at submit:', JSON.stringify(
          Object.fromEntries(
            Object.entries(updatedFormData).filter(([, v]) => !(v instanceof File))
          ), null, 2
        ));
        setIsSubmitting(true);

        const submitFormData = new FormData();
        submitFormData.append('applicationId', applicationId);
        Object.keys(updatedFormData).forEach((key) => {
          const value = updatedFormData[key];
          if (value instanceof File) submitFormData.append(key, value);
          else if (value !== null && value !== undefined) submitFormData.append(key, String(value));
        });

        const submitResponse = await fetch('/api/applications/annual-gc/submit', {
          method: 'POST', body: submitFormData,
        });
        const submitResult = await submitResponse.json();

        if (!submitResponse.ok) {
          setIsSubmitting(false);
          if (submitResult.allErrors) {
            alert(`Validation failed:\n\n${submitResult.allErrors.map((e: { field: string; message: string }) => `${e.field}: ${e.message}`).join('\n')}`);
          } else alert(`Error: ${submitResult.error}`);
          return;
        }

        router.push(`/annual-gc/success?id=${applicationId}`);
      }
    } catch (error) {
      setIsSubmitting(false);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9f8f6' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: '#355F7A' }} />
          <p className="mt-4 text-sm" style={{ color: '#1C3D5A' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const currentConfig = STEP_CONFIGS.find((s) => s.num === currentStep);
  if (!currentConfig) { router.push('/annual-gc/1'); return null; }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9f8f6' }}>
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4" style={{ borderBottomColor: '#355F7A' }} />
              <p className="text-xl font-semibold text-center" style={{ color: '#1F2933' }}>Submitting your application...</p>
              <p className="text-sm text-center" style={{ color: '#1C3D5A' }}>Please wait while we process your information.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header + Step Progress */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10" style={{ borderColor: '#E6E1D8' }}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#1F2933' }}>Annual Gate Clearance Application</h1>
              {lastSaved && <p className="text-xs mt-1" style={{ color: '#1C3D5A' }}>Last saved {lastSaved.toLocaleTimeString()}</p>}
            </div>
            <LogoutButton />
          </div>

          <div className="relative">
            <div className="flex items-start justify-between">
              {STEP_CONFIGS.map((step) => (
                <div key={step.num} className="flex flex-col items-center" style={{ width: `${100 / STEP_CONFIGS.length}%` }}>
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-full font-semibold mb-2 relative z-10"
                    style={
                      step.num < currentStep
                        ? { backgroundColor: '#355F7A', color: '#ffffff' }
                        : step.num === currentStep
                        ? { backgroundColor: '#1C3D5A', color: '#ffffff' }
                        : { backgroundColor: '#E6E1D8', color: '#1C3D5A' }
                    }
                  >
                    {step.num < currentStep ? '✓' : step.num}
                  </div>
                  <span className="text-xs text-center" style={step.num <= currentStep ? { color: '#1F2933', fontWeight: '500' } : { color: '#9ca3af' }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute top-5 left-0 right-0 flex items-center px-[10%]">
              <div className="flex-1 flex items-center gap-0">
                {STEP_CONFIGS.slice(0, -1).map((_, idx) => (
                  <div key={idx} className="h-1 flex-1" style={{ backgroundColor: currentStep > idx + 1 ? '#355F7A' : '#E6E1D8' }} />
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
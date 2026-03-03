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

  const loadDraft = useCallback(async (appId: string) => {
    try {
      const response = await fetch(`/api/applications/${appId}`);
      if (!response.ok) throw new Error('Failed to load');

      const { draft }: { draft: FormValues } = await response.json();

      const visitDate = sessionStorage.getItem(`app_${appId}_visitDate`);
      if (visitDate) {
        draft.visitDate = visitDate;
        draft.preferredVisitDate = visitDate;
      }

      if (
        draft.governmentIdType === 'driver_license' &&
        draft.governmentIdNumber &&
        typeof draft.governmentIdNumber === 'string'
      ) {
        const cleaned = draft.governmentIdNumber.replace(/-/g, '');
        if (/^[A-Z]{1,2}\d/.test(cleaned)) {
          const match = cleaned.match(/^([A-Z]{1,2})(\d+)$/);
          if (match) draft.governmentIdNumber = `${match[1]}-${match[2]}`;
        }
      }

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
      router.push('/test-application/1');
      setLoading(false);
    } catch (error) {
      console.error('Failed to load form data', error);
      setLoading(false);
    }
  }, [applicationIdFromUrl, currentStep, loadDraft, router]);

  useEffect(() => { loadFormData(); }, [loadFormData]);

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

  const handleBack = async () => {
    await saveDraft();
    if (currentStep === 1) {
      router.push('/');
    } else {
      router.push(`/test-application/${currentStep - 1}?id=${applicationId}`);
    }
  };

  const handleStepComplete = async (payload: FormValues) => {
    const updatedFormData = { ...formData, ...payload };

    // SSN cleanup
    if (updatedFormData.ssnMethod !== 'call') delete updatedFormData.ssnVerifiedByPhone;
    if (updatedFormData.ssnMethod !== 'direct') { delete updatedFormData.ssnFull; delete updatedFormData.ssnFullConfirm; }
    if (updatedFormData.ssnMethod !== 'split') { delete updatedFormData.ssnFirstFive; delete updatedFormData.ssnFirstFiveConfirm; }

    // ID cleanup
    if (updatedFormData.governmentIdType !== 'driver_license') delete updatedFormData.idState;
// Keep passportScan if non-citizen OR using passport as ID
const isNonCitizen = updatedFormData.isUsCitizen === 'false';
const isPassportId = updatedFormData.governmentIdType === 'passport';
if (!isNonCitizen && !isPassportId) {
  delete updatedFormData.passportScan;
}

    // Parole/probation cleanup
    if (updatedFormData.onParole !== 'yes') delete updatedFormData.wardenLetter;

    if (updatedFormData.governmentIdNumber && typeof updatedFormData.governmentIdNumber === 'string')
      updatedFormData.governmentIdNumber = updatedFormData.governmentIdNumber.replace(/-/g, '');
    if (updatedFormData.governmentIdNumberConfirm && typeof updatedFormData.governmentIdNumberConfirm === 'string')
      updatedFormData.governmentIdNumberConfirm = updatedFormData.governmentIdNumberConfirm.replace(/-/g, '');

    setFormData(updatedFormData);

    try {
      if (currentStep === 1) {
        if (applicationIdFromUrl) {
          const response = await fetch(`/api/applications/${applicationId}/personal`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedFormData),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          setLastSaved(new Date());
          router.push(`/test-application/2?id=${applicationId}`);
          return;
        } else {
          const response = await fetch('/api/applications/create', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId, ...updatedFormData }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          setLastSaved(new Date());
          window.history.replaceState(null, '', `/test-application/1?id=${applicationId}`);
          router.push(`/test-application/2?id=${applicationId}`);
          return;
        }
      }

      if (currentStep === 2) {
        const visitDate = updatedFormData.visitDate || updatedFormData.preferredVisitDate;
        if (typeof visitDate === 'string' && visitDate)
          sessionStorage.setItem(`app_${applicationId}_visitDate`, visitDate);

        const response = await fetch(`/api/applications/${applicationId}/contact`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFormData),
        });
        if (!response.ok) { const result = await response.json(); throw new Error(result.error); }
        setLastSaved(new Date());
        router.push(`/test-application/3?id=${applicationId}`);
        return;
      }

      if (currentStep === 3) {
        const response = await fetch(`/api/applications/${applicationId}/experience`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFormData),
        });
        if (!response.ok) { const result = await response.json(); throw new Error(result.error); }
        setLastSaved(new Date());
        router.push(`/test-application/4?id=${applicationId}`);
        return;
      }

      if (currentStep === 4) {
        const response = await fetch(`/api/applications/${applicationId}/rules`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFormData),
        });
        if (!response.ok) { const result = await response.json(); throw new Error(result.error); }
        setLastSaved(new Date());
        router.push(`/test-application/5?id=${applicationId}`);
        return;
      }

      if (currentStep === 5) {
        setIsSubmitting(true);

        const securityDataWithoutFiles = { ...updatedFormData };
        delete securityDataWithoutFiles.passportScan;
        delete securityDataWithoutFiles.wardenLetter;

        const securityResponse = await fetch(`/api/applications/${applicationId}/security`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(securityDataWithoutFiles),
        });
        if (!securityResponse.ok) {
          const result = await securityResponse.json();
          setIsSubmitting(false);
          throw new Error(result.error);
        }

        const submitFormData = new FormData();
        submitFormData.append('applicationId', applicationId);
        Object.keys(updatedFormData).forEach((key) => {
          const value = updatedFormData[key];
          if (value instanceof File) submitFormData.append(key, value);
          else if (value !== null && value !== undefined) submitFormData.append(key, String(value));
        });

        const submitResponse = await fetch('/api/applications/submit', { method: 'POST', body: submitFormData });
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9f8f6' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: '#355F7A' }} />
          <p className="mt-4 text-sm" style={{ color: '#1C3D5A' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const currentConfig = STEP_CONFIGS.find((s) => s.num === currentStep);
  if (!currentConfig) { router.push('/test-application/1'); return null; }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9f8f6' }}>
      {/* Submitting overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4" style={{ borderBottomColor: '#355F7A' }} />
              <p className="text-xl font-semibold text-center" style={{ color: '#1F2933' }}>Submitting your application...</p>
              <p className="text-sm text-center" style={{ color: '#1C3D5A' }}>
                Please wait while we process your information. This may take a moment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10" style={{ borderColor: '#E6E1D8' }}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#1F2933' }}>Gate Clearance Application</h1>
              {lastSaved && (
                <p className="text-xs mt-1" style={{ color: '#1C3D5A' }}>
                  Last saved {lastSaved.toLocaleTimeString()}
                </p>
              )}
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
                  <span
                    className="text-xs text-center"
                    style={step.num <= currentStep ? { color: '#1F2933', fontWeight: '500' } : { color: '#9ca3af' }}
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
                    className="h-1 flex-1"
                    style={{ backgroundColor: currentStep > idx + 1 ? '#355F7A' : '#E6E1D8' }}
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
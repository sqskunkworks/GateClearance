// ============================================
// FILE 4: app/test-application/page.tsx
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SectionForm } from '@/components/SectionForm';
import { LogoutButton } from '@/components/LogoutButton';
import {
  personalConfig,
  contactOrgConfig,
  experienceConfig,
  rulesConfig,
  securityConfig,
} from '@/lib/stepConfigs';
import { validateFullApplication } from '@/lib/validation/applicationSchema';

export default function TestApplicationPage() {
  const [applicationId] = useState(() => crypto.randomUUID());
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const router = useRouter();

  // Load existing draft on mount
  useEffect(() => {
    loadDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(formData).length > 0) {
        saveDraft(formData);
      }
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const loadDraft = async () => {
    try {
      const response = await fetch(`/api/applications/draft?id=${applicationId}`);
      if (response.ok) {
        const { draft } = await response.json();
        if (draft && draft.status === 'draft') {
          const loadedData = {
            firstName: draft.first_name,
            lastName: draft.last_name,
            otherNames: draft.other_names,
            dateOfBirth: draft.date_of_birth,
            gender: draft.gender,
            phoneNumber: draft.phone_number,
            email: draft.email,
            companyOrOrganization: draft.company_or_organization,
            purposeOfVisit: draft.purpose_of_visit,
            governmentIdType: draft.government_id_type,
            governmentIdNumber: draft.government_id_number,
            idState: draft.id_state,
            idExpiration: draft.id_expiration,
            digitalSignature: draft.digital_signature,
            visitedInmate: draft.visited_inmate ? 'yes' : 'no',
            formerInmate: draft.former_inmate ? 'yes' : 'no',
            restrictedAccess: draft.restricted_access ? 'yes' : 'no',
            felonyConviction: draft.felony_conviction ? 'yes' : 'no',
            onProbationParole: draft.on_probation_parole ? 'yes' : 'no',
            pendingCharges: draft.pending_charges ? 'yes' : 'no',
          };
          setFormData(loadedData);
          console.log('✅ Draft loaded');
        }
      }
    } catch (error) {
      console.log('No existing draft found');
    }
  };

  const saveDraft = async (data: Record<string, any>) => {
    setIsSavingDraft(true);
    try {
      await fetch('/api/applications/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          ...data,
        }),
      });
      setLastSaved(new Date());
      console.log('💾 Draft saved');
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleStepComplete = async (payload: any) => {
    const updatedFormData = { ...formData, ...payload };
    setFormData(updatedFormData);
    
    await saveDraft(updatedFormData);
    
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      return;
    }
    
    // ✅ FINAL SUBMISSION: Full schema validation
    console.log('→ Running full application validation...');
    const fullData = { applicationId, ...updatedFormData };
    const validationResult = validateFullApplication(fullData);
    
    if (!validationResult.success) {
      console.error('❌ Final validation failed:', validationResult.error.issues);
      const firstError = validationResult.error.issues[0];
      alert(`Validation error: ${firstError.message} (field: ${firstError.path.join('.')})`);
      
      const errorField = String(firstError.path[0]);
      const errorStep = getStepForField(errorField);
      if (errorStep !== currentStep) {
        setCurrentStep(errorStep);
      }
      return;
    }
    
    console.log('✅ Full validation passed');
    
    try {
      const response = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save application');
      }
      
      router.push(`/application/success?id=${applicationId}`);
    } catch (error) {
      console.error('❌ Submit error:', error);
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Helper to determine which step a field belongs to
  const getStepForField = (fieldName: string): number => {
    const stepFields = [
      personalConfig.fields.map((f: any) => f.name),
      contactOrgConfig.fields.map((f: any) => f.name),
      experienceConfig.fields.map((f: any) => f.name),
      rulesConfig.fields.map((f: any) => f.name),
      securityConfig.fields.map((f: any) => f.name),
    ];
    
    for (let i = 0; i < stepFields.length; i++) {
      if (stepFields[i].includes(fieldName)) {
        return i + 1;
      }
    }
    return 1;
  };

  const steps = [
    { num: 1, label: 'Personal', config: personalConfig },
    { num: 2, label: 'Contact', config: contactOrgConfig },
    { num: 3, label: 'Experience', config: experienceConfig },
    { num: 4, label: 'Rules', config: rulesConfig },
    { num: 5, label: 'Security', config: securityConfig },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Gate Clearance Application</h1>
              {lastSaved && (
                <p className="text-xs text-gray-500 mt-1">
                  {isSavingDraft ? 'Saving...' : `Last saved ${lastSaved.toLocaleTimeString()}`}
                </p>
              )}
            </div>
            <LogoutButton />
          </div>
          
          <div className="relative">
            <div className="flex items-start justify-between">
              {steps.map((step) => (
                <div key={step.num} className="flex flex-col items-center" style={{ width: `${100 / steps.length}%` }}>
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold mb-2 relative z-10 ${
                      step.num <= currentStep ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.num}
                  </div>
                  
                  <span className={`text-xs text-center ${step.num <= currentStep ? 'text-black font-medium' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="absolute top-5 left-0 right-0 flex items-center px-[10%]">
              <div className="flex-1 flex items-center gap-0">
                {steps.slice(0, -1).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 ${currentStep > idx + 1 ? 'bg-black' : 'bg-gray-200'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {steps.map((step) => (
        currentStep === step.num && (
          <SectionForm
            key={step.num}
            config={step.config}
            initialValues={formData}
            onSubmit={handleStepComplete}
          />
        )
      ))}
    </div>
  );
}
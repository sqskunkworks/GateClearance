'use client';

import { useState } from 'react';
import { SectionForm, personalConfig, contactOrgConfig, securityConfig } from '@/components/SectionForm';

const TEST_APP_ID = '591948a0-7354-4ca6-93ec-90654ed2f15e';

export default function TestApplicationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleStepComplete = async (payload: any) => {
    console.log('📝 Section data received:', payload);
    
    const updatedFormData = { ...formData, ...payload };
    setFormData(updatedFormData);
    console.log('📦 Accumulated form data:', updatedFormData);
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }
    
    try {
      console.log('💾 Final step reached - saving everything and uploading PDF...');
      
      const response = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: TEST_APP_ID,
          ...updatedFormData,
        }),
      });

      const result = await response.json();
      console.log('✅ Server response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save application');
      }
      
      setSubmissionComplete(true);
    } catch (error) {
      console.error('❌ Submit error:', error);
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold mb-4">Test Application Form</h1>
          
          <div className="relative">
            <div className="flex items-start justify-between">
              {[
                { num: 1, label: 'Personal Info' },
                { num: 2, label: 'Contact' },
                { num: 3, label: 'Security' },
              ].map((step) => (
                <div key={step.num} className="flex flex-col items-center" style={{ width: '33.33%' }}>
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
            
            <div className="absolute top-5 left-0 right-0 flex items-center px-[16.66%]">
              <div className="flex-1 flex items-center gap-0">
                <div className={`h-1 flex-1 ${currentStep >= 2 ? 'bg-black' : 'bg-gray-200'}`} />
                <div className={`h-1 flex-1 ${currentStep >= 3 ? 'bg-black' : 'bg-gray-200'}`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {!submissionComplete ? (
        <>
          {currentStep === 1 && (
            <SectionForm 
              config={personalConfig} 
              initialValues={formData} 
              onSubmit={handleStepComplete} 
            />
          )}
          {currentStep === 2 && (
            <SectionForm 
              config={contactOrgConfig} 
              initialValues={formData} 
              onSubmit={handleStepComplete} 
            />
          )}
          {currentStep === 3 && (
            <SectionForm 
              config={securityConfig} 
              initialValues={formData} 
              onSubmit={handleStepComplete} 
            />
          )}
        </>
      ) : (
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            {/* Success Message */}
            <h2 className="text-3xl font-bold mb-3">Application Submitted!</h2>
            <p className="text-gray-600 text-lg mb-8">
              Thank you for submitting your application. We have received your information and will process it shortly.
            </p>
          
            
            {/* Start Over Button */}
            <button
              onClick={() => {
                setCurrentStep(1);
                setSubmissionComplete(false);
                setFormData({});
              }}
              className="text-sm text-gray-600 hover:text-black transition-colors mb-3"
            >
              ← Submit Another Application
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { SectionForm, personalConfig, contactOrgConfig, securityConfig } from '@/components/SectionForm';

const TEST_APP_ID = '591948a0-7354-4ca6-93ec-90654ed2f15e';

export default function TestApplicationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [downloadReady, setDownloadReady] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleStepComplete = async (payload: any) => {
    console.log('📝 Section data received:', payload);
    
    // Merge new section data into formData
    const updatedFormData = { ...formData, ...payload };
    setFormData(updatedFormData);
    console.log('📦 Accumulated form data:', updatedFormData);
    
    // If not the last step, just move to next step
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }
    
    // LAST STEP - Now save everything to database
    try {
      console.log('💾 Final step reached - saving everything to database...');
      
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
      
      setDownloadReady(true);
    } catch (error) {
      console.error('❌ Submit error:', error);
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const downloadPDF = async () => {
    try {
      console.log('🔽 Downloading PDF...');
      
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || 'zu+vUQEL4KzzN37zyBAXddnFFJKBmRNOQ7Szx1KmkTo=',
        },
        body: JSON.stringify({
          applicationId: TEST_APP_ID,
          ssn_full: formData.ssnFull,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ PDF generation failed:', error);
        throw new Error(error.error || 'Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CDCR_2311_${TEST_APP_ID}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('PDF downloaded successfully!');
    } catch (error) {
      console.error('❌ Download error:', error);
      alert(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold mb-4">Test Application Form</h1>
          
          {/* Step indicators with connecting lines */}
          <div className="relative">
            <div className="flex items-start justify-between">
              {[
                { num: 1, label: 'Personal Info' },
                { num: 2, label: 'Contact' },
                { num: 3, label: 'Security' },
              ].map((step, idx) => (
                <div key={step.num} className="flex flex-col items-center" style={{ width: '33.33%' }}>
                  {/* Step number circle */}
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold mb-2 relative z-10 ${
                      step.num <= currentStep ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.num}
                  </div>
                  
                  {/* Step label */}
                  <span className={`text-xs text-center ${step.num <= currentStep ? 'text-black font-medium' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Connecting lines between steps */}
            <div className="absolute top-5 left-0 right-0 flex items-center px-[16.66%]">
              <div className="flex-1 flex items-center gap-0">
                {/* Line 1 to 2 */}
                <div className={`h-1 flex-1 ${currentStep >= 2 ? 'bg-black' : 'bg-gray-200'}`} />
                {/* Line 2 to 3 */}
                <div className={`h-1 flex-1 ${currentStep >= 3 ? 'bg-black' : 'bg-gray-200'}`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forms */}
      {!downloadReady ? (
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
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Complete!</h2>
            <p className="text-gray-600 mb-6">Your application has been saved to the database.</p>
            <button
              onClick={downloadPDF}
              className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-900 transition-colors"
            >
              Download Filled PDF
            </button>
            <button
              onClick={() => {
                setCurrentStep(1);
                setDownloadReady(false);
                setFormData({});
              }}
              className="mt-4 text-sm text-gray-600 hover:text-black"
            >
              ← Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
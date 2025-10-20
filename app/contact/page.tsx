'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SectionForm, contactOrgConfig } from '@/components/SectionForm';

function ContactInner() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id') ?? undefined;

  return (
    <main className="min-h-dvh bg-gray-50">
      <SectionForm
        applicationId={id}
        config={contactOrgConfig}
        onSubmit={async () => {
          router.push(`/experience${id ? `?id=${id}` : ''}`);
        }}
      />
    </main>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <ContactInner />
    </Suspense>
  );
}

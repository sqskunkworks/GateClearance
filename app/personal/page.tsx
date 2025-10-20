'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SectionForm, personalConfig } from '@/components/SectionForm';

function PersonalInner() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id') ?? undefined;

  return (
    <main className="min-h-dvh bg-gray-50">
      <SectionForm
        applicationId={id}
        config={personalConfig}
        onSubmit={async () => {
          router.push(`/contact${id ? `?id=${id}` : ''}`);
        }}
      />
    </main>
  );
}

export default function PersonalPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <PersonalInner />
    </Suspense>
  );
}

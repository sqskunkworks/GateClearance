'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SectionForm, experienceConfig } from '@/components/SectionForm';

function ExperienceInner() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id') ?? undefined;

  return (
    <main className="min-h-dvh bg-gray-50">
      <SectionForm
        applicationId={id}
        config={experienceConfig}
        onSubmit={async () => {
          router.push(`/security${id ? `?id=${id}` : ''}`);
        }}
      />
    </main>
  );
}

export default function ExperiencePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <ExperienceInner />
    </Suspense>
  );
}

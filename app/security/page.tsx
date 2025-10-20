'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SectionForm, securityConfig } from '@/components/SectionForm';

function SecurityInner() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id') ?? undefined;

  return (
    <main className="min-h-dvh bg-gray-50">
      <SectionForm
        applicationId={id}
        config={securityConfig}
        onSubmit={async () => {
          router.push(`/rules${id ? `?id=${id}` : ''}`);
        }}
      />
    </main>
  );
}

export default function SecurityPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <SecurityInner />
    </Suspense>
  );
}

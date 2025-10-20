'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SectionForm, rulesConfig } from '@/components/SectionForm';

function RulesInner() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id') ?? undefined;

  return (
    <main className="min-h-dvh bg-gray-50">
      <SectionForm
        applicationId={id}
        config={rulesConfig}
        onSubmit={async () => {
          // Final step — adjust destination as needed
          router.push(`/`);
        }}
      />
    </main>
  );
}

export default function RulesPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <RulesInner />
    </Suspense>
  );
}

// app/rules/page.tsx
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { SectionForm, rulesConfig } from '@/components/SectionForm';

export default function RulesPage() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id') ?? undefined;

  return (
    <main className="min-h-dvh bg-gray-50">
      <SectionForm
        applicationId={id}
        config={rulesConfig}
        onSubmit={async () => router.push(`/next-step${id ? `?id=${id}` : ''}`)}
      />
    </main>
  );
}

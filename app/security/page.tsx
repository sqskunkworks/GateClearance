'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { SectionForm, securityConfig } from '@/components/SectionForm';

export default function SecurityPage() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id') ?? undefined;

  return (
    <main className="min-h-dvh bg-gray-50">
      <SectionForm
        applicationId={id}
        config={securityConfig}
        onSubmit={async (payload) => {
          console.log('SUBMIT /security', payload);
          router.push(`/rules${id ? `?id=${id}` : ''}`);
        }}
      />
    </main>
  );
}

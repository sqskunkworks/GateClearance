'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { SectionForm, experienceConfig } from '@/components/SectionForm';

export default function ExperiencePage() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id') ?? undefined;

  return (
    <main className="min-h-dvh bg-gray-50">
      <SectionForm
        applicationId={id}
        config={experienceConfig}
        onSubmit={async (payload) => {
          console.log('SUBMIT /experience', payload);
          router.push(`/security${id ? `?id=${id}` : ''}`);
        }}
      />
    </main>
  );
}

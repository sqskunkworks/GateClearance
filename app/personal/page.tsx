
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { SectionForm, personalConfig } from '@/components/SectionForm';

export default function PersonalPage() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id') ?? undefined;

  return (
    <main className="min-h-dvh bg-gray-50">
      <SectionForm
        applicationId={id}
        config={personalConfig}
        onSubmit={async () => router.push(`/contact${id ? `?id=${id}` : ''}`)}
      />
    </main>
  );
}

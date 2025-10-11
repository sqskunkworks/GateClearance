// app/contact/page.tsx
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { SectionForm, contactOrgConfig } from '@/components/SectionForm';

export default function ContactPage() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id') ?? undefined;

  return (
    <main className="min-h-dvh bg-gray-50">
      <SectionForm
        applicationId={id}
        config={contactOrgConfig}
        onSubmit={async () => router.push(`/rules${id ? `?id=${id}` : ''}`)}
      />
    </main>
  );
}

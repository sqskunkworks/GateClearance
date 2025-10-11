'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SectionForm, experienceConfig } from '@/components/SectionForm';
import { nextRoute } from '@/utils/form-routes';

export default function ExperiencePage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const id = params.get('id') ?? undefined;

  return (
    <main className="min-h-dvh bg-gray-50">
      <SectionForm
        applicationId={id}
        config={experienceConfig}
        clearOnSuccess
        onSubmit={async (payload) => {
        //   // optional: dev-only peek (avoid logging PII in prod)
        //   if (process.env.NODE_ENV === 'development') {
        //     console.log('SUBMIT /experience', { ...payload, ssnFull: payload?.ssnFull ? '***redacted***' : undefined });
        //   }
          router.push(nextRoute(pathname, id));
        }}
      />
    </main>
  );
}

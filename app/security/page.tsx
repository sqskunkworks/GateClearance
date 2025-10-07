'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SectionForm, securityConfig } from '@/components/SectionForm';
import { nextRoute } from '@/utils/form-routes';

export default function SecurityPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const id = params.get('id') ?? undefined;

  return (
    <main className="min-h-dvh bg-gray-50">
      <SectionForm
        applicationId={id}
        config={securityConfig}
        clearOnSuccess
        onSubmit={async (payload) => {
        //   // dev-only peek; avoid logging PII in prod
        //   if (process.env.NODE_ENV === 'development') {
        //     // eslint-disable-next-line no-console
        //     console.log('SUBMIT /security', {
        //       ...payload,
        //       ssnFull: payload?.ssnFull ? '***redacted***' : undefined,
        //     });
        //   }
          router.push(nextRoute(pathname, id));
        }}
      />
    </main>
  );
}


export const FORM_STEPS = ['/personal', '/contact', '/rules', '/experience', '/security'] as const;

export function nextRoute(currentPath: string, applicationId?: string) {
  const base = currentPath.split('?')[0];
  const i = FORM_STEPS.indexOf(base as (typeof FORM_STEPS)[number]);
  const next = i >= 0 && i < FORM_STEPS.length - 1 ? FORM_STEPS[i + 1] : '/next-step';
  return applicationId ? `${next}?id=${applicationId}` : next;
}

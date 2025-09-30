'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, Building2, CheckCircle2, AlertTriangle } from 'lucide-react';

/**
 * SectionForm.tsx
 * ------------------------------------------------------
 * A single, reusable form section component rendered from a config.
 * Three ready-made configs are exported: rulesConfig, personalConfig, contactOrgConfig.
 *
 * Styling: Tailwind v4; no external UI lib required.
 */

/* ============================
   Types
   ============================ */
export type FieldBase = {
  name: string;
  label: string;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  /** Force this field to take the full row on desktop when columns=2 */
  span?: 1 | 2;
};

export type RadioOption = { label: string; value: string };

export type Field =
  | (FieldBase & { kind: 'text' | 'email' | 'tel' | 'date' })
  | (FieldBase & { kind: 'textarea'; rows?: number })
  | (FieldBase & {
      kind: 'radio';
      options: RadioOption[];
      /** Optional correctness gating (for rules quiz) */
      correctValue?: string;
      wrongCallout?: { title?: string; points: string[] };
    })
  | (FieldBase & { kind: 'checkbox' });

export type SectionConfig = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  fields: Field[];
  /** Optional extra validation beyond required/format checks */
  validate?: (values: Record<string, any>) => Record<string, string>;
  /** Optional transform before POST/callback */
  buildPayload?: (values: Record<string, any>) => any;
  /** Default API path (if onSubmit not provided) */
  apiPath?: (applicationId?: string) => string;
  /** CTA label override */
  ctaLabel?: string;
  /** Desktop column count. Default 2. */
  columns?: 1 | 2;
};

export type SectionFormProps = {
  applicationId?: string;
  config: SectionConfig;
  initialValues?: Record<string, any>;
  onSubmit?: (values: Record<string, any>) => Promise<void> | void;
};

/* ============================
   UI atoms
   ============================ */
const SectionHeader = ({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) => (
  <div className="border-b border-gray-200 bg-white/90 backdrop-blur">
    <div className="mx-auto max-w-3xl px-4 py-5">
      <div className="flex items-center gap-3">
        {icon}
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
    </div>
  </div>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">{children}</div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full rounded-xl border border-gray-300 p-2 text-sm outline-none transition-colors focus:border-black focus:ring-1 focus:ring-black ${props.className || ''}`}
  />
);

const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={`min-h-[96px] w-full rounded-xl border border-gray-300 p-2 text-sm outline-none transition-colors focus:border-black focus:ring-1 focus:ring-black ${props.className || ''}`}
  />
);

const ErrorCallout = ({ title, points }: { title?: string; points: string[] }) => (
  <AnimatePresence mode="popLayout">
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
    >
      <div className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4" /> {title || 'Please review the following:'}
      </div>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </motion.div>
  </AnimatePresence>
);

/* ============================
   Helpers
   ============================ */
const isEmail = (v: string) => /.+@.+\..+/.test(v.trim());
const digits = (s: string) => s.replace(/\D/g, '');
const isPhone = (v: string) => {
  const d = digits(v);
  return d.length >= 10 && d.length <= 15;
};
const isYMD = (v?: string) => !!(v && /^\d{4}-\d{2}-\d{2}$/.test(v));

/* ============================
   Component
   ============================ */
export function SectionForm({ applicationId, config, initialValues, onSubmit }: SectionFormProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues || {});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Base validation
  const baseErrors = useMemo(() => {
    const e: Record<string, string> = {};
    for (const f of config.fields) {
      const v = values[f.name];
      if (f.required) {
        if (f.kind === 'checkbox') {
          if (!v) e[f.name] = 'Required';
        } else if (typeof v === 'string') {
          if (!v.trim()) e[f.name] = 'Required';
        } else if (v == null) {
          e[f.name] = 'Required';
        }
      }
      if (v) {
        if (f.kind === 'email' && !isEmail(String(v))) e[f.name] = 'Invalid email';
        if (f.kind === 'tel' && !isPhone(String(v))) e[f.name] = 'Invalid phone';
        if (f.kind === 'date' && !isYMD(String(v))) e[f.name] = 'Use YYYY-MM-DD';
      }
    }
    return e;
  }, [config.fields, values]);

  // Custom validation hook
  const customErrors = useMemo(() => (config.validate ? config.validate(values) : {}), [config, values]);
  const errors = { ...baseErrors, ...customErrors } as Record<string, string>;

  // Quiz correctness (for radios with correctValue)
  const quizWrongByField = useMemo(() => {
    const wrong: Record<string, true> = {};
    for (const f of config.fields) {
      if (f.kind === 'radio' && f.correctValue && values[f.name] && values[f.name] !== f.correctValue) {
        wrong[f.name] = true;
      }
    }
    return wrong;
  }, [config.fields, values]);

  const requiredCount = config.fields.filter((f) => f.required).length;
  const requiredSatisfied = config.fields.filter((f) => {
    if (!f.required) return false;
    const v = values[f.name];
    if (f.kind === 'checkbox') return !!v;
    return typeof v === 'string' ? v.trim().length > 0 : v != null;
  }).length;

  const quizOk = Object.keys(quizWrongByField).length === 0;
  const canSubmit = requiredSatisfied === requiredCount && quizOk && Object.keys(errors).length === 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitError(null);

    const payload = config.buildPayload ? config.buildPayload(values) : values;

    try {
      setSubmitting(true);
      if (onSubmit) {
        await onSubmit(payload);
      } else if (config.apiPath) {
        await fetch(config.apiPath(applicationId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId, ...payload }),
        });
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  const cols = config.columns ?? 2; // default two columns on desktop

  return (
    <form onSubmit={handleSubmit} className="min-h-dvh bg-gradient-to-b from-gray-50 to-white">
      <SectionHeader title={config.title} subtitle={config.subtitle} icon={config.icon} />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <Card>
          <div className={`grid grid-cols-1 gap-4 ${cols === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
            {config.fields.map((f) => (
              <div key={f.name} className={f.kind === 'textarea' || f.span === 2 ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-800" htmlFor={f.name}>
                  {f.label}
                  {f.required && <span className="text-red-600"> *</span>}
                </label>

                {/* kind = textarea */}
                {f.kind === 'textarea' && (
                  <TextArea
                    id={f.name}
                    placeholder={f.placeholder}
                    rows={(f as any).rows || 4}
                    value={values[f.name] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  />
                )}

                {/* kind = text|email|tel|date */}
                {(f.kind === 'text' || f.kind === 'email' || f.kind === 'tel' || f.kind === 'date') && (
                  <Input
                    id={f.name}
                    type={f.kind === 'text' ? 'text' : f.kind}
                    placeholder={f.placeholder}
                    value={values[f.name] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  />
                )}

                {/* kind = radio */}
                {f.kind === 'radio' && (
                  <div className="mt-1 grid grid-cols-1 gap-2">
                    {(f as any).options.map((opt: RadioOption) => (
                      <label
                        key={opt.value}
                        className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-2 text-sm ${
                          values[f.name] === opt.value
                            ? 'border-black bg-black text-white'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={f.name}
                            value={opt.value}
                            className="h-4 w-4 accent-black"
                            checked={values[f.name] === opt.value}
                            onChange={() => setValues((v) => ({ ...v, [f.name]: opt.value }))}
                          />
                          <span>{opt.label}</span>
                        </div>
                        {values[f.name] === opt.value && <CheckCircle2 className="h-5 w-5" />}
                      </label>
                    ))}
                  </div>
                )}

                {/* kind = checkbox */}
                {f.kind === 'checkbox' && (
                  <label className="mt-1 flex items-start gap-3 text-sm text-gray-800">
                    <input
                      id={f.name}
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-black"
                      checked={!!values[f.name]}
                      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.checked }))}
                    />
                    <span>{f.label}</span>
                  </label>
                )}

                {/* help/error */}
                {f.helpText && <p className="mt-1 text-xs text-gray-600">{f.helpText}</p>}
                {errors[f.name] && <p className="mt-1 text-xs text-red-600">{errors[f.name]}</p>}

                {/* Wrong-answer callout for quiz radios */}
                {f.kind === 'radio' && (f as any).correctValue && values[f.name] && values[f.name] !== (f as any).correctValue && (
                  <ErrorCallout title={(f as any).wrongCallout?.title} points={(f as any).wrongCallout?.points || []} />
                )}
              </div>
            ))}
          </div>

          {submitError && <p className="mt-3 text-sm text-red-700">{submitError}</p>}
        </Card>

        <div className="h-24" />
      </div>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <div className="text-xs text-gray-600">Required complete: {requiredSatisfied}/{requiredCount}</div>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors ${
              canSubmit ? 'bg-black hover:bg-gray-900' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {config.ctaLabel || 'Save & Continue'}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ============================
   Ready-made configs (3 sections)
   ============================ */

// 1) Rules & Acknowledgment — single column
export const rulesConfig: SectionConfig = {
  title: 'Review & Acknowledgment',
  subtitle: 'Confirm your understanding of key rules before your visit.',
  icon: <Shield className="h-6 w-6" />,
  apiPath: (id) => `/api/applications/${id ?? 'temp'}/acknowledgment`,
  ctaLabel: 'Continue',
  columns: 1,
  fields: [
    {
      kind: 'radio',
      name: 'color',
      label: 'Choose an allowed color to wear for your visit',
      required: true,
      options: [
        { label: 'Blue', value: 'Blue' },
        { label: 'Green', value: 'Green' },
        { label: 'Yellow', value: 'Yellow' },
        { label: 'Orange', value: 'Orange' },
        { label: 'Gray', value: 'Gray' },
        { label: 'Black', value: 'Black' },
      ],
      correctValue: 'Black',
      wrongCallout: {
        title: 'That is incorrect. Please review:',
        points: [
          'No blue, green, yellow, orange, or gray in any shade.',
          'No denim, sweats, shorts, or sleeveless shirts.',
          'No revealing or form-fitting attire.',
          'Dress professionally or business casual.',
          'No white T‑shirts.',
          'When in doubt, wear black. Black is always a safe choice.',
        ],
      },
    },
    {
      kind: 'radio',
      name: 'phonePolicy',
      label: 'What should you do with your phone, Apple Watch, and keys before entering?',
      required: true,
      options: [
        { label: 'Bring them inside but keep them in your pocket', value: 'Bring inside' },
        { label: 'Leave them in your car or (on bus) check at East Gate', value: 'Leave in car / check at East Gate' },
        { label: 'Place them in a clear bag and carry into the facility', value: 'Clear bag inside' },
      ],
      correctValue: 'Leave in car / check at East Gate',
      wrongCallout: {
        title: 'Incorrect: Please review',
        points: [
          'No phones, wallets, keys, or electronic devices inside (including smart watches).',
          'Leave these items in your car or check them at the East Gate if using public transport.',
          'Only a clear plastic water bottle is allowed; no bags/food/drinks.',
        ],
      },
    },
    {
      kind: 'radio',
      name: 'shareContact',
      label: 'What should you do if asked to share your contact information?',
      required: true,
      options: [
        { label: 'Direct to publicly available email or social handles', value: 'Direct to public handles' },
        { label: 'Politely decline and ask the Impact Team President (Kai) and your Escort', value: 'Politely decline + ask Kai/Escort' },
        { label: 'Accept contact details and keep them confidential', value: 'Accept + keep confidential' },
      ],
      correctValue: 'Politely decline + ask Kai/Escort',
      wrongCallout: {
        title: 'Incorrect: Please review',
        points: [
          'Exchange of contact info must be approved by the Impact Team President and the escort.',
          'Do not accept contact details from incarcerated people.',
          'If approached, get approval from Kai Bannon and your Escort.',
        ],
      },
    },
    {
      kind: 'radio',
      name: 'writtenMaterials',
      label: 'Which written materials can you bring or receive?',
      required: true,
      options: [
        { label: 'Personal business cards', value: 'Personal business cards' },
        { label: 'Contact information cards', value: 'Contact information cards' },
        { label: 'Materials directly related to SkunkWorks (with approval)', value: 'Materials related to SkunkWorks with approval' },
        { label: 'Personal notes', value: 'Personal notes' },
      ],
      correctValue: 'Materials related to SkunkWorks with approval',
      wrongCallout: {
        title: 'Incorrect: Please review',
        points: [
          'No personal paperwork, business cards, or contact cards.',
          'Only materials directly related to SkunkWorks are permitted.',
          'Any exchange must have explicit approval from the Impact Team President and your Escort.',
        ],
      },
    },
    { kind: 'checkbox', name: 'ack', label: 'I have reviewed and agree to follow all rules and guidelines', required: true },
  ],
  buildPayload: (v) => ({
    answers: {
      color: v.color,
      phonePolicy: v.phonePolicy,
      shareContact: v.shareContact,
      writtenMaterials: v.writtenMaterials,
    },
    acknowledgmentAgreement: !!v.ack,
  }),
};

// 2) Personal Information — two columns
export const personalConfig: SectionConfig = {
  title: 'Personal Information',
  subtitle: 'Match your legal ID. Use full legal name.',
  icon: <User className="h-6 w-6" />,
  apiPath: (id) => `/api/applications/${id ?? 'temp'}/personal`,
  columns: 2,
  fields: [
    { kind: 'text', name: 'firstName', label: 'First name', required: true },
    { kind: 'text', name: 'lastName', label: 'Last name', required: true },
    { kind: 'text', name: 'otherNames', label: 'Other names (optional)', span: 2 },
    { kind: 'date', name: 'dateOfBirth', label: 'Date of birth (YYYY-MM-DD)', required: true },
    {
      kind: 'radio',
      name: 'gender',
      label: 'Gender',
      required: true,
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Nonbinary', value: 'nonbinary' },
        { label: 'Prefer not to say', value: 'prefer_not_to_say' },
        { label: 'Other', value: 'other' },
      ],
    },
  ],
  validate: (v) => {
    const e: Record<string, string> = {};
    if (!isYMD(v.dateOfBirth || '')) e.dateOfBirth = 'Use YYYY-MM-DD';
    return e;
  },
  buildPayload: (v) => ({ personal: v }),
};

// 3) Contact & Organization — two columns
export const contactOrgConfig: SectionConfig = {
  title: 'Contact & Organization',
  subtitle: 'We’ll use this for visit planning and updates.',
  icon: <Building2 className="h-6 w-6" />,
  apiPath: (id) => `/api/applications/${id ?? 'temp'}/contact`,
  columns: 2,
  fields: [
    { kind: 'email', name: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
    { kind: 'tel', name: 'phoneNumber', label: 'Phone number', required: true, placeholder: '415-555-1234 or +27 82 123 4567' },
    { kind: 'date', name: 'visitDate', label: 'Preferred visit date (optional)' },
    { kind: 'text', name: 'companyOrOrganization', label: 'Company / Organization', required: true },
    { kind: 'textarea', name: 'purposeOfVisit', label: 'Purpose of visit', required: true, rows: 4 },
  ],
  buildPayload: (v) => ({ contact: v }),
};

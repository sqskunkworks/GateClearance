'use client';

import React, { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, Building2, CheckCircle2, AlertTriangle } from 'lucide-react';
import SignaturePad, { SignaturePadHandle } from '@/components/SignaturePad';

/* ============================
   Types
   ============================ */
export type FieldBase = {
  name: string;
  label: string;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  span?: 1 | 2;
  showIf?: (values: Record<string, any>) => boolean;
};

export type RadioOption = { label: string; value: string };

type TextKinds = 'text' | 'email' | 'tel' | 'date';

export type Field =
  | (FieldBase & { kind: TextKinds })
  | (FieldBase & { kind: 'textarea'; rows?: number })
  | (FieldBase & {
      kind: 'radio';
      options: RadioOption[];
      correctValue?: string;
      wrongCallout?: { title?: string; points: string[] };
    })
  | (FieldBase & { kind: 'checkbox' })
  | (FieldBase & { kind: 'file'; accept?: string })
  | (FieldBase & { kind: 'signature'; height?: number });

export type SectionConfig = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  fields: Field[];
  validate?: (values: Record<string, any>) => Record<string, string>;
  buildPayload?: (values: Record<string, any>) => Record<string, any>;
  apiPath?: (applicationId?: string) => string;
  ctaLabel?: string;
  columns?: 1 | 2;
};

export type SectionFormProps = {
  applicationId?: string;
  config: SectionConfig;
  initialValues?: Record<string, any>;
  clearOnSuccess?: boolean;
  onSubmit?: (values: Record<string, any>) => Promise<void> | void;
};

/* ======= UI bits ======= */
const SectionHeader = ({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) => (
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
    className={`w-full rounded-xl border border-gray-300 p-2 text-sm outline-none transition-colors focus:border-black focus:ring-1 focus:ring-black ${
      props.className || ''
    }`}
  />
);

const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={`min-h-[96px] w-full rounded-xl border border-gray-300 p-2 text-sm outline-none transition-colors focus:border-black focus:ring-1 focus:ring-black ${
      props.className || ''
    }`}
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

/* ======= Type guards ======= */
const isTextarea = (f: Field): f is Extract<Field, { kind: 'textarea' }> => f.kind === 'textarea';
const isTextInput = (f: Field): f is Extract<Field, { kind: TextKinds }> =>
  f.kind === 'text' || f.kind === 'email' || f.kind === 'tel' || f.kind === 'date';
const isRadio = (f: Field): f is Extract<Field, { kind: 'radio' }> => f.kind === 'radio';
const isFile = (f: Field): f is Extract<Field, { kind: 'file' }> => f.kind === 'file';
const isSignature = (f: Field): f is Extract<Field, { kind: 'signature' }> => f.kind === 'signature';

/* ======= Helpers ======= */
const isEmail = (v: string) => /.+@.+\..+/.test(v.trim());
const digitsOnly = (s: string) => s.replace(/\D/g, '');
const isPhone = (v: string) => {
  const d = digitsOnly(v);
  return d.length >= 10 && d.length <= 15;
};

const isRealDateMMDDYYYY = (
  s?: string,
  { minYear = 1900, maxYear = 2030 }: { minYear?: number; maxYear?: number } = {}
) => {
  if (!s || !/^\d{2}-\d{2}-\d{4}$/.test(s)) return false;
  const [mm, dd, yyyy] = s.split('-').map(Number);
  if (yyyy < minYear || yyyy > maxYear) return false;
  const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
  return dt.getUTCFullYear() === yyyy && dt.getUTCMonth() === mm - 1 && dt.getUTCDate() === dd;
};

const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');
const isAllSameDigits = (s: string) => /^([0-9])\1{8}$/.test(s);

function normalizeAndValidateSSN(raw?: string) {
  const d = onlyDigits(raw || '');
  if (d.length !== 9) return { ok: false, digits: d, msg: 'SSN must be 9 digits' };
  const area = d.slice(0, 3),
    group = d.slice(3, 5),
    serial = d.slice(5);
  if (area === '000' || group === '00' || serial === '0000') return { ok: false, digits: d, msg: 'SSN format is invalid' };
  if (isAllSameDigits(d) || d === '123456789') return { ok: false, digits: d, msg: 'SSN looks invalid' };
  return { ok: true, digits: d };
}

function normalizeGovId(raw?: string) {
  return (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}
function validateGovId(type?: string, value?: string) {
  const s = normalizeGovId(value);
  if (!s) return { ok: false, msg: 'Government ID is required' };
  if (type === 'passport') {
    if (!/^[A-Z0-9]{9}$/.test(s)) return { ok: false, msg: 'Passport # must be 9 letters/numbers' };
  } else {
    if (s.length < 5 || s.length > 20) return { ok: false, msg: 'DL number must be 5–20 letters/numbers' };
  }
  return { ok: true, normalized: s };
}
function isFutureOrTodayMMDDYYYY(s?: string) {
  if (!isRealDateMMDDYYYY(s)) return false;
  const [mm, dd, yyyy] = (s as string).split('-').map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
}

/* ======= Signature field wrapper ======= */
function SignatureField({
  height,
  onChange,
}: {
  height?: number;
  onChange: (dataUrl: string) => void;
}) {
  const padRef = useRef<SignaturePadHandle>(null);

  const handleSave = () => {
    const pad = padRef.current;
    if (!pad) return;
    if (pad.isEmpty()) {
      onChange('');
      return;
    }
    onChange(pad.toDataURL());
  };

  return (
    <div>
      <SignaturePad ref={padRef} height={height ?? 160} />
      <div className="mt-2 flex gap-2">
        <button type="button" className="rounded bg-black px-3 py-1 text-sm text-white" onClick={handleSave}>
          Save Signature
        </button>
        <button
          type="button"
          className="rounded border px-3 py-1 text-sm"
          onClick={() => {
            padRef.current?.clear();
            onChange('');
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

/* ======= Component ======= */
export function SectionForm({
  applicationId,
  config,
  initialValues,
  clearOnSuccess,
  onSubmit,
}: SectionFormProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues || {});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [appId] = useState(applicationId);

  const baseErrors = useMemo(() => {
    const e: Record<string, string> = {};
    for (const f of config.fields) {
      if (f.showIf && !f.showIf(values)) continue;
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

      if (v != null && e[f.name] == null) {
        if (f.kind === 'email' && !isEmail(String(v))) e[f.name] = 'Invalid email';
        else if (f.kind === 'tel' && !isPhone(String(v))) e[f.name] = 'Invalid phone';
        else if (f.kind === 'date' && !isRealDateMMDDYYYY(String(v), { minYear: 1900, maxYear: 2030 })) {
          e[f.name] = 'Use a real date in MM-DD-YYYY (1900–2030)';
        }
      }
    }
    return e;
  }, [config.fields, values]);

  const customErrors = useMemo(() => (config.validate ? config.validate(values) : {}), [config, values]);
  const errors = { ...baseErrors, ...customErrors };

  const quizWrongByField = useMemo(() => {
    const wrong: Record<string, true> = {};
    for (const f of config.fields) {
      if (isRadio(f) && f.correctValue && values[f.name] && (values[f.name] as string) !== f.correctValue) {
        wrong[f.name] = true;
      }
    }
    return wrong;
  }, [config.fields, values]);

  const visibleRequired = config.fields.filter((f) => f.required && !(f.showIf && !f.showIf(values)));
  const requiredCount = visibleRequired.length;
  const requiredSatisfied = visibleRequired.filter((f) => {
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
      let ok = false;

      if (onSubmit) {
        await onSubmit(payload);
        ok = true;
      } else if (config.apiPath) {
        await fetch(config.apiPath(appId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId: appId, ...payload }),
        });
        ok = true;
      }

      if (ok && clearOnSuccess) setValues({});
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  const cols = config.columns ?? 2;

  /** IMPORTANT: coerce map() return to ReactNode to avoid “unknown not assignable to ReactNode” */
  const renderedFields: React.ReactNode[] = config.fields.map((f): React.ReactNode => {
    if (f.showIf && !f.showIf(values)) return null;

    return (
      <div key={f.name} className={isTextarea(f) || f.span === 2 ? 'md:col-span-2' : ''}>
        <label className="block text-sm font-medium text-gray-800" htmlFor={f.name}>
          {f.label}
          {f.required && <span className="text-red-600"> *</span>}
        </label>

        {/* textarea */}
        {isTextarea(f) ? (
          <TextArea
            id={f.name}
            placeholder={f.placeholder}
            rows={f.rows ?? 4}
            value={(values[f.name] as string) ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
          />
        ) : null}

        {/* text|email|tel|date */}
        {isTextInput(f) ? (
          f.kind === 'date' ? (
            <Input
              id={f.name}
              type="text"
              inputMode="numeric"
              placeholder={f.placeholder || 'MM-DD-YYYY'}
              value={(values[f.name] as string) ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
            />
          ) : (
            <Input
              id={f.name}
              type={f.kind}
              placeholder={f.placeholder}
              value={(values[f.name] as string) ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
            />
          )
        ) : null}

        {/* radio */}
        {isRadio(f) ? (
          <div className="mt-1 grid grid-cols-1 gap-2">
            {f.options.map((opt) => {
              const selected = (values[f.name] as string) === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-2 text-sm ${
                    selected ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={f.name}
                      value={opt.value}
                      className="h-4 w-4 accent-black"
                      checked={selected}
                      onChange={() => setValues((v) => ({ ...v, [f.name]: opt.value }))}
                    />
                    <span>{opt.label}</span>
                  </div>
                  {selected && <CheckCircle2 className="h-5 w-5" />}
                </label>
              );
            })}
          </div>
        ) : null}

        {/* checkbox */}
        {f.kind === 'checkbox' ? (
          <label className="mt-1 flex items-start gap-3 text-sm text-gray-800">
            <input
              id={f.name}
              type="checkbox"
              className="mt-1 h-4 w-4 accent-black"
              checked={Boolean(values[f.name])}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.checked }))}
            />
            <span>{f.label}</span>
          </label>
        ) : null}

        {/* signature */}
        {isSignature(f) ? (
          <SignatureField
            height={f.height}
            onChange={(dataUrl) => setValues((v) => ({ ...v, [f.name]: dataUrl }))}
          />
        ) : null}

        {/* file (custom-styled) */}
        {isFile(f) ? (
          <div className="mt-1">
            <input
              id={f.name}
              type="file"
              accept={f.accept}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setValues((v) => ({ ...v, [f.name]: file ?? undefined }));
              }}
            />
            <label
              htmlFor={f.name}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm cursor-pointer hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                <path d="M7 9l5-5 5 5" />
                <path d="M12 4v12" />
              </svg>
              {values[f.name] instanceof File ? 'Change file' : 'Upload file'}
            </label>
            <div className="mt-2 text-xs text-gray-600">
              {values[f.name] instanceof File ? (
                <>
                  Selected: <span className="font-medium">{(values[f.name] as File).name}</span>
                </>
              ) : (
                <>Accepted: {f.accept || 'any file'}</>
              )}
            </div>
          </div>
        ) : null}

        {/* help/error */}
        {f.helpText ? <p className="mt-1 text-xs text-gray-600">{f.helpText}</p> : null}
        {errors[f.name] ? <p className="mt-1 text-xs text-red-600">{errors[f.name]}</p> : null}

        {/* Wrong-answer callout for quiz radios */}
        {isRadio(f) && f.correctValue && values[f.name] && (values[f.name] as string) !== f.correctValue ? (
          <ErrorCallout title={f.wrongCallout?.title} points={f.wrongCallout?.points || []} />
        ) : null}
      </div>
    );
  });

  return (
    <form onSubmit={handleSubmit} className="min-h-dvh bg-gradient-to-b from-gray-50 to-white">
      <SectionHeader title={config.title} subtitle={config.subtitle} icon={config.icon} />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <Card>
          <div className={`grid grid-cols-1 gap-4 ${cols === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
            {renderedFields}
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
   Ready-made configs (unchanged content)
   ============================ */

// 1) Rules & Acknowledgment
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
          'No white T-shirts.',
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
  buildPayload: (v) =>
    ({
      rulesColor: v.color,
      rulesPhonePolicy: v.phonePolicy,
      rulesShareContact: v.shareContact,
      rulesWrittenMaterials: v.writtenMaterials,
      acknowledgmentAgreement: !!v.ack,
    } as Record<string, unknown>),
};

// 2) Personal Information
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
    { kind: 'date', name: 'dateOfBirth', label: 'Date of birth (MM-DD-YYYY)', required: true },
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
    if (!isRealDateMMDDYYYY(v.dateOfBirth as string)) {
      e.dateOfBirth = 'Use a real date in MM-DD-YYYY (1900–2030)';
    }
    return e;
  },
  buildPayload: (v) => v,
};

// 3) Contact & Organization
export const contactOrgConfig: SectionConfig = {
  title: 'Contact & Organization',
  subtitle: 'We’ll use this for visit planning and updates.',
  icon: <Building2 className="h-6 w-6" />,
  apiPath: (id) => `/api/applications/${id ?? 'temp'}/contact`,
  columns: 2,
  fields: [
    { kind: 'email', name: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
    { kind: 'tel', name: 'phoneNumber', label: 'Phone number', required: true, placeholder: '415-555-1234 or +27 82 123 4567' },
    { kind: 'date', name: 'visitDate', label: 'Preferred visit date (MM-DD-YYYY, optional)' },
    { kind: 'text', name: 'companyOrOrganization', label: 'Company / Organization', required: true },
    { kind: 'textarea', name: 'purposeOfVisit', label: 'Purpose of visit', required: true, rows: 4 },
  ],
  buildPayload: (v) => v,
};

// 4) Prior Experience & Expectations
export const experienceConfig: SectionConfig = {
  columns: 1,
  title: 'Prior Experience & Expectations',
  subtitle: 'There are no right or wrong answers—just your honest thoughts.',
  icon: <User className="h-6 w-6" />,
  fields: [
    {
      kind: 'radio',
      name: 'engagedDirectly',
      label: 'Have you ever engaged directly with incarcerated people before?',
      required: true,
      span: 2,
      options: [
        { label: 'No, this is my first time directly engaging with incarcerated people.', value: 'no_first_time' },
        { label: 'Yes, I have a personal connection (e.g., family/friends).', value: 'personal_connection' },
        { label: 'Yes, through volunteer work.', value: 'volunteer' },
        { label: 'Yes, in a professional capacity (e.g., work, advocacy, research, media).', value: 'professional' },
        { label: 'Other', value: 'other' },
      ],
    },
    { kind: 'textarea', name: 'perceptions', label: 'What comes to mind when you think about incarcerated people?', required: true, rows: 4 },
    { kind: 'textarea', name: 'expectations', label: 'What do you expect to experience during your visit to SkunkWorks?', required: true, rows: 4 },
    {
      kind: 'radio',
      name: 'justiceReformBefore',
      label: 'Have you been involved in justice reform efforts before?',
      required: true,
      options: [
        { label: 'Yes, I am actively engaged in justice reform.', value: 'active' },
        { label: 'Yes, but only in a limited capacity.', value: 'limited' },
        { label: 'No, I have never been involved.', value: 'never' },
        { label: 'No, but I have thought about it.', value: 'thought_about' },
        { label: 'Other', value: 'other' },
      ],
    },
    { kind: 'textarea', name: 'interestsMost', label: 'What interests you most about this visit?', required: true, rows: 4 },
    {
      kind: 'radio',
      name: 'reformFuture',
      label: 'Do you see yourself engaging in criminal justice reform efforts in the future?',
      required: true,
      options: [
        { label: 'Yes, I’m already involved and plan to continue.', value: 'already_involved_continue' },
        { label: 'Yes, I’ve thought about it but haven’t taken action yet.', value: 'considering' },
        { label: 'Maybe, depending on what I learn from this visit.', value: 'maybe' },
        { label: 'No, this is just a one-time visit for me.', value: 'one_time' },
        { label: 'Other', value: 'other' },
      ],
    },
    { kind: 'textarea', name: 'additionalNotes', label: 'Is there anything else you’d like us to know before your visit? (Optional)', rows: 3 },
  ],
  buildPayload: (v) => v,
};

// 5) Security Clearance Information (WITH DOUBLE-ENTRY CONFIRM FIELDS)
export const securityConfig: SectionConfig = {
  title: 'Security Clearance Information',
  subtitle: 'Provide the ID details used for CDCR clearance.',
  icon: <Shield className="h-6 w-6" />,
  columns: 1,
  fields: [
    {
      kind: 'radio',
      name: 'governmentIdType',
      label: 'Type of ID used for clearance',
      required: true,
      options: [
        { label: 'Driver’s License', value: 'driver_license' },
        { label: 'Passport', value: 'passport' },
      ],
    },
    {
      kind: 'text',
      name: 'governmentIdNumber',
      label: 'Government ID Number (DL or Passport)',
      required: true,
      placeholder: 'D1234567 or 123456789',
    },

    {
      kind: 'text',
      name: 'governmentIdNumberConfirm',
      label: 'Confirm Government ID Number',
      required: true,
      placeholder: 'Re-enter to confirm',
    },
    {
      kind: 'text',
      name: 'idState',
      label: 'State where your ID was issued',
      required: true,
      placeholder: 'CA, NY, TX',
      showIf: (v) => v.governmentIdType === 'driver_license',
    },
    {
      kind: 'date',
      name: 'idExpiration',
      label: 'ID expiration (MM-DD-YYYY)',
      required: true,
      placeholder: 'MM-DD-YYYY',
    },
    {
      kind: 'radio',
      name: 'ssnMethod',
      label: 'How would you like to provide your SSN?',
      required: true,
      options: [
        { label: 'Directly through this form', value: 'direct' },
        { label: 'Call the Executive Director (phone method)', value: 'call' },
        { label: 'Split: first five here, last four via text/email/call', value: 'split' },
      ],
    },
    {
      kind: 'text',
      name: 'ssnFull',
      label: 'Enter your full SSN',
      placeholder: '123-45-6789',
      required: true,
      showIf: (v) => v.ssnMethod === 'direct',
      helpText: 'Format: 123-45-6789 or 123456789',
    },

    {
      kind: 'text',
      name: 'ssnFullConfirm',
      label: 'Confirm your full SSN',
      placeholder: '123-45-6789',
      required: true,
      showIf: (v) => v.ssnMethod === 'direct',
    },
    {
      kind: 'text',
      name: 'ssnFirstFive',
      label: 'Enter the first five digits of your SSN',
      placeholder: '12345',
      required: true,
      showIf: (v) => v.ssnMethod === 'split',
      helpText: 'Send the remaining four digits via text/email/voice.',
    },
   
    {
      kind: 'text',
      name: 'ssnFirstFiveConfirm',
      label: 'Confirm the first five digits of your SSN',
      placeholder: '12345',
      required: true,
      showIf: (v) => v.ssnMethod === 'split',
    },
    {
      kind: 'radio',
      name: 'formerInmate',
      label: 'Have you ever been incarcerated?',
      required: true,
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
    {
      kind: 'file',
      name: 'wardenLetter',
      label: 'Upload your letter to the Warden (PDF or image)',
      required: true,
      accept: '.pdf,image/*',
      showIf: (v) => v.formerInmate === 'yes',
    },
    {
      kind: 'radio',
      name: 'onParole',
      label: 'Are you currently on parole?',
      required: true,
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
    {
      kind: 'checkbox',
      name: 'confirmAccuracy',
      label: 'I confirm the information is accurate and truthful.',
      required: true,
    },
    {
      kind: 'signature',
      name: 'digitalSignature',
      label: 'Please sign inside the box (digital signature)',
      required: true,
      span: 2,
    },
    {
      kind: 'checkbox',
      name: 'consentToDataUse',
      label:
        'I consent to the use of my information solely for security clearance and entry to San Quentin SkunkWorks (impact answers may be used anonymously).',
      required: true,
    },
  ],

  validate: (v) => {
    const e: Record<string, string> = {};

    if (!isRealDateMMDDYYYY(v.idExpiration as string)) {
      e.idExpiration = 'Use a real date in MM-DD-YYYY';
    } else if (!isFutureOrTodayMMDDYYYY(v.idExpiration as string)) {
      e.idExpiration = 'ID is expired';
    }

    const gov = validateGovId(v.governmentIdType as string | undefined, v.governmentIdNumber as string | undefined);
    if (!gov.ok) e.governmentIdNumber = gov.msg!;

    if (v.governmentIdType === 'driver_license') {
      const st = String(v.idState ?? '').trim();
      if (!/^[A-Z]{2}$/i.test(st)) e.idState = 'Use 2-letter state code (e.g., CA, NY)';
    } else if (v.governmentIdType === 'passport') {
      if ((v.idState as string | undefined)?.trim()) e.idState = 'Do not provide a state for passports';
    }

    if (v.ssnMethod === 'direct') {
      const ssn = normalizeAndValidateSSN(v.ssnFull as string | undefined);
      if (!ssn.ok) e.ssnFull = ssn.msg!;
    } else if (v.ssnMethod === 'split') {
      const first5 = onlyDigits((v.ssnFirstFive as string | undefined) || '');
      if (first5.length !== 5) e.ssnFirstFive = 'Enter exactly 5 digits';
    }

    if (v.formerInmate === 'yes' && !(v.wardenLetter instanceof File)) {
      e.wardenLetter = 'Please upload your letter to the Warden';
    }

    // --- Double-entry validation additions ---
    // Government ID confirm (normalize both before comparing)
    if (typeof v.governmentIdNumber === 'string' && typeof v.governmentIdNumberConfirm === 'string') {
      const primary = normalizeGovId(v.governmentIdNumber);
      const confirm = normalizeGovId(v.governmentIdNumberConfirm);
      if (primary && confirm && primary !== confirm) {
        e.governmentIdNumberConfirm = 'The confirmation number does not match';
      }
    }

    // SSN (direct): compare digits-only 9-digit strings
    if (v.ssnMethod === 'direct') {
      const a = onlyDigits(String(v.ssnFull ?? ''));
      const b = onlyDigits(String(v.ssnFullConfirm ?? ''));
      if (a && b && a !== b) {
        e.ssnFullConfirm = 'The confirmation number does not match';
      }
    }

    // SSN (split): compare first 5 digits
    if (v.ssnMethod === 'split') {
      const a5 = onlyDigits(String(v.ssnFirstFive ?? ''));
      const b5 = onlyDigits(String(v.ssnFirstFiveConfirm ?? ''));
      if (a5 && b5 && a5 !== b5) {
        e.ssnFirstFiveConfirm = 'The confirmation number does not match';
      }
    }

    return e;
  },

  buildPayload: (v) => {
    const pl: Record<string, any> = { ...v };

    const gov = validateGovId(pl.governmentIdType as string | undefined, pl.governmentIdNumber as string | undefined);
    if (gov.ok) pl.governmentIdNumber = gov.normalized;

    if (pl.ssnFull) pl.ssnFull = onlyDigits(pl.ssnFull as string);
    if (pl.ssnFirstFive) pl.ssnFirstFive = onlyDigits(pl.ssnFirstFive as string).slice(0, 5);

    if (pl.wardenLetter instanceof File) {
      pl.wardenLetterName = (pl.wardenLetter as File).name;
      delete pl.wardenLetter;
    }

    pl.formerInmate = pl.formerInmate === 'yes';
    (pl as Record<string, any>).onProbationParole = pl.onParole === 'yes';
    delete pl.onParole;

    if (pl.idState) pl.idState = String(pl.idState).trim().toUpperCase();

    // --- Drop confirmation fields; only send canonical values ---
    delete pl.governmentIdNumberConfirm;
    delete pl.ssnFullConfirm;
    delete pl.ssnFirstFiveConfirm;

    return pl;
  },
};

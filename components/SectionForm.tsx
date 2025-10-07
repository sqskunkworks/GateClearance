'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, Building2, CheckCircle2, AlertTriangle } from 'lucide-react';

/**
 * SectionForm.tsx
 * ------------------------------------------------------
 * A single, reusable form section component rendered from a config.
 * Three ready-made configs are exported: rulesConfig, personalConfig, contactOrgConfig.
 * Styling: Tailwind v4; 
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
  span?: 1 | 2;
  // allows conditional display based on current values
  showIf?: (values: Record<string, any>) => boolean;

};

export type RadioOption = { label: string; value: string };

export type Field =
  | (FieldBase & { kind: 'text' | 'email' | 'tel' | 'date' })
  | (FieldBase & { kind: 'textarea'; rows?: number })
  | (FieldBase & {
      kind: 'radio';
      options: RadioOption[];
      correctValue?: string;
      wrongCallout?: { title?: string; points: string[] };
    })
  | (FieldBase & { kind: 'checkbox' })
  | (FieldBase & { kind: 'file'; accept?: string });



  export type SectionConfig = {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    fields: Field[];
    validate?: (values: Record<string, any>) => Record<string, string>;
    buildPayload?: (values: Record<string, any>) => Record<string, any>;
    apiPath?: (applicationId?: string) => string;
    ctaLabel?: string;
    columns?: 1 | 2; // NEW
  };
  
export type SectionFormProps = {
  applicationId?: string;
  config: SectionConfig;
  initialValues?: Record<string, any>;
  clearOnSuccess?: boolean;
  onSubmit?: (values: Record<string, any>) => Promise<void> | void;
};

/* =======
   UI
   ======== */
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

/* ==========
   Helpers
   ============== */
const isEmail = (v: string) => /.+@.+\..+/.test(v.trim());

const digits = (s: string) => s.replace(/\D/g, '');
const isPhone = (v: string) => {
  const d = digits(v);
  return d.length >= 10 && d.length <= 15;
};
const isYMD = (v?: string) => !!(v && /^\d{4}-\d{2}-\d{2}$/.test(v));
const isRealDateYMD = (v?: string) => {
  if (!isYMD(v)) return false;
  const [y, m, d] = (v as string).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
};

// Accepts strictly "MM-DD-YYYY" and checks real calendar date + year range
const isRealDateMMDDYYYY = (
  s?: string,
  { minYear = 1900, maxYear = 2030 }: { minYear?: number; maxYear?: number } = {}
) => {
  if (!s || !/^\d{2}-\d{2}-\d{4}$/.test(s)) return false;
  const [mm, dd, yyyy] = s.split('-').map(Number);
  if (yyyy < minYear || yyyy > maxYear) return false;

  const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
  return (
    dt.getUTCFullYear() === yyyy &&
    dt.getUTCMonth() === mm - 1 &&
    dt.getUTCDate() === dd
  );
};

// ---------- PII validators & normalizers ----------
const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');
const isAllSameDigits = (s: string) => /^([0-9])\1{8}$/.test(s); // 000000000, 111111111, ...

// SSN: accept 123-45-6789 or 123456789; must be 9 digits, reject trivial/invalid combos
function normalizeAndValidateSSN(raw?: string) {
  const digits = onlyDigits(raw || '');
  if (digits.length !== 9) return { ok: false, digits, msg: 'SSN must be 9 digits' };
  // reject obviously invalid patterns
  const area = digits.slice(0, 3), group = digits.slice(3, 5), serial = digits.slice(5);
  if (area === '000' || group === '00' || serial === '0000') {
    return { ok: false, digits, msg: 'SSN format is invalid' };
  }
  if (isAllSameDigits(digits) || digits === '123456789') {
    return { ok: false, digits, msg: 'SSN looks invalid' };
  }
  return { ok: true, digits };
}

// US Passport (typical): 9 alphanumeric; Driver License: allow A–Z0–9, 5–20 chars
function normalizeGovId(raw?: string) {
  const s = (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s;
}

function validateGovId(type?: string, value?: string) {
  const s = normalizeGovId(value);
  if (!s) return { ok: false, msg: 'Government ID is required' };

  if (type === 'passport') {
    if (!/^[A-Z0-9]{9}$/.test(s)) {
      return { ok: false, msg: 'Passport # must be 9 letters/numbers' };
    }
  } else {
    // driver’s license (generic, permissive)
    if (s.length < 5 || s.length > 20) {
      return { ok: false, msg: 'DL number must be 5–20 letters/numbers' };
    }
  }
  return { ok: true, normalized: s };
}

// Date must be real (MM-DD-YYYY) and not in the past
function isFutureOrTodayMMDDYYYY(s?: string) {
  if (!isRealDateMMDDYYYY(s)) return false;
  const [mm, dd, yyyy] = (s as string).split('-').map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  const today = new Date(); today.setHours(0,0,0,0);
  return d >= today;
}





/* =============
   Component
   ================== */
export function SectionForm({ applicationId, config, initialValues,clearOnSuccess, onSubmit }: SectionFormProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues || {});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [appId]=useState(applicationId);
 
  // Base validation
  const baseErrors = useMemo(() => {
    const e: Record<string, string> = {};
  
    for (const f of config.fields) {
      // skip hidden fields
      if (f.showIf && !f.showIf(values)) continue;
  
      const v = values[f.name];
  
      // required
      if (f.required) {
        if (f.kind === 'checkbox') {
          if (!v) e[f.name] = 'Required';
        } else if (typeof v === 'string') {
          if (!v.trim()) e[f.name] = 'Required';
        } else if (v == null) {
          e[f.name] = 'Required';
        }
      }
  
      // type checks (only if not already errored)
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

  const visibleRequired = config.fields.filter(
    (f) => f.required && !(f.showIf && !f.showIf(values))
  );
  
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
      let ok = false; // NEW
    
      if (onSubmit) {
        await onSubmit(payload);
        ok = true;
      } else if (config.apiPath) {
        await fetch(config.apiPath(appId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId: appId, ...payload }), // use appId
        });
        ok = true;
      }
    
      // NEW: wipe client-side values if caller asked for it
      if (ok && clearOnSuccess) setValues({});
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
          {config.fields.map((f) => {
    if (f.showIf && !f.showIf(values)) return null; // respect showIf
    return (
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
               {/* DATE: strict MM-DD-YYYY */}
{f.kind === 'date' ? (
  <Input
    id={f.name}
    type="text"
    inputMode="numeric"
    placeholder={f.placeholder || 'MM-DD-YYYY'}
    value={values[f.name] ?? ''}
    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
  />
) : (
  (f.kind === 'text' || f.kind === 'email' || f.kind === 'tel') && (
    <Input
      id={f.name}
      type={f.kind === 'text' ? 'text' : f.kind}
      placeholder={f.placeholder}
      value={values[f.name] ?? ''}
      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
    />
  )
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

{/* kind = file */}
{/* kind = file (custom-styled) */}
{f.kind === 'file' && (
  <div className="mt-1">
    {/* Hidden native input */}
    <input
      id={f.name}
      type="file"
      accept={(f as any).accept}
      className="sr-only"
      onChange={(e) => {
        const file = e.target.files?.[0] || null;
        setValues((v) => ({ ...v, [f.name]: file }));
      }}
    />

    {/* Pretty label acts as button */}
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

    {/* Filename / helper */}
    <div className="mt-2 text-xs text-gray-600">
      {values[f.name] instanceof File
        ? <>Selected: <span className="font-medium">{(values[f.name] as File).name}</span></>
        : <>Accepted: {(f as any).accept || 'any file'}</>}
    </div>
  </div>
)}




                {/* help/error */}
                {f.helpText && <p className="mt-1 text-xs text-gray-600">{f.helpText}</p>}
                {errors[f.name] && <p className="mt-1 text-xs text-red-600">{errors[f.name]}</p>}

                {/* Wrong-answer callout for quiz radios */}
                {f.kind === 'radio' && (f as any).correctValue && values[f.name] && values[f.name] !== (f as any).correctValue && (
                  <ErrorCallout title={(f as any).wrongCallout?.title} points={(f as any).wrongCallout?.points || []} />
                )}
             </div>
    );
  })}
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

/* ==========
   Ready-made configs for the sections
   ========== */

// 1) Rules & Acknowledgment — single column temp
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
    rulesColor: v.color,
    rulesPhonePolicy: v.phonePolicy,
    rulesShareContact: v.shareContact,
    rulesWrittenMaterials: v.writtenMaterials,
    acknowledgmentAgreement: !!v.ack,
  }),
  
};

// 2) Personal Information — two columns temp
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
    if (!isRealDateMMDDYYYY(v.dateOfBirth)) {
      e.dateOfBirth = 'Use a real date in MM-DD-YYYY (1900–2030)';
    }
    return e;
  },
  
  buildPayload: (v) => v,
};

// 3) Contact & Organization — two columns temp
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
  columns:1,
  title: 'Prior Experience & Expectations',
  subtitle: 'There are no right or wrong answers—just your honest thoughts.',
  icon: <User className="h-6 w-6" />,
  // backend route to add later:
  // apiPath: (id) => `/api/applications/${id ?? 'temp'}/experience`,
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
  // flat payload to match your schema
  buildPayload: (v) => v,
};

// 5) Security Clearance Information
export const securityConfig: SectionConfig = {
  title: 'Security Clearance Information',
  subtitle: 'Provide the ID details used for CDCR clearance.',
  icon: <Shield className="h-6 w-6" />,
  // apiPath: (id) => `/api/applications/${id ?? 'temp'}/security`,
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
      name: 'ssnFirstFive',
      label: 'Enter the first five digits of your SSN',
      placeholder: '12345',
      required: true,
      showIf: (v) => v.ssnMethod === 'split',
      helpText: 'Send the remaining four digits via text/email/voice.',
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
      kind: 'text',
      name: 'digitalSignature',
      label: 'Please type your full name as a digital signature',
      required: true,
    },
    {
      kind: 'checkbox',
      name: 'confirmAccuracy',
      label: 'I confirm the information is accurate and truthful.',
      required: true,
    },
    {
      kind: 'checkbox',
      name: 'consentToDataUse',
      label:
        'I consent to the use of my information solely for security clearance and entry to San Quentin SkunkWorks (impact answers may be used anonymously).',
      required: true,
    },
  ],

  // NEW: field-level validation
  validate: (v) => {
    const e: Record<string, string> = {};

    // Expiration date must be real + today or future
    if (!isRealDateMMDDYYYY(v.idExpiration)) {
      e.idExpiration = 'Use a real date in MM-DD-YYYY';
    } else if (!isFutureOrTodayMMDDYYYY(v.idExpiration)) {
      e.idExpiration = 'ID is expired';
    }

    // Gov ID required + format by type
    const gov = validateGovId(v.governmentIdType, v.governmentIdNumber);
    if (!gov.ok) e.governmentIdNumber = gov.msg!;

    // idState required only for DL; must be empty for passport
    if (v.governmentIdType === 'driver_license') {
      if (!v.idState || !/^[A-Z]{2}$/i.test(String(v.idState).trim())) {
        e.idState = 'Use 2-letter state code (e.g., CA, NY)';
      }
    } else if (v.governmentIdType === 'passport') {
      if (v.idState && String(v.idState).trim() !== '') {
        e.idState = 'Do not provide a state for passports';
      }
    }

    // SSN checks based on method
    if (v.ssnMethod === 'direct') {
      const ssn = normalizeAndValidateSSN(v.ssnFull);
      if (!ssn.ok) e.ssnFull = ssn.msg!;
    } else if (v.ssnMethod === 'split') {
      const first5 = onlyDigits(v.ssnFirstFive || '');
      if (first5.length !== 5) e.ssnFirstFive = 'Enter exactly 5 digits';
    }

    // Warden letter required when former inmate
    if (v.formerInmate === 'yes' && !(v.wardenLetter instanceof File)) {
      e.wardenLetter = 'Please upload your letter to the Warden';
    }

    return e;
  },


 buildPayload: (v) => {
    const pl: Record<string, any> = { ...v };

    // normalize gov id
    const gov = validateGovId(pl.governmentIdType, pl.governmentIdNumber);
    if (gov.ok) pl.governmentIdNumber = gov.normalized;

    // normalize SSN pieces (digits only)
    if (pl.ssnFull) pl.ssnFull = onlyDigits(pl.ssnFull);
    if (pl.ssnFirstFive) pl.ssnFirstFive = onlyDigits(pl.ssnFirstFive).slice(0, 5);

    // file: keep just a name for now
    if (pl.wardenLetter instanceof File) {
      pl.wardenLetterName = pl.wardenLetter.name;
      delete pl.wardenLetter;
    }

    // booleans
    pl.formerInmate = pl.formerInmate === 'yes';
    pl.onProbationParole = pl.onParole === 'yes';
    delete pl.onParole;

    // uppercase state
    if (pl.idState) pl.idState = String(pl.idState).trim().toUpperCase();

    return pl;
  },
};
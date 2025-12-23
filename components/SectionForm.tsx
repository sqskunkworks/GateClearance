'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import SignaturePad, { SignaturePadHandle } from '@/components/SignaturePad';
import { z } from 'zod';
import { getErrorMessages } from '@/lib/validation/applicationSchema';

/* ============================
   Types
   ============================ */
export type FormValue = string | boolean | File | null | undefined;
export type FormValues = Record<string, FormValue>;

export type FieldBase = {
  name: string;
  label: string;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  span?: 1 | 2;
  showIf?: (values: FormValues) => boolean;
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
  zodSchema: z.ZodType<FormValues>; 
  ctaLabel?: string;
  columns?: 1 | 2;
};

export type SectionFormProps = {
  config: SectionConfig;
  initialValues?: FormValues;
  clearOnSuccess?: boolean;
  onSubmit?: (values: FormValues) => Promise<void> | void;
};

/* ======= UI Components ======= */
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
const isCheckbox = (f: Field): f is Extract<Field, { kind: 'checkbox' }> => f.kind === 'checkbox';

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

/* ======= Main Component ======= */
export function SectionForm({
  config,
  initialValues,
  clearOnSuccess,
  onSubmit,
}: SectionFormProps) {
  const [values, setValues] = useState<FormValues>(initialValues || {});
  
  useEffect(() => {
    if (initialValues) {
      setValues(initialValues);
    }
  }, [initialValues]);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const zodErrors = useMemo(() => {
    const result = config.zodSchema.safeParse(values);
    if (result.success) return {};
    return getErrorMessages(result.error);
  }, [config.zodSchema, values]);

  const errors = useMemo(() => {
    const displayErrors: Record<string, string> = {};
    Object.keys(zodErrors).forEach((key) => {
      if (touched[key]) {
        const value = values[key];
        const hasContent = typeof value === 'string' ? value.trim().length > 0 : value != null;
        const formSubmitted = Object.keys(touched).length === config.fields.length;
        
        if (hasContent || formSubmitted || key.endsWith('Confirm')) {
          displayErrors[key] = zodErrors[key];
        }
      }
    });
    return displayErrors;
  }, [zodErrors, touched, values, config.fields]);

  const quizWrongByField = useMemo(() => {
    const wrong: Record<string, true> = {};
    for (const f of config.fields) {
      if (isRadio(f) && f.correctValue && values[f.name] && values[f.name] !== f.correctValue) {
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
  const hasNoErrors = Object.keys(zodErrors).length === 0;
  const canSubmit = requiredSatisfied === requiredCount && quizOk && hasNoErrors && !submitting;

  const handleBlur = (fieldName: string) => {
    setTouched((prev) => {
      const newTouched = { ...prev, [fieldName]: true };
      
      if (fieldName.endsWith('Confirm')) {
        const originalField = fieldName.replace('Confirm', '');
        newTouched[originalField] = true;
      }
      
      const confirmField = `${fieldName}Confirm`;
      if (config.fields.some(f => f.name === confirmField) && prev[confirmField]) {
        newTouched[confirmField] = true;
      }
      
      return newTouched;
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const allTouched: Record<string, boolean> = {};
    config.fields.forEach((f) => {
      allTouched[f.name] = true;
    });
    setTouched(allTouched);

    if (!canSubmit) return;
    setSubmitError(null);

    try {
      setSubmitting(true);
      
      const result = config.zodSchema.safeParse(values);
      if (!result.success) {
        const firstError = result.error.issues[0];
        setSubmitError(`Validation error: ${firstError.message}`);
        return;
      }

      if (onSubmit) {
        await onSubmit(result.data);
      }

      if (clearOnSuccess) setValues({});
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  const cols = config.columns ?? 2;

  const renderedFields: React.ReactNode[] = config.fields.map((f): React.ReactNode => {
    if (f.showIf && !f.showIf(values)) return null;

    return (
      <div key={f.name} className={isTextarea(f) || f.span === 2 ? 'md:col-span-2' : ''}>
        {!isCheckbox(f) && (
          <label className="block text-sm font-medium text-gray-800" htmlFor={f.name}>
            {f.label}
            {f.required && <span className="text-red-600"> *</span>}
          </label>
        )}

        {isTextarea(f) && (
          <TextArea
            id={f.name}
            placeholder={f.placeholder}
            rows={f.rows ?? 4}
            value={(values[f.name] as string) ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
            onBlur={() => handleBlur(f.name)}
          />
        )}

        {isTextInput(f) && (
          <Input
            id={f.name}
            type={f.kind === 'date' ? 'text' : f.kind}
            inputMode={f.kind === 'date' ? 'numeric' : undefined}
            placeholder={f.placeholder || (f.kind === 'date' ? 'MM-DD-YYYY' : undefined)}
            value={(values[f.name] as string) ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
            onBlur={() => handleBlur(f.name)}
          />
        )}

        {isRadio(f) && (
          <div className="mt-1 grid grid-cols-1 gap-2">
            {f.options.map((opt) => {
              const selected = (values[f.name] as string) === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-2 text-sm cursor-pointer ${
                    selected ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={f.name}
                      value={opt.value}
                      className="h-4 w-4 accent-black cursor-pointer"
                      checked={selected}
                      onChange={() => {
                        setValues((v) => ({ ...v, [f.name]: opt.value }));
                        handleBlur(f.name);
                      }}
                    />
                    <span>{opt.label}</span>
                  </div>
                  {selected && <CheckCircle2 className="h-5 w-5" />}
                </label>
              );
            })}
          </div>
        )}

        {isCheckbox(f) && (
          <label className="mt-1 flex items-start gap-3 text-sm text-gray-800 cursor-pointer">
            <input
              id={f.name}
              type="checkbox"
              className="mt-1 h-4 w-4 accent-black cursor-pointer"
              checked={Boolean(values[f.name])}
              onChange={(e) => {
                setValues((v) => ({ ...v, [f.name]: e.target.checked }));
                handleBlur(f.name);
              }}
            />
            <span>
              {f.label}
              {f.required && <span className="text-red-600"> *</span>}
            </span>
          </label>
        )}

        {isSignature(f) && (
          <SignatureField
            height={f.height}
            onChange={(dataUrl) => {
              setValues((v) => ({ ...v, [f.name]: dataUrl }));
              handleBlur(f.name);
            }}
          />
        )}

        {isFile(f) && (
          <div className="mt-1">
            <input
              id={f.name}
              type="file"
              accept={f.accept}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setValues((v) => ({ ...v, [f.name]: file ?? undefined }));
                handleBlur(f.name);
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
        )}

        {f.helpText && <p className="mt-1 text-xs text-gray-600">{f.helpText}</p>}
        {errors[f.name] && <p className="mt-1 text-xs text-red-600">{errors[f.name]}</p>}

        {isRadio(f) && f.correctValue && values[f.name] && values[f.name] !== f.correctValue && (
          <ErrorCallout title={f.wrongCallout?.title} points={f.wrongCallout?.points || []} />
        )}
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

      <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <div className="text-xs text-gray-600">
            Required complete: {requiredSatisfied}/{requiredCount}
            {Object.keys(zodErrors).length > 0 && <span className="text-red-600 ml-2">• Validation errors</span>}
          </div>
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
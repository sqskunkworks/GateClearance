'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import SignaturePad, { SignaturePadHandle } from '@/components/SignaturePad';
import { z } from 'zod';
import { getErrorMessages } from '@/lib/validation/applicationSchema';

/* ======= Helper Functions ======= */
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Handle international format
  if (digits.startsWith('1') && digits.length === 11) {
    // US number with country code: +1 (415) 555-1234
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  }
  
  // Handle 10-digit US number
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  
  // Handle partial input
  if (digits.length > 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length > 3) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  if (digits.length > 0) {
    return `(${digits}`;
  }
  
  return value;
};

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
  onBack?: () => Promise<void> | void;
  currentStep?: number;
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
  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">{children}</div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-black focus:ring-2 focus:ring-black/10 ${
      props.className || ''
    }`}
  />
);

const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={`min-h-[96px] w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-black focus:ring-2 focus:ring-black/10 ${
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

/* ======= Toast Notification ======= */
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
  >
    <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
      <CheckCircle2 className="h-5 w-5" />
      <span className="font-medium">{message}</span>
    </div>
  </motion.div>
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
  onSaveSuccess,
}: {
  height?: number;
  onChange: (dataUrl: string) => void;
  onSaveSuccess?: () => void;
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
    onSaveSuccess?.();
  };

  return (
    <div>
      <SignaturePad ref={padRef} height={height ?? 160} />
      <div className="mt-3 flex gap-2">
        <button 
          type="button" 
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors" 
          onClick={handleSave}
        >
          Save Signature
        </button>
        <button
          type="button"
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
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
  onBack,
  currentStep,
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
  const [showToast, setShowToast] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const zodErrors = useMemo(() => {
    const result = config.zodSchema.safeParse(values);
    if (result.success) return {};
    return getErrorMessages(result.error);
  }, [config.zodSchema, values]);

  const errors = useMemo(() => {
    const displayErrors: Record<string, string> = {};
    
    Object.keys(zodErrors).forEach((key) => {
      // BEFORE first submit attempt: Show errors for any touched field
      if (!submitAttempted) {
        if (touched[key]) {
          displayErrors[key] = zodErrors[key];
        }
      } else {
        // AFTER first submit attempt: Show ALL errors
        displayErrors[key] = zodErrors[key];
      }
    });
    
    return displayErrors;
  }, [zodErrors, touched, submitAttempted]);

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
      
      // If this is a confirm field, mark the original field as touched too
      if (fieldName.endsWith('Confirm')) {
        const originalField = fieldName.replace('Confirm', '');
        newTouched[originalField] = true;
      }
      
      // If this is an original field, mark the confirm field as touched too (if it exists and has value)
      const confirmField = `${fieldName}Confirm`;
      if (config.fields.some(f => f.name === confirmField) && values[confirmField]) {
        newTouched[confirmField] = true;
      }
      
      return newTouched;
    });
  };

  const handleSignatureSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Mark that user attempted to submit
    setSubmitAttempted(true);
    
    // Touch all fields so errors show
    const allTouched: Record<string, boolean> = {};
    config.fields.forEach((f) => {
      allTouched[f.name] = true;
    });
    setTouched(allTouched);

    if (!canSubmit) {
      // Scroll to first error
      const firstErrorField = Object.keys(zodErrors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }
      return;
    }
    
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

      if (clearOnSuccess) {
        setValues({});
        setTouched({});
        setSubmitAttempted(false);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBackClick() {
    if (onBack) {
      await onBack();
    }
  }

  const cols = config.columns ?? 2;

  const renderedFields: React.ReactNode[] = config.fields.map((f): React.ReactNode => {
    if (f.showIf && !f.showIf(values)) return null;

    const fieldSpan = isTextarea(f) || f.span === 2 ? 'md:col-span-2' : '';

    return (
      <div key={f.name} className={fieldSpan}>
        {!isCheckbox(f) && (
          <label className="block text-sm font-medium text-gray-900 mb-1.5" htmlFor={f.name}>
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
            type={f.kind === 'date' ? 'text' : f.kind === 'tel' ? 'tel' : f.kind}
            inputMode={f.kind === 'date' ? 'numeric' : f.kind === 'tel' ? 'tel' : undefined}
            placeholder={f.placeholder || (f.kind === 'date' ? 'MM-DD-YYYY' : undefined)}
            value={(values[f.name] as string) ?? ''}
            onChange={(e) => {
              let newValue = e.target.value;
              
              // Auto-format phone numbers
              if (f.kind === 'tel') {
                newValue = formatPhoneNumber(newValue);
              }
              
              setValues((v) => ({ ...v, [f.name]: newValue }));
            }}
            onBlur={() => handleBlur(f.name)}
          />
        )}

        {isRadio(f) && (
          <div className="mt-1 space-y-2">
            {f.options.map((opt) => {
              const selected = (values[f.name] as string) === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm cursor-pointer transition-all ${
                    selected 
                      ? 'border-black bg-black text-white shadow-md' 
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
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
                  {selected && <CheckCircle2 className="h-5 w-5 flex-shrink-0" />}
                </label>
              );
            })}
          </div>
        )}

        {isCheckbox(f) && (
          <label className="mt-1 flex items-start gap-3 text-sm text-gray-900 cursor-pointer">
            <input
              id={f.name}
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-black cursor-pointer rounded"
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
            onSaveSuccess={handleSignatureSave}
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
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                <path d="M7 9l5-5 5 5" />
                <path d="M12 4v12" />
              </svg>
              {values[f.name] instanceof File ? 'Change file' : 'Upload file'}
            </label>
            {values[f.name] instanceof File && (
              <div className="mt-2 text-xs text-gray-600">
                Selected: <span className="font-medium">{(values[f.name] as File).name}</span>
              </div>
            )}
            {!values[f.name] && f.accept && (
              <div className="mt-2 text-xs text-gray-500">
                Accepted: {f.accept}
              </div>
            )}
          </div>
        )}

        {f.helpText && <p className="mt-1.5 text-xs text-gray-600">{f.helpText}</p>}
        {errors[f.name] && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors[f.name]}</p>}

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
          <div className={`grid grid-cols-1 gap-5 ${cols === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
            {renderedFields}
          </div>

          {submitError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              {submitError}
            </div>
          )}
        </Card>

        <div className="h-24" />
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur shadow-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          {/* Back Button - Matches Continue Style */}
          {onBack && (
            <button
              type="button"
              onClick={handleBackClick}
              className="flex items-center gap-2 rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Continue Button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all ${
              canSubmit 
                ? 'bg-black hover:bg-gray-800 hover:shadow-md' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {config.ctaLabel || 'Continue'}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <Toast 
            message="Signature saved successfully" 
            onClose={() => setShowToast(false)} 
          />
        )}
      </AnimatePresence>
    </form>
  );
}
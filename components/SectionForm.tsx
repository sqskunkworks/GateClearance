'use client';

import React, { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import SignaturePad, { SignaturePadHandle } from '@/components/SignaturePad';
import { RulesCollapsible } from '@/components/RulesCollapsible';
import { z } from 'zod';
import { getErrorMessages } from '@/lib/validation/applicationSchema';

/* ======= Helper Functions ======= */
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('1') && digits.length === 11) return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  if (digits.length > 6) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length > 3) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length > 0) return `(${digits}`;
  return value;
};

const formatDate = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 8) return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
  if (digits.length >= 4) return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
  if (digits.length >= 2) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return digits;
};

const formatGovernmentId = (value: string, idType: string): string => {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (idType === 'driver_license') {
    if (cleaned.length > 1 && /^[A-Z]{1,2}/.test(cleaned)) {
      const letters = cleaned.match(/^[A-Z]{1,2}/)?.[0] || '';
      const numbers = cleaned.slice(letters.length);
      return numbers ? `${letters}-${numbers}` : letters;
    }
  }
  return cleaned;
};

/* ============================
   Types
   ============================ */
export type FormValue = string | boolean | File | null | undefined;
export type FormValues = Record<string, FormValue>;
export type FieldBase = {
  name: string; label: string; required?: boolean; helpText?: string;
  placeholder?: string; span?: 1 | 2; showIf?: (values: FormValues) => boolean;
};
export type RadioOption = { label: string; value: string };
type TextKinds = 'text' | 'email' | 'tel' | 'date';
export type Field =
  | (FieldBase & { kind: TextKinds })
  | (FieldBase & { kind: 'textarea'; rows?: number })
  | (FieldBase & { kind: 'radio'; options: RadioOption[]; correctValue?: string; wrongCallout?: { title?: string; points: string[] } })
  | (FieldBase & { kind: 'checkbox' })
  | (FieldBase & { kind: 'file'; accept?: string })
  | (FieldBase & { kind: 'signature'; height?: number });

export type SectionConfig = {
  title: string; subtitle?: string; icon?: React.ReactNode;
  fields: Field[]; zodSchema: z.ZodType<FormValues>;
  ctaLabel?: string; columns?: 1 | 2;
};

export type SectionFormProps = {
  config: SectionConfig; initialValues?: FormValues; clearOnSuccess?: boolean;
  onSubmit?: (values: FormValues) => Promise<void> | void;
  onBack?: () => Promise<void> | void; currentStep?: number;
};

/* ======= UI Components ======= */
const SectionHeader = ({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) => (
  <div className="border-b bg-white/90 backdrop-blur" style={{ borderColor: '#E6E1D8' }}>
    <div className="mx-auto max-w-3xl px-4 py-5">
      <div className="flex items-center gap-3">
        {icon && <span style={{ color: '#1C3D5A' }}>{icon}</span>}
        <h1 className="text-xl font-bold" style={{ color: '#1F2933' }}>{title}</h1>
      </div>
      {subtitle && <p className="mt-1 text-sm" style={{ color: '#1C3D5A' }}>{subtitle}</p>}
    </div>
  </div>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: '1px solid #E6E1D8' }}>{children}</div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2 ${props.className || ''}`}
    style={{ border: '1px solid #E6E1D8', ...props.style }}
  />
);

const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={`min-h-[96px] w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2 ${props.className || ''}`}
    style={{ border: '1px solid #E6E1D8' }}
  />
);

const ErrorCallout = ({ title, points }: { title?: string; points: string[] }) => (
  <AnimatePresence mode="popLayout">
    <motion.div
      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
      className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
    >
      <div className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4" /> {title || 'Please review the following:'}
      </div>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {points.map((p) => <li key={p}>{p}</li>)}
      </ul>
    </motion.div>
  </AnimatePresence>
);

const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
  >
    <div className="text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3" style={{ backgroundColor: '#355F7A' }}>
      <CheckCircle2 className="h-5 w-5" />
      <span className="font-medium">{message}</span>
    </div>
  </motion.div>
);

/* ======= Type guards ======= */
const isTextarea = (f: Field): f is Extract<Field, { kind: 'textarea' }> => f.kind === 'textarea';
const isTextInput = (f: Field): f is Extract<Field, { kind: TextKinds }> => ['text','email','tel','date'].includes(f.kind);
const isRadio = (f: Field): f is Extract<Field, { kind: 'radio' }> => f.kind === 'radio';
const isFile = (f: Field): f is Extract<Field, { kind: 'file' }> => f.kind === 'file';
const isSignature = (f: Field): f is Extract<Field, { kind: 'signature' }> => f.kind === 'signature';
const isCheckbox = (f: Field): f is Extract<Field, { kind: 'checkbox' }> => f.kind === 'checkbox';

/* ======= Signature field wrapper ======= */
function SignatureField({ height, onChange, onSaveSuccess }: { height?: number; onChange: (dataUrl: string) => void; onSaveSuccess?: () => void }) {
  const padRef = useRef<SignaturePadHandle>(null);
  const hasShownToast = useRef(false);
  const handleEnd = () => {
    const pad = padRef.current;
    if (!pad) return;
    if (pad.isEmpty()) { onChange(''); return; }
    const dataUrl = pad.toDataURL();
    onChange(dataUrl);
    if (!hasShownToast.current && onSaveSuccess) { onSaveSuccess(); hasShownToast.current = true; }
  };
  return (
    <div>
      <SignaturePad ref={padRef} height={height ?? 160} onEnd={handleEnd} />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="rounded-xl px-4 py-2 text-sm font-medium transition-colors"
          style={{ border: '1px solid #E6E1D8', color: '#1C3D5A' }}
          onClick={() => { padRef.current?.clear(); onChange(''); hasShownToast.current = false; }}
        >
          Clear Signature
        </button>
        <span className="text-xs self-center ml-2" style={{ color: '#1C3D5A' }}>✓ Signature saves automatically</span>
      </div>
    </div>
  );
}

/* ======= Main Component ======= */
export function SectionForm({ config, initialValues, clearOnSuccess, onSubmit, onBack, currentStep }: SectionFormProps) {
  const [values, setValues] = useState<FormValues>(initialValues || {});
  useEffect(() => { if (initialValues) setValues(initialValues); }, [initialValues]);
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
      if (!submitAttempted) { if (touched[key]) displayErrors[key] = zodErrors[key]; }
      else displayErrors[key] = zodErrors[key];
    });
    return displayErrors;
  }, [zodErrors, touched, submitAttempted]);

  const quizWrongByField = useMemo(() => {
    const wrong: Record<string, true> = {};
    for (const f of config.fields) {
      if (isRadio(f) && f.correctValue && values[f.name] && values[f.name] !== f.correctValue) wrong[f.name] = true;
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
      if (fieldName.endsWith('Confirm')) newTouched[fieldName.replace('Confirm', '')] = true;
      const confirmField = `${fieldName}Confirm`;
      if (config.fields.some(f => f.name === confirmField) && values[confirmField]) newTouched[confirmField] = true;
      return newTouched;
    });
  };

  const handleSignatureSave = () => { setShowToast(true); setTimeout(() => setShowToast(false), 3000); };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);
    const allTouched: Record<string, boolean> = {};
    config.fields.forEach((f) => { allTouched[f.name] = true; });
    setTouched(allTouched);
    if (!canSubmit) {
      const firstErrorField = Object.keys(zodErrors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) { element.scrollIntoView({ behavior: 'smooth', block: 'center' }); element.focus(); }
      }
      return;
    }
    setSubmitError(null);
    try {
      setSubmitting(true);
      const result = config.zodSchema.safeParse(values);
      if (!result.success) { setSubmitError(`Validation error: ${result.error.issues[0].message}`); return; }
      if (onSubmit) await onSubmit(result.data);
      if (clearOnSuccess) { setValues({}); setTouched({}); setSubmitAttempted(false); }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  const cols = config.columns ?? 2;

  const renderedFields: React.ReactNode[] = config.fields.map((f): React.ReactNode => {
    if (f.showIf && !f.showIf(values)) return null;
    const fieldSpan = isTextarea(f) || f.span === 2 ? 'md:col-span-2' : '';

    return (
      <div key={f.name} className={fieldSpan}>
        {!isCheckbox(f) && (
          <label className="block text-sm font-medium mb-1.5" htmlFor={f.name} style={{ color: '#1F2933' }}>
            {f.label}{f.required && <span className="text-red-600"> *</span>}
          </label>
        )}

        {isTextarea(f) && (
          <TextArea id={f.name} placeholder={f.placeholder} rows={f.rows ?? 4}
            value={(values[f.name] as string) ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
            onBlur={() => handleBlur(f.name)}
          />
        )}

        {isTextInput(f) && (
          <Input id={f.name}
            type={f.kind === 'date' ? 'text' : f.kind === 'tel' ? 'tel' : f.kind}
            inputMode={f.kind === 'date' ? 'numeric' : f.kind === 'tel' ? 'tel' : undefined}
            placeholder={f.placeholder || (f.kind === 'date' ? 'MM-DD-YYYY' : undefined)}
            value={(values[f.name] as string) ?? ''}
            onChange={(e) => {
              let newValue = e.target.value;
              if (f.kind === 'tel') newValue = formatPhoneNumber(newValue);
              if (f.kind === 'date') newValue = formatDate(newValue);
              if ((f.name === 'governmentIdNumber' || f.name === 'governmentIdNumberConfirm') && values.governmentIdType)
                newValue = formatGovernmentId(newValue, values.governmentIdType as string);
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
                <label key={opt.value}
                  className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm cursor-pointer transition-all"
                  style={selected
                    ? { backgroundColor: '#1C3D5A', color: '#ffffff', border: '1px solid #1C3D5A' }
                    : { border: '1px solid #E6E1D8', color: '#1F2933', backgroundColor: '#ffffff' }}
                >
                  <div className="flex items-center gap-3">
                    <input type="radio" name={f.name} value={opt.value}
                      className="h-4 w-4 cursor-pointer" checked={selected}
                      onChange={() => {
                        if (f.name === 'ssnMethod') {
                          const newValues: FormValues = { ...values, [f.name]: opt.value };
                          delete newValues.ssnVerifiedByPhone; delete newValues.ssnFull;
                          delete newValues.ssnFullConfirm; delete newValues.ssnFirstFive;
                          delete newValues.ssnFirstFiveConfirm;
                          setValues(newValues);
                        } else {
                          setValues((v) => ({ ...v, [f.name]: opt.value }));
                        }
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
          <label className="mt-1 flex items-start gap-3 text-sm cursor-pointer" style={{ color: '#1F2933' }}>
            <input id={f.name} type="checkbox"
              className="mt-0.5 h-4 w-4 cursor-pointer rounded"
              checked={Boolean(values[f.name])}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.checked }))}
              onBlur={() => handleBlur(f.name)}
            />
            <span>{f.label}{f.required && <span className="text-red-600"> *</span>}</span>
          </label>
        )}

        {isSignature(f) && (
          <SignatureField height={f.height}
            onChange={(dataUrl) => { setValues((v) => ({ ...v, [f.name]: dataUrl })); handleBlur(f.name); }}
            onSaveSuccess={handleSignatureSave}
          />
        )}

        {isFile(f) && (
          <div className="mt-1">
            <input id={f.name} type="file" accept={f.accept} className="sr-only"
              onChange={(e) => { const file = e.target.files?.[0] ?? null; setValues((v) => ({ ...v, [f.name]: file ?? undefined })); handleBlur(f.name); }}
            />
            <label htmlFor={f.name}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors"
              style={{ border: '1px solid #E6E1D8', color: '#1C3D5A', backgroundColor: '#ffffff' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                <path d="M7 9l5-5 5 5" /><path d="M12 4v12" />
              </svg>
              {values[f.name] instanceof File ? 'Change file' : 'Upload file'}
            </label>
            {values[f.name] instanceof File && (
              <div className="mt-2 text-xs" style={{ color: '#1C3D5A' }}>
                Selected: <span className="font-medium">{(values[f.name] as File).name}</span>
              </div>
            )}
            {!values[f.name] && f.accept && <div className="mt-2 text-xs" style={{ color: '#1C3D5A' }}>Accepted: {f.accept}</div>}
          </div>
        )}

        {f.helpText && <p className="mt-1.5 text-xs" style={{ color: '#1C3D5A' }}>{f.helpText}</p>}
        {errors[f.name] && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors[f.name]}</p>}
        {isRadio(f) && f.correctValue && values[f.name] && values[f.name] !== f.correctValue && (
          <ErrorCallout title={f.wrongCallout?.title} points={f.wrongCallout?.points || []} />
        )}
      </div>
    );
  });

  return (
    <form onSubmit={handleSubmit} className="min-h-dvh" style={{ backgroundColor: '#f9f8f6' }}>
      <SectionHeader title={config.title} subtitle={config.subtitle} icon={config.icon} />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        {currentStep === 4 && <RulesCollapsible />}
        <Card>
          <div className={`grid grid-cols-1 gap-5 ${cols === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
            {renderedFields}
          </div>
          {submitError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{submitError}</div>
          )}
        </Card>
        <div className="h-24" />
      </div>

      {/* Fixed bottom nav */}
      <div className="fixed inset-x-0 bottom-0 bg-white/95 backdrop-blur shadow-lg" style={{ borderTop: '1px solid #E6E1D8' }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          {onBack && (
            <button type="button" onClick={onBack}
              className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all shadow-sm"
              style={{ backgroundColor: '#E6E1D8', color: '#1C3D5A', border: '1px solid #CBB892' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#d9d3c8'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#E6E1D8'; }}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}
          <div className="flex-1" />
          <button type="submit" disabled={!canSubmit}
            className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all"
            style={{ backgroundColor: canSubmit ? '#355F7A' : '#9ca3af', cursor: canSubmit ? 'pointer' : 'not-allowed' }}
            onMouseEnter={e => { if (canSubmit) e.currentTarget.style.backgroundColor = '#2A4F67'; }}
            onMouseLeave={e => { if (canSubmit) e.currentTarget.style.backgroundColor = '#355F7A'; }}
          >
            {submitting ? 'Saving...' : (config.ctaLabel || 'Continue')}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showToast && <Toast message="Signature saved successfully" onClose={() => setShowToast(false)} />}
      </AnimatePresence>
    </form>
  );
}
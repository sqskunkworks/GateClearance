import { z } from 'zod';

// ============================================
// SHARED HELPERS
// ============================================
const phoneRegex = /^\+?[1-9]\d{9,14}$/;
const dateRegex = /^\d{2}-\d{2}-\d{4}$/;

const isValidDate = (dateStr: string) => {
  if (!dateRegex.test(dateStr)) return false;
  const [mm, dd, yyyy] = dateStr.split('-').map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  return (
    date.getFullYear() === yyyy &&
    date.getMonth() === mm - 1 &&
    date.getDate() === dd
  );
};

const isPastOrPresentDate = (dateStr: string) => {
  if (!isValidDate(dateStr)) return false;
  const [mm, dd, yyyy] = dateStr.split('-').map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  return date <= new Date();
};

const isFutureDate = (dateStr: string) => {
  if (!isValidDate(dateStr)) return false;
  const [mm, dd, yyyy] = dateStr.split('-').map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

const requiredString = (fieldLabel: string) =>
  z.string({ error: `Please enter your ${fieldLabel}` }).min(1, `Please enter your ${fieldLabel}`);

const requiredPhone = z
  .string({ error: 'Please enter a phone number' })
  .min(1, 'Please enter a phone number')
  .refine(
    (val) => phoneRegex.test(val.replace(/[\s()-]/g, '')),
    'Please enter a valid phone number (e.g. 415-555-1234)'
  );

// ============================================
// STEP 1: COVER SHEET
// ============================================
export const annualCoverSchema = z.object({
  ppName: requiredString('full name').max(200, 'Name is too long'),
  contactNumber: requiredPhone,
  email: z
    .string({ error: 'Please enter your email' })
    .min(1, 'Please enter your email')
    .email('Please enter a valid email address'),
  birthday: requiredString('birthday')
    .refine(isValidDate, 'Please enter a valid date in MM-DD-YYYY format')
    .refine(isPastOrPresentDate, 'Birthday cannot be in the future'),
  programName: requiredString('program name').max(200, 'Program name is too long'),
  isRenewal: z.enum(['new', 'renewal'], {
    message: 'Please indicate if this is a new or renewal application',
  }),
});

// ============================================
// STEP 2: PERSONAL DETAILS (CDCR 966 Section I)
// ============================================
export const annualPersonalSchema = z.object({
  firstName: requiredString('first name').max(100, 'First name is too long'),
  middleInitial: z.string().max(1, 'Middle initial must be a single letter').optional(),
  lastName: requiredString('last name').max(100, 'Last name is too long'),
  dateOfBirth: requiredString('date of birth')
    .refine(isValidDate, 'Please enter a valid date in MM-DD-YYYY format'),
  addressStreet: requiredString('street address'),
  addressApt: z.string().optional(),
  addressCity: requiredString('city'),
  addressState: z
    .string({ error: 'Please enter your state' })
    .min(2, 'Please enter your state (e.g. CA)')
    .max(2, 'State must be 2 letters (e.g. CA)'),
  addressZip: z
    .string({ error: 'Please enter your ZIP code' })
    .min(5, 'Please enter a valid ZIP code')
    .max(10, 'ZIP code is too long'),
  phoneNumber: requiredPhone,
  cellNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || phoneRegex.test(val.replace(/[\s()-]/g, '')),
      'Please enter a valid cell number'
    ),
  gender: z.enum(['male', 'female'], { message: 'Please select your gender' }),
  height: requiredString('height'),
  weight: requiredString('weight'),
  eyeColor: requiredString('eye color'),
  hairColor: requiredString('hair color'),
  occupation: z.string().optional(),
  specialSkills: z.string().optional(),
  organizationName: z.string().optional(),
  organizationAddress: z.string().optional(),
});

// ============================================
// STEP 3: BACKGROUND QUESTIONS (CDCR 966 Q1–Q7)
// ============================================
export const annualBackgroundSchema = z
  .object({
    q1LiveScan: z.enum(['yes', 'no'], {
      message: 'Please answer: Have you submitted Live Scan fingerprints to CDCR in the past?',
    }),
    q1LiveScanDetails: z.string().optional(),

    q2OtherCdcr: z.enum(['yes', 'no'], {
      message: 'Please answer: Do you provide volunteer service at any other CDCR institution?',
    }),
    q2OtherCdcrDetails: z.string().optional(),

    q3VisitInmates: z.enum(['yes', 'no'], {
      message: 'Please answer: Do you visit or correspond with any inmates at another CDCR institution?',
    }),
    q3VisitInmatesDetails: z.string().optional(),

    q4RelatedToInmate: z.enum(['yes', 'no'], {
      message: 'Please answer: Are you related to any inmate at a CDCR institution?',
    }),
    q4RelatedDetails: z.string().optional(),

    q5ArrestedConvicted: z.enum(['yes', 'no'], {
      message: 'Please answer: Have you ever been arrested and/or convicted of any offense?',
    }),
    criminalHistory: z.string().optional(),

    q6OnParole: z.enum(['yes', 'no'], {
      message: 'Please answer: Are you currently on parole or probation?',
    }),
    q6ParoleDetails: z.string().optional(),

    q7Discharged: z.enum(['yes', 'no'], {
      message: 'Please answer: Are you discharged from prison or parole?',
    }),
    q7DischargeDetails: z.string().optional(),

    // ✅ FIX 1: wardenLetter File check removed from schema.
    // File objects cannot be restored when a draft is reloaded — requiring
    // instanceof File here would permanently block resumed drafts where
    // q7Discharged === 'yes'. The server-side submit route handles the actual
    // file presence check instead.
    wardenLetter: z.instanceof(File).optional(),
  })
  .refine(
    (d) => d.q1LiveScan !== 'yes' || (d.q1LiveScanDetails?.trim() ?? '').length > 0,
    { message: 'Please provide the date and location of your Live Scan', path: ['q1LiveScanDetails'] }
  )
  .refine(
    (d) => d.q2OtherCdcr !== 'yes' || (d.q2OtherCdcrDetails?.trim() ?? '').length > 0,
    { message: 'Please provide the date and location of your other CDCR volunteer service', path: ['q2OtherCdcrDetails'] }
  )
  .refine(
    (d) => d.q3VisitInmates !== 'yes' || (d.q3VisitInmatesDetails?.trim() ?? '').length > 0,
    { message: 'Please provide inmate name(s), CDCR number(s), and institution(s)', path: ['q3VisitInmatesDetails'] }
  )
  .refine(
    (d) => d.q4RelatedToInmate !== 'yes' || (d.q4RelatedDetails?.trim() ?? '').length > 0,
    { message: 'Please provide inmate name(s) and CDCR number(s)', path: ['q4RelatedDetails'] }
  )
  .refine(
    (d) => d.q5ArrestedConvicted !== 'yes' || (d.criminalHistory?.trim() ?? '').length > 0,
    { message: 'Please provide details of your arrest or conviction history', path: ['criminalHistory'] }
  )
  .refine(
    (d) => d.q6OnParole !== 'yes' || (d.q6ParoleDetails?.trim() ?? '').length > 0,
    { message: "Please provide your parole/probation officer's name, phone number, and county", path: ['q6ParoleDetails'] }
  )
  .refine(
    (d) => d.q7Discharged !== 'yes' || (d.q7DischargeDetails?.trim() ?? '').length > 0,
    { message: 'Please provide your discharge date and the name of the institution', path: ['q7DischargeDetails'] }
  );
  // NOTE: warden letter file presence is enforced server-side in submit route only

// ============================================
// STEP 4: EMERGENCY CONTACTS (CDCR 894)
// ============================================
export const annualEmergencySchema = z.object({
  ssnLast4: z
    .string({ error: 'Please enter the last 4 digits of your SSN' })
    .min(4, 'Please enter the last 4 digits of your SSN')
    .max(4, 'Must be exactly 4 digits')
    .refine((val) => /^\d{4}$/.test(val), 'SSN last 4 must be digits only'),
  ec1Name: requiredString('emergency contact name'),
  ec1Relationship: requiredString('relationship'),
  ec1Address: requiredString('home address'),
  ec1HomePhone: requiredPhone,
  ec1WorkPhone: z.string().optional(),
  ec1CellPhone: z.string().optional(),
  ec2Name: z.string().optional(),
  ec2Relationship: z.string().optional(),
  ec2Address: z.string().optional(),
  ec2HomePhone: z.string().optional(),
  ec2WorkPhone: z.string().optional(),
  ec2CellPhone: z.string().optional(),
  physicianName: z.string().optional(),
  physicianPhone: z.string().optional(),
  medicalPlanName: z.string().optional(),
  medicalPlanCardNumber: z.string().optional(),
  medicalFacility: z.string().optional(),
  specialConditions: z.string().optional(),
  specialInstructions: z.string().optional(),
})
.refine(
  (d) => {
    const anyEc2Filled = [d.ec2Relationship, d.ec2Address, d.ec2HomePhone, d.ec2WorkPhone, d.ec2CellPhone]
      .some((v) => v && v.trim().length > 0);
    if (anyEc2Filled) return d.ec2Name && d.ec2Name.trim().length > 0;
    return true;
  },
  { message: 'Please enter the name of your second emergency contact', path: ['ec2Name'] }
);

// ============================================
// STEP 5: ACKNOWLEDGMENT + SIGNATURE
// ============================================
export const annualAcknowledgmentSchema = z.object({
  certificationAgreement: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === 'true')
    .pipe(z.literal(true, { error: 'You must certify and agree to the terms' })),

  reasonableAccommodationAck: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === 'true')
    .pipe(z.literal(true, { error: 'You must acknowledge the reasonable accommodation notice' })),

  digitalSignature: z
    .string({ error: 'Please provide your digital signature' })
    .min(1, 'Please provide your digital signature'),

  consentToDataUse: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === 'true')
    .pipe(z.literal(true, { error: 'You must consent to data use' })),
});

// ============================================
// VALIDATION HELPERS
// ============================================
export function validateAnnualStep(step: number, data: Record<string, unknown>) {
  switch (step) {
    case 1: return annualCoverSchema.safeParse(data);
    case 2: return annualPersonalSchema.safeParse(data);
    case 3: return annualBackgroundSchema.safeParse(data);
    case 4: return annualEmergencySchema.safeParse(data);
    case 5: return annualAcknowledgmentSchema.safeParse(data);
    default:
      return { success: false, error: { issues: [{ message: 'Invalid step' }] } };
  }
}

export function validateFullAnnualApplication(data: unknown): {
  success: boolean;
  errors: { field: string; message: string }[];
} {
  const allErrors: { field: string; message: string }[] = [];
  const steps = [
    annualCoverSchema,
    annualPersonalSchema,
    annualBackgroundSchema,
    annualEmergencySchema,
    annualAcknowledgmentSchema,
  ];
  for (const schema of steps) {
    const result = schema.safeParse(data);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        allErrors.push({ field: issue.path.join('.') || 'general', message: issue.message });
      });
    }
  }
  return { success: allErrors.length === 0, errors: allErrors };
}
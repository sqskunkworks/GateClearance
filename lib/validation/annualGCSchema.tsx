import { z } from 'zod';

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

// ============================================
// STEP 1: COVER SHEET
// ============================================
export const annualCoverSchema = z.object({
  ppName: z.string().min(1, 'Please enter your full name').max(200, 'Name is too long'),
  contactNumber: z
    .string()
    .min(1, 'Please enter your contact number')
    .refine(
      (val) => phoneRegex.test(val.replace(/[\s()-]/g, '')),
      'Please enter a valid phone number'
    ),
  email: z.string().min(1, 'Please enter your email').email('Please enter a valid email address'),
  birthday: z
    .string()
    .min(1, 'Please enter your birthday')
    .refine(isValidDate, 'Please enter a valid date in MM-DD-YYYY format')
    .refine(isPastOrPresentDate, 'Birthday cannot be in the future'),
  programName: z.string().min(1, 'Please enter your program name').max(200, 'Program name is too long'),
  isRenewal: z.enum(['new', 'renewal'], {
    message: 'Please indicate if this is a new or renewal application',
  }),
});

// ============================================
// STEP 2: PERSONAL DETAILS (CDCR 966 Section I)
// ============================================
export const annualPersonalSchema = z.object({
  firstName: z.string().min(1, 'Please enter your first name').max(100, 'First name is too long'),
  middleInitial: z.string().max(1, 'Middle initial must be a single letter').optional(),
  lastName: z.string().min(1, 'Please enter your last name').max(100, 'Last name is too long'),
  dateOfBirth: z
    .string()
    .min(1, 'Please enter your date of birth')
    .refine(isValidDate, 'Please enter a valid date in MM-DD-YYYY format'),
  addressStreet: z.string().min(1, 'Please enter your street address'),
  addressApt: z.string().optional(),
  addressCity: z.string().min(1, 'Please enter your city'),
  addressState: z.string().min(2, 'Please enter your state').max(2, 'State must be 2 letters (e.g. CA)'),
  addressZip: z.string().min(5, 'Please enter a valid ZIP code').max(10, 'ZIP code is too long'),
  phoneNumber: z
    .string()
    .min(1, 'Please enter your phone number')
    .refine(
      (val) => phoneRegex.test(val.replace(/[\s()-]/g, '')),
      'Please enter a valid phone number'
    ),
  cellNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || phoneRegex.test(val.replace(/[\s()-]/g, '')),
      'Please enter a valid cell number'
    ),
  gender: z.enum(['male', 'female'], { message: 'Please select your gender' }),
  height: z.string().min(1, 'Please enter your height'),
  weight: z.string().min(1, 'Please enter your weight'),
  eyeColor: z.string().min(1, 'Please enter your eye color'),
  hairColor: z.string().min(1, 'Please enter your hair color'),
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
    q1LiveScan: z.enum(['yes', 'no'], { message: 'Please answer question 1' }),
    q1LiveScanDetails: z.string().optional(),
    q2OtherCdcr: z.enum(['yes', 'no'], { message: 'Please answer question 2' }),
    q2OtherCdcrDetails: z.string().optional(),
    q3VisitInmates: z.enum(['yes', 'no'], { message: 'Please answer question 3' }),
    q3VisitInmatesDetails: z.string().optional(),
    q4RelatedToInmate: z.enum(['yes', 'no'], { message: 'Please answer question 4' }),
    q4RelatedDetails: z.string().optional(),
    q5ArrestedConvicted: z.enum(['yes', 'no'], { message: 'Please answer question 5' }),
    criminalHistory: z.string().optional(),
    q6OnParole: z.enum(['yes', 'no'], { message: 'Please answer question 6' }),
    q6ParoleDetails: z.string().optional(),
    q7Discharged: z.enum(['yes', 'no'], { message: 'Please answer question 7' }),
    q7DischargeDetails: z.string().optional(),
    wardenLetter: z.instanceof(File).optional(),
  })
  .refine(
    (data) => data.q1LiveScan !== 'yes' || !!data.q1LiveScanDetails?.trim(),
    { message: 'Please provide the date and location of your Live Scan', path: ['q1LiveScanDetails'] }
  )
  .refine(
    (data) => data.q2OtherCdcr !== 'yes' || !!data.q2OtherCdcrDetails?.trim(),
    { message: 'Please provide the date and location', path: ['q2OtherCdcrDetails'] }
  )
  .refine(
    (data) => data.q3VisitInmates !== 'yes' || !!data.q3VisitInmatesDetails?.trim(),
    { message: 'Please provide inmate names, CDCR numbers, and institutions', path: ['q3VisitInmatesDetails'] }
  )
  .refine(
    (data) => data.q4RelatedToInmate !== 'yes' || !!data.q4RelatedDetails?.trim(),
    { message: 'Please provide inmate name(s) and CDCR number(s)', path: ['q4RelatedDetails'] }
  )
  .refine(
    (data) => data.q6OnParole !== 'yes' || !!data.q6ParoleDetails?.trim(),
    { message: 'Please provide parole/probation officer name, phone, and county', path: ['q6ParoleDetails'] }
  )
  .refine(
    (data) => data.q7Discharged !== 'yes' || !!data.q7DischargeDetails?.trim(),
    { message: 'Please provide discharge date and institution name', path: ['q7DischargeDetails'] }
  )
  .refine(
    (data) => data.q7Discharged !== 'yes' || data.wardenLetter instanceof File,
    { message: 'Please upload a letter addressed to the Warden', path: ['wardenLetter'] }
  );

// ============================================
// STEP 4: EMERGENCY CONTACTS (CDCR 894)
// ============================================
export const annualEmergencySchema = z.object({
  ssnLast4: z
    .string()
    .min(4, 'Please enter the last 4 digits of your SSN')
    .max(4, 'Must be exactly 4 digits')
    .refine((val) => /^\d{4}$/.test(val), 'Must be 4 digits'),
  ec1Name: z.string().min(1, 'Please enter emergency contact name'),
  ec1Relationship: z.string().min(1, 'Please enter relationship'),
  ec1Address: z.string().min(1, 'Please enter their address'),
  ec1HomePhone: z
    .string()
    .min(1, 'Please enter a phone number')
    .refine(
      (val) => phoneRegex.test(val.replace(/[\s()-]/g, '')),
      'Please enter a valid phone number'
    ),
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
});

// ============================================
// STEP 5: ACKNOWLEDGMENT + SIGNATURE
// ============================================
// Zod v4: use z.literal(true) with { error: '...' } not { errorMap: ... }
export const annualAcknowledgmentSchema = z.object({
    certificationAgreement: z
      .union([z.literal(true), z.literal('true')])
      .transform(() => true as const)
      .pipe(z.literal(true)),
  
    reasonableAccommodationAck: z
      .union([z.literal(true), z.literal('true')])
      .transform(() => true as const)
      .pipe(z.literal(true)),
  
    digitalSignature: z.string().min(1, 'Please provide your digital signature'),
  
    consentToDataUse: z
      .union([z.literal(true), z.literal('true')])
      .transform(() => true as const)
      .pipe(z.literal(true)),
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
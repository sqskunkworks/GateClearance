import { z } from 'zod';

// Helper validators
const phoneRegex = /^\+?[1-9]\d{9,14}$/;
const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
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

const isFutureDate = (dateStr: string) => {
  if (!isValidDate(dateStr)) return false;
  const [mm, dd, yyyy] = dateStr.split('-').map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

const isExpiringWithin30Days = (dateStr: string) => {
  if (!isValidDate(dateStr)) return false;
  const [mm, dd, yyyy] = dateStr.split('-').map(Number);
  const expirationDate = new Date(yyyy, mm - 1, dd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  return expirationDate < thirtyDaysFromNow;
};

// ============================================
// STEP 1: PERSONAL INFORMATION
// ============================================
export const personalInfoSchema = z.object({
  firstName: z
    .string()
    .min(1, 'Please enter your first name')
    .max(100, 'First name is too long (maximum 100 characters)'),
  
  lastName: z
    .string()
    .min(1, 'Please enter your last name')
    .max(100, 'Last name is too long (maximum 100 characters)'),
  
  otherNames: z
    .string()
    .max(200, 'Other names are too long (maximum 200 characters)')
    .optional(),
  
  dateOfBirth: z
    .string()
    .min(1, 'Please enter your date of birth')
    .refine(isValidDate, 'Please enter a valid date in MM-DD-YYYY format (e.g., 12-15-1990)')
    .refine((date) => {
      if (!isValidDate(date)) return true;
      const [mm, dd, yyyy] = date.split('-').map(Number);
      const birthDate = new Date(yyyy, mm - 1, dd);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      return age >= 18 && age <= 120;
    }, 'You must be at least 18 years old to apply'),
  
  gender: z.enum(['male', 'female', 'nonbinary', 'prefer_not_to_say', 'other']),
});

// ============================================
// STEP 2: CONTACT & ORGANIZATION
// ============================================
export const contactInfoSchema = z.object({
  email: z
    .string()
    .min(1, 'Please enter your email address')
    .email('Please enter a valid email address (e.g., name@example.com)'),
  
  phoneNumber: z
    .string()
    .min(1, 'Please enter your phone number')
    .refine(
      (val) => {
        const cleaned = val.replace(/[\s()-]/g, '');
        return phoneRegex.test(cleaned);
      },
      'Please enter a valid phone number (e.g., 415-555-1234 or +1 415 555 1234)'
    ),
  
  visitDate: z
    .string()
    .optional()
    .refine(
      (val) => !val || isValidDate(val),
      'Please enter a valid date in MM-DD-YYYY format'
    ),
  
  companyOrOrganization: z
    .string()
    .min(1, 'Please enter your company or organization name')
    .max(200, 'Company/Organization name is too long (maximum 200 characters)'),
  
  purposeOfVisit: z
    .string()
    .min(10, 'Please provide more detail about your visit purpose (at least 10 characters)')
    .max(1000, 'Purpose of visit is too long (maximum 1000 characters)'),
});

// ============================================
// STEP 3: EXPERIENCE & EXPECTATIONS
// ============================================
export const experienceSchema = z.object({
  engagedDirectly: z.enum([
    'no_first_time',
    'personal_connection',
    'volunteer',
    'professional',
    'other',
  ]),
  
  perceptions: z
    .string()
    .min(20, 'Please share your thoughts in more detail (at least 20 characters)')
    .max(2000, 'Response is too long (maximum 2000 characters)'),
  
  expectations: z
    .string()
    .min(20, 'Please share your expectations in more detail (at least 20 characters)')
    .max(2000, 'Response is too long (maximum 2000 characters)'),
  
  justiceReformBefore: z.enum([
    'active',
    'limited',
    'never',
    'thought_about',
    'other',
  ]),
  
  interestsMost: z
    .string()
    .min(20, 'Please share what interests you in more detail (at least 20 characters)')
    .max(2000, 'Response is too long (maximum 2000 characters)'),
  
  reformFuture: z.enum([
    'already_involved_continue',
    'considering',
    'maybe',
    'one_time',
    'other',
  ]),
  
  additionalNotes: z
    .string()
    .max(2000, 'Additional notes are too long (maximum 2000 characters)')
    .optional(),
});

// ============================================
// STEP 4: RULES & ACKNOWLEDGMENT (SIMPLIFIED)
// ============================================
export const rulesSchema = z.object({
  acknowledgmentAgreement: z.literal(true),
});

// ============================================
// STEP 5: SECURITY CLEARANCE
// ============================================
export const securitySchema = z
  .object({
    governmentIdType: z.enum(['driver_license', 'passport']),
    
    governmentIdNumber: z
      .string()
      .min(1, 'Please enter your government ID number')
      .max(50, 'ID number is too long (maximum 50 characters)'),
    
    governmentIdNumberConfirm: z
      .string()
      .min(1, 'Please confirm your ID number'),
    
    idState: z
      .string()
      .max(2, 'State code must be 2 letters (e.g., CA, NY, TX)')
      .optional(),
    
    idExpiration: z
      .string()
      .min(1, 'Please enter your ID expiration date')
      .refine(
        isValidDate,
        'Please enter a valid date in MM-DD-YYYY format (e.g., 12-15-2026)'
      )
      .refine(
        isFutureDate,
        'Your ID has expired. Please renew it before submitting this application'
      )
      .refine(
        (val) => !isExpiringWithin30Days(val),
        'Your ID must be valid for at least 30 days. Please renew your ID before applying.'
      ),
      
    passportScan: z.instanceof(File).optional(),
    
    ssnMethod: z.enum(['direct', 'call', 'split']),
    
    ssnFull: z.string().optional(),
    ssnFullConfirm: z.string().optional(),
    
    ssnFirstFive: z.string().optional(),
    ssnFirstFiveConfirm: z.string().optional(),
    
    ssnVerifiedByPhone: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      if (typeof val === 'boolean') return val;
      return undefined;
    }),
    
    formerInmate: z.enum(['yes', 'no']),
    
    wardenLetter: z.instanceof(File).optional(),
    
    onParole: z.enum(['yes', 'no']),
    
    confirmAccuracy: z.literal(true),
    
    digitalSignature: z
      .string()
      .min(1, 'Please provide your digital signature'),
    
    consentToDataUse: z.literal(true),
  })
  .refine(
    (data) => {
      if (data.governmentIdType === 'driver_license') {
        const cleaned = data.governmentIdNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        return /^([A-Z]{1,2}\d{6,15}|\d{8,15})$/i.test(cleaned);
      }
      return true;
    },
    {
      message: "Driver's License must be in valid format (e.g., D1234567, 12345678) - only letters, numbers, spaces and dashes allowed",
      path: ['governmentIdNumber'],
    }
  )
  .refine(
    (data) => {
      if (data.governmentIdType === 'passport') {
        const cleaned = data.governmentIdNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        return /^[A-Z0-9]{6,9}$/i.test(cleaned);
      }
      return true;
    },
    {
      message: 'Passport number must be 6-9 characters (only letters and numbers allowed, e.g., 123456789 or N12345678)',
      path: ['governmentIdNumber'],
    }
  )
  .refine(
    (data) => {
      if (data.governmentIdType === 'driver_license') {
        return data.idState && data.idState.length === 2;
      }
      return true;
    },
    {
      message: "Please enter the state where your driver's license was issued (e.g., CA, NY, TX)",
      path: ['idState'],
    }
  )
  .refine(
    (data) => {
      if (data.governmentIdType === 'passport' && data.idState) {
        return false;
      }
      return true;
    },
    {
      message: 'State is not required for passports',
      path: ['idState'],
    }
  )
  .refine(
    (data) => {
      const normalized1 = data.governmentIdNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      const normalized2 = data.governmentIdNumberConfirm.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      return normalized1 === normalized2;
    },
    {
      message: 'ID numbers do not match. Please check and try again',
      path: ['governmentIdNumberConfirm'],
    }
  )
  .refine(
    (data) => {
      if (data.ssnMethod === 'direct') {
        return data.ssnFull && ssnRegex.test(data.ssnFull);
      }
      return true;
    },
    {
      message: 'Please enter your full SSN in the format 123-45-6789',
      path: ['ssnFull'],
    }
  )
  .refine(
    (data) => {
      if (data.ssnMethod === 'direct' && data.ssnFull && data.ssnFullConfirm) {
        const clean1 = data.ssnFull.replace(/\D/g, '');
        const clean2 = data.ssnFullConfirm.replace(/\D/g, '');
        return clean1 === clean2;
      }
      return true;
    },
    {
      message: 'SSN numbers do not match. Please check and try again',
      path: ['ssnFullConfirm'],
    }
  )
  .refine(
    (data) => {
      if (data.ssnMethod === 'split') {
        return data.ssnFirstFive && /^\d{5}$/.test(data.ssnFirstFive.replace(/\D/g, ''));
      }
      return true;
    },
    {
      message: 'Please enter the first 5 digits of your SSN (numbers only)',
      path: ['ssnFirstFive'],
    }
  )
  .refine(
    (data) => {
      if (data.ssnMethod === 'split' && data.ssnFirstFive && data.ssnFirstFiveConfirm) {
        const clean1 = data.ssnFirstFive.replace(/\D/g, '');
        const clean2 = data.ssnFirstFiveConfirm.replace(/\D/g, '');
        return clean1 === clean2;
      }
      return true;
    },
    {
      message: 'SSN digits do not match. Please check and try again',
      path: ['ssnFirstFiveConfirm'],
    }
  )
  .refine(
    (data) => {
      if (data.ssnMethod === 'call') {
        return data.ssnVerifiedByPhone === true;
      }
      return true;
    },
    {
      message: 'Please confirm you have provided your SSN via phone call',
      path: ['ssnVerifiedByPhone'],
    }
  )
  .refine(
    (data) => {
      if (data.formerInmate === 'yes') {
        return data.wardenLetter instanceof File;
      }
      return true;
    },
    {
      message: 'Please upload a letter from the Warden (required for former inmates)',
      path: ['wardenLetter'],
    }
  )
  .refine(
    (data) => {
      if (data.governmentIdType === 'passport') {
        return data.passportScan instanceof File;
      }
      return true;
    },
    {
      message: 'Please upload a scan of your passport (required for passport holders)',
      path: ['passportScan'],
    }
  )
  .refine(
    (data) => {
      if (data.passportScan instanceof File) {
        return data.passportScan.size <= 5 * 1024 * 1024;
      }
      return true;
    },
    {
      message: 'Passport scan must be less than 5MB',
      path: ['passportScan'],
    }
  )
  .refine(
    (data) => {
      if (data.passportScan instanceof File) {
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        return validTypes.includes(data.passportScan.type);
      }
      return true;
    },
    {
      message: 'Passport scan must be a PDF, JPG, or PNG file',
      path: ['passportScan'],
    }
  );

// ============================================
// FULL APPLICATION SCHEMA
// ============================================
export const fullApplicationSchema = z.object({
  applicationId: z.string().uuid(),
  ...personalInfoSchema.shape,
  ...contactInfoSchema.shape,
  ...experienceSchema.shape,
  ...rulesSchema.shape,
  ...securitySchema.shape,
});

export type FullApplication = z.infer<typeof fullApplicationSchema>;
export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type ContactInfo = z.infer<typeof contactInfoSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Rules = z.infer<typeof rulesSchema>;
export type Security = z.infer<typeof securitySchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

export function validateStep(step: number, data: Partial<FullApplication>) {
  switch (step) {
    case 1:
      return personalInfoSchema.safeParse(data);
    case 2:
      return contactInfoSchema.safeParse(data);
    case 3:
      return experienceSchema.safeParse(data);
    case 4:
      return rulesSchema.safeParse(data);
    case 5:
      return securitySchema.safeParse(data);
    default:
      return { success: false, error: { issues: [{ message: 'Invalid step number' }] } };
  }
}

export function validateFullApplication(data: Partial<FullApplication>) {
  return fullApplicationSchema.safeParse(data);
}

export function getErrorMessages(result: z.ZodError<Record<string, unknown>>): Record<string, string> {
  const errors: Record<string, string> = {};
  result.issues.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  return errors;
}
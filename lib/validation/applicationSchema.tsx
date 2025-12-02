// ============================================
// FILE 1: lib/validation/applicationSchema.ts
// ============================================
import { z } from 'zod';

// Helper validators
const phoneRegex = /^\+?[1-9]\d{9,14}$/; // E.164 format
const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
const dateRegex = /^\d{2}-\d{2}-\d{4}$/; // MM-DD-YYYY

// Reusable validators
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

// ============================================
// STEP 1: PERSONAL INFORMATION
// ============================================
export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  otherNames: z.string().max(200).optional(),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine(isValidDate, 'Must be a valid date in MM-DD-YYYY format')
    .refine((date) => {
      if (!isValidDate(date)) return true;
      const [mm, dd, yyyy] = date.split('-').map(Number);
      const birthDate = new Date(yyyy, mm - 1, dd);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      return age >= 18 && age <= 120;
    }, 'Must be 18-120 years old'),
  gender: z.enum(['male', 'female', 'nonbinary', 'prefer_not_to_say', 'other'], {
    message: 'Please select a gender',
  }),
});

// ============================================
// STEP 2: CONTACT & ORGANIZATION
// ============================================
export const contactInfoSchema = z.object({
  email: z.string().email('Invalid email address'),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .refine(
      (val) => phoneRegex.test(val.replace(/[\s()-]/g, '')),
      'Invalid phone number format'
    ),
  visitDate: z
    .string()
    .optional()
    .refine((val) => !val || isValidDate(val), 'Invalid date format (MM-DD-YYYY)'),
  companyOrOrganization: z.string().min(1, 'Company/Organization is required').max(200),
  purposeOfVisit: z.string().min(10, 'Purpose must be at least 10 characters').max(1000),
});

// ============================================
// STEP 3: EXPERIENCE & EXPECTATIONS
// ============================================
export const experienceSchema = z.object({
  engagedDirectly: z.enum(
    ['no_first_time', 'personal_connection', 'volunteer', 'professional', 'other'],
    { message: 'Please select an option' }
  ),
  perceptions: z.string().min(20, 'Please provide at least 20 characters').max(2000),
  expectations: z.string().min(20, 'Please provide at least 20 characters').max(2000),
  justiceReformBefore: z.enum(
    ['active', 'limited', 'never', 'thought_about', 'other'],
    { message: 'Please select an option' }
  ),
  interestsMost: z.string().min(20, 'Please provide at least 20 characters').max(2000),
  reformFuture: z.enum(
    ['already_involved_continue', 'considering', 'maybe', 'one_time', 'other'],
    { message: 'Please select an option' }
  ),
  additionalNotes: z.string().max(2000).optional(),
});

// ============================================
// STEP 4: RULES & ACKNOWLEDGMENT
// ============================================
export const rulesSchema = z.object({
  rulesColor: z.enum(['Blue', 'Green', 'Yellow', 'Orange', 'Gray', 'Black'], {
    message: 'Please select a color',
  }).refine((val) => val === 'Black', 'Only black clothing is allowed'),
  
  rulesPhonePolicy: z.enum(
    ['Bring inside', 'Leave in car / check at East Gate', 'Clear bag inside'],
    { message: 'Please select an option' }
  ).refine(
    (val) => val === 'Leave in car / check at East Gate',
    'You must leave devices in your car or check at East Gate'
  ),
  
  rulesShareContact: z.enum(
    ['Direct to public handles', 'Politely decline + ask Kai/Escort', 'Accept + keep confidential'],
    { message: 'Please select an option' }
  ).refine(
    (val) => val === 'Politely decline + ask Kai/Escort',
    'Contact exchange requires approval from Kai and your escort'
  ),
  
  rulesWrittenMaterials: z.enum(
    [
      'Personal business cards',
      'Contact information cards',
      'Materials related to SkunkWorks with approval',
      'Personal notes',
    ],
    { message: 'Please select an option' }
  ).refine(
    (val) => val === 'Materials related to SkunkWorks with approval',
    'Only SkunkWorks-related materials with approval are permitted'
  ),
  
  acknowledgmentAgreement: z.literal(true, {
    message: 'You must agree to follow all rules',
  }),
});

// ============================================
// STEP 5: SECURITY CLEARANCE (Complex)
// ============================================
export const securitySchema = z
  .object({
    // Government ID
    governmentIdType: z.enum(['driver_license', 'passport'], {
      message: 'Please select ID type',
    }),
    governmentIdNumber: z
      .string()
      .min(1, 'Government ID number is required')
      .max(50)
      .transform((val) => val.toUpperCase().replace(/[^A-Z0-9]/g, '')),
    governmentIdNumberConfirm: z.string().min(1, 'Please confirm your ID number'),
    
    // State (conditional)
    idState: z.string().max(2).optional(),
    
    // Expiration
    idExpiration: z
      .string()
      .min(1, 'ID expiration is required')
      .refine(isValidDate, 'Invalid date format (MM-DD-YYYY)')
      .refine(isFutureDate, 'ID is expired'),
    
    // SSN Method
    ssnMethod: z.enum(['direct', 'call', 'split'], {
      message: 'Please select how to provide SSN',
    }),
    
    // SSN Direct (conditional)
    ssnFull: z.string().optional(),
    ssnFullConfirm: z.string().optional(),
    
    // SSN Split (conditional)
    ssnFirstFive: z.string().optional(),
    ssnFirstFiveConfirm: z.string().optional(),
    
    // Background Questions
    formerInmate: z.enum(['yes', 'no'], {
      message: 'Please answer this question',
    }),
    wardenLetter: z.instanceof(File).optional(),
    
    onParole: z.enum(['yes', 'no'], {
      message: 'Please answer this question',
    }),
    
    // Confirmations
    confirmAccuracy: z.literal(true, {
      message: 'You must confirm accuracy',
    }),
    
    digitalSignature: z.string().min(1, 'Digital signature is required'),
    
    consentToDataUse: z.literal(true, {
      message: 'You must consent to data use',
    }),
  })
  // Cross-field validations
  .refine(
    (data) => {
      // ID State required for driver's license
      if (data.governmentIdType === 'driver_license') {
        return data.idState && data.idState.length === 2;
      }
      return true;
    },
    {
      message: 'State is required for driver\'s license',
      path: ['idState'],
    }
  )
  .refine(
    (data) => {
      // ID State NOT allowed for passport
      if (data.governmentIdType === 'passport' && data.idState) {
        return false;
      }
      return true;
    },
    {
      message: 'Do not provide state for passports',
      path: ['idState'],
    }
  )
  .refine(
    (data) => {
      // ID Number confirmation must match
      const normalized1 = data.governmentIdNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const normalized2 = data.governmentIdNumberConfirm.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return normalized1 === normalized2;
    },
    {
      message: 'ID numbers do not match',
      path: ['governmentIdNumberConfirm'],
    }
  )
  .refine(
    (data) => {
      // SSN required if direct method
      if (data.ssnMethod === 'direct') {
        return data.ssnFull && ssnRegex.test(data.ssnFull);
      }
      return true;
    },
    {
      message: 'SSN is required for direct submission',
      path: ['ssnFull'],
    }
  )
  .refine(
    (data) => {
      // SSN confirmation must match (direct)
      if (data.ssnMethod === 'direct' && data.ssnFull && data.ssnFullConfirm) {
        const clean1 = data.ssnFull.replace(/\D/g, '');
        const clean2 = data.ssnFullConfirm.replace(/\D/g, '');
        return clean1 === clean2;
      }
      return true;
    },
    {
      message: 'SSN numbers do not match',
      path: ['ssnFullConfirm'],
    }
  )
  .refine(
    (data) => {
      // First 5 SSN digits required if split method
      if (data.ssnMethod === 'split') {
        return data.ssnFirstFive && /^\d{5}$/.test(data.ssnFirstFive.replace(/\D/g, ''));
      }
      return true;
    },
    {
      message: 'First 5 digits of SSN are required',
      path: ['ssnFirstFive'],
    }
  )
  .refine(
    (data) => {
      // SSN first 5 confirmation must match (split)
      if (data.ssnMethod === 'split' && data.ssnFirstFive && data.ssnFirstFiveConfirm) {
        const clean1 = data.ssnFirstFive.replace(/\D/g, '');
        const clean2 = data.ssnFirstFiveConfirm.replace(/\D/g, '');
        return clean1 === clean2;
      }
      return true;
    },
    {
      message: 'SSN digits do not match',
      path: ['ssnFirstFiveConfirm'],
    }
  )
  .refine(
    (data) => {
      // Warden letter required if former inmate
      if (data.formerInmate === 'yes') {
        return data.wardenLetter instanceof File;
      }
      return true;
    },
    {
      message: 'Warden letter is required for former inmates',
      path: ['wardenLetter'],
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

// Validate a single step
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
      return { success: false, error: { errors: [{ message: 'Invalid step' }] } };
  }
}

// Validate entire application
export function validateFullApplication(data: Partial<FullApplication>) {
  return fullApplicationSchema.safeParse(data);
}

// Get error messages from Zod result
export function getErrorMessages(result: z.ZodError<any>): Record<string, string> {
  const errors: Record<string, string> = {};
  result.issues.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  return errors;
}
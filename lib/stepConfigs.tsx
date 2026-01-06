import { Shield, User, Building2, FileText, Clipboard } from 'lucide-react';
import type { SectionConfig } from '@/components/SectionForm';
import {
  personalInfoSchema,
  contactInfoSchema,
  experienceSchema,
  rulesSchema,
  securitySchema,
} from '@/lib/validation/applicationSchema';

// ============================================
// STEP 1: PERSONAL INFORMATION
// ============================================
export const personalConfig: SectionConfig = {
  title: 'Personal Information',
  subtitle: 'Match your legal ID. Use full legal name.',
  icon: <User className="h-6 w-6" />,
  zodSchema: personalInfoSchema,
  columns: 2,
  ctaLabel: 'Continue',
  fields: [
    { kind: 'text', name: 'firstName', label: 'First name', required: true },
    { kind: 'text', name: 'lastName', label: 'Last name', required: true },
    { kind: 'text', name: 'otherNames', label: 'Other names (optional)', span: 2 },
    {
      kind: 'date',
      name: 'dateOfBirth',
      label: 'Date of birth',
      required: true,
      placeholder: 'MM-DD-YYYY',
    },
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
};

// ============================================
// STEP 2: CONTACT & ORGANIZATION
// ============================================
export const contactOrgConfig: SectionConfig = {
  title: 'Contact & Organization',
  subtitle: "We'll use this for visit planning and updates.",
  icon: <Building2 className="h-6 w-6" />,
  zodSchema: contactInfoSchema,
  columns: 2,
  ctaLabel: 'Continue',
  fields: [
    { kind: 'email', name: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
    {
      kind: 'tel',
      name: 'phoneNumber',
      label: 'Phone number',
      required: true,
      placeholder: '(415) 555-1234',
    },
    {
      kind: 'date',
      name: 'visitDate',
      label: 'Preferred visit date (optional)',
      placeholder: 'MM-DD-YYYY',
    },
    { kind: 'text', name: 'companyOrOrganization', label: 'Company / Organization', required: true },
    {
      kind: 'textarea',
      name: 'purposeOfVisit',
      label: 'Purpose of visit',
      helpText: 'Please write at least 10 characters',
      required: true,
      rows: 4,
      span: 2,
    },
  ],
};

// ============================================
// STEP 3: EXPERIENCE & EXPECTATIONS
// ============================================
export const experienceConfig: SectionConfig = {
  title: 'Prior Experience & Expectations',
  subtitle: "There are no right or wrong answers—just your honest thoughts.",
  icon: <Clipboard className="h-6 w-6" />,
  zodSchema: experienceSchema,
  columns: 1,
  ctaLabel: 'Continue',
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
    {
      kind: 'textarea',
      name: 'perceptions',
      label: 'What comes to mind when you think about incarcerated people?',
      helpText: 'Please write at least 20 characters',
      required: true,
      rows: 4,
    },
    {
      kind: 'textarea',
      name: 'expectations',
      label: 'What do you expect to experience during your visit to SkunkWorks?',
      helpText: 'Please write at least 20 characters',
      required: true,
      rows: 4,
    },
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
    {
      kind: 'textarea',
      name: 'interestsMost',
      label: 'What interests you most about this visit?',
      helpText: 'Please write at least 20 characters',
      required: true,
      rows: 4,
    },
    {
      kind: 'radio',
      name: 'reformFuture',
      label: 'Do you see yourself engaging in criminal justice reform efforts in the future?',
      required: true,
      options: [
        { label: "Yes, I'm already involved and plan to continue.", value: 'already_involved_continue' },
        { label: "Yes, I've thought about it but haven't taken action yet.", value: 'considering' },
        { label: 'Maybe, depending on what I learn from this visit.', value: 'maybe' },
        { label: 'No, this is just a one-time visit for me.', value: 'one_time' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      kind: 'textarea',
      name: 'additionalNotes',
      label: "Is there anything else you'd like us to know before your visit? (Optional)",
      rows: 3,
    },
  ],
};

// ============================================
// STEP 4: RULES & ACKNOWLEDGMENT (SIMPLIFIED)
// ============================================
export const rulesConfig: SectionConfig = {
  title: 'Review & Acknowledgment',
  subtitle: 'Please review the rules before your visit.',
  icon: <Shield className="h-6 w-6" />,
  zodSchema: rulesSchema,
  columns: 1,
  ctaLabel: 'Continue',
  fields: [
    {
      kind: 'checkbox',
      name: 'acknowledgmentAgreement',
      label: 'I have read and agree to follow all rules and guidelines',
      required: true,
    },
  ],
};

// ============================================
// STEP 5: SECURITY CLEARANCE
// ============================================
export const securityConfig: SectionConfig = {
  title: 'Security Clearance Information',
  subtitle: 'Provide the ID details used for CDCR clearance.',
  icon: <FileText className="h-6 w-6" />,
  zodSchema: securitySchema,
  columns: 1,
  ctaLabel: 'Submit Application',
  fields: [
    {
      kind: 'radio',
      name: 'governmentIdType',
      label: 'Type of ID used for clearance',
      required: true,
      options: [
        { label: "Driver's License", value: 'driver_license' },
        { label: 'Passport', value: 'passport' },
      ],
    },
    {
      kind: 'text',
      name: 'governmentIdNumber',
      label: 'Government ID Number (DL or Passport)',
      required: true,
      placeholder: 'D1234567',
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
      label: 'ID expiration',
      required: true,
      placeholder: 'MM-DD-YYYY',
    },
    {
      name: 'passportScan',
      label: 'Upload Passport Scan',
      kind: 'file',  
      required: true,
      accept: '.pdf,.jpg,.jpeg,.png',
      helpText: 'Please upload a clear scan of your passport (PDF, JPG, or PNG, max 5MB)',
      showIf: (values: Record<string, unknown>) => values.governmentIdType === 'passport', 
    },
    {
      kind: 'radio',
      name: 'ssnMethod',
      label: 'How would you like to provide your SSN?',
      required: true,
      options: [
        { label: 'Directly through this form', value: 'direct' },
        { label: 'Call the Executive Director at (415) 275-2058', value: 'call' },
        { label: 'Split: first five here, last four via text/email/call', value: 'split' },
      ],
    },
    {
      kind: 'checkbox',
      name: 'ssnVerifiedByPhone',
      label: 'I confirmed my SSN over the phone with the Executive Director at (415) 275-2058',
      required: true,
      showIf: (values: Record<string, unknown>) => values.ssnMethod === 'call',
    },
    {
      kind: 'text',
      name: 'ssnFull',
      label: 'Enter your full SSN',
      placeholder: '123-45-6789',
      required: true,
      showIf: (v) => v.ssnMethod === 'direct',
      helpText: 'Format: 123-45-6789',
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
      name: 'wardenLetter',
      label: 'Upload Letter from Warden',
      kind: 'file', 
      required: true,
      accept: '.pdf,.jpg,.jpeg,.png',
      helpText: 'Please upload a letter from the Warden approving your visit (PDF, JPG, or PNG, max 5MB)',
      showIf: (values: Record<string, unknown>) => values.formerInmate === 'yes',
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
    },
    {
      kind: 'checkbox',
      name: 'consentToDataUse',
      label: 'I consent to the use of my information solely for security clearance and entry to San Quentin SkunkWorks (impact answers may be used anonymously).',
      required: true,
    },
  ],
};
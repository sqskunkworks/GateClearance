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
      label: 'Date of birth (MM-DD-YYYY)',
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
      placeholder: '415-555-1234 or +27 82 123 4567',
    },
    {
      kind: 'date',
      name: 'visitDate',
      label: 'Preferred visit date (MM-DD-YYYY, optional)',
      placeholder: 'MM-DD-YYYY',
    },
    { kind: 'text', name: 'companyOrOrganization', label: 'Company / Organization', required: true },
    {
      kind: 'textarea',
      name: 'purposeOfVisit',
      label: 'Purpose of visit',
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
      required: true,
      rows: 4,
    },
    {
      kind: 'textarea',
      name: 'expectations',
      label: 'What do you expect to experience during your visit to SkunkWorks?',
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
// STEP 4: RULES & ACKNOWLEDGMENT
// ============================================
export const rulesConfig: SectionConfig = {
  title: 'Review & Acknowledgment',
  subtitle: 'Confirm your understanding of key rules before your visit.',
  icon: <Shield className="h-6 w-6" />,
  zodSchema: rulesSchema,
  columns: 1,
  ctaLabel: 'Continue',
  fields: [
    {
      kind: 'radio',
      name: 'rulesColor',
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
      name: 'rulesPhonePolicy',
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
      name: 'rulesShareContact',
      label: 'What should you do if asked to share your contact information?',
      required: true,
      options: [
        { label: 'Direct to publicly available email or social handles', value: 'Direct to public handles' },
        {
          label: 'Politely decline and ask the Impact Team President (Kai) and your Escort',
          value: 'Politely decline + ask Kai/Escort',
        },
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
      name: 'rulesWrittenMaterials',
      label: 'Which written materials can you bring or receive?',
      required: true,
      options: [
        { label: 'Personal business cards', value: 'Personal business cards' },
        { label: 'Contact information cards', value: 'Contact information cards' },
        {
          label: 'Materials directly related to SkunkWorks (with approval)',
          value: 'Materials related to SkunkWorks with approval',
        },
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
    {
      kind: 'checkbox',
      name: 'acknowledgmentAgreement',
      label: 'I have reviewed and agree to follow all rules and guidelines',
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
      name: 'passportScan',
      label: 'Upload Passport Scan',
      kind: 'file',  
      required: true,
      accept: '.pdf,.jpg,.jpeg,.png',
      helpText: 'Please upload a clear scan of your passport (PDF, JPG, or PNG, max 5MB)',
      showIf: (values: Record<string, any>) => values.governmentIdType === 'passport', 
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
      name: 'wardenLetter',
      label: 'Upload Letter from Warden',
      kind: 'file', 
      required: true,
      accept: '.pdf,.jpg,.jpeg,.png',
      helpText: 'Please upload a letter from the Warden approving your visit (PDF, JPG, or PNG, max 5MB)',
      showIf: (values: Record<string, any>) => values.formerInmate === 'yes',  // ← Changed from 'condition' to 'showIf'
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
};
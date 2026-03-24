import { Shield, User, Building2, FileText, AlertCircle } from 'lucide-react';
import type { SectionConfig } from '@/components/SectionForm';
import { z } from 'zod';
import type { FormValues } from '@/components/SectionForm';
import {
  annualCoverSchema,
  annualPersonalSchema,
  annualBackgroundSchema,
  annualEmergencySchema,
  annualAcknowledgmentSchema,
} from '@/lib/validation/annualGCSchema';

// Helper to cast schemas that have literal outputs to the FormValues-compatible type
// SectionForm's zodSchema expects ZodType<FormValues> but z.literal(true) outputs `true`
// which TypeScript correctly flags as incompatible. The cast is safe because SectionForm
// only calls .safeParse() and reads .error.issues — it never relies on the output type.
const asFormSchema = (schema: z.ZodTypeAny) => schema as unknown as z.ZodType<FormValues>;

// ============================================
// STEP 1: COVER SHEET
// ============================================
export const annualCoverConfig: SectionConfig = {
  title: 'Annual Application — Cover Sheet',
  subtitle: 'Attachment 1: Program Provider Gate Clearance Cover Sheet',
  icon: <FileText className="h-6 w-6" />,
  zodSchema: asFormSchema(annualCoverSchema),
  columns: 2,
  ctaLabel: 'Continue',
  fields: [
    {
      kind: 'text',
      name: 'ppName',
      label: 'PP Name (Full Name)',
      required: true,
      placeholder: 'Full legal name',
      span: 2,
    },
    {
      kind: 'tel',
      name: 'contactNumber',
      label: 'Contact Number',
      required: true,
      placeholder: '(415) 555-1234',
    },
    {
      kind: 'email',
      name: 'email',
      label: 'Email',
      required: true,
      placeholder: 'you@example.com',
    },
    {
      kind: 'date',
      name: 'birthday',
      label: 'Birthday',
      required: true,
      placeholder: 'MM-DD-YYYY',
    },
    {
      kind: 'text',
      name: 'programName',
      label: 'Program Name',
      required: true,
      placeholder: 'e.g. San Quentin SkunkWorks',
    },
    {
      kind: 'radio',
      name: 'isRenewal',
      label: 'Application Type',
      required: true,
      span: 2,
      options: [
        { label: 'New Volunteer', value: 'new' },
        { label: 'Renewal', value: 'renewal' },
      ],
    },
  ],
};

// ============================================
// STEP 2: PERSONAL DETAILS (CDCR 966 Section I)
// ============================================
export const annualPersonalConfig: SectionConfig = {
  title: 'Personal Details',
  subtitle: 'CDCR 966 — Section I: To be Completed by Applicant',
  icon: <User className="h-6 w-6" />,
  zodSchema: asFormSchema(annualPersonalSchema),
  columns: 2,
  ctaLabel: 'Continue',
  fields: [
    { kind: 'text', name: 'firstName', label: 'First Name', required: true },
    { kind: 'text', name: 'middleInitial', label: 'Middle Initial (optional)', placeholder: 'A' },
    { kind: 'text', name: 'lastName', label: 'Last Name', required: true },
    { kind: 'date', name: 'dateOfBirth', label: 'Date of Birth', required: true, placeholder: 'MM-DD-YYYY' },
    { kind: 'text', name: 'addressStreet', label: 'Street Address', required: true, placeholder: '123 Main St', span: 2 },
    { kind: 'text', name: 'addressApt', label: 'Apt / Unit (optional)', placeholder: 'Apt 4B' },
    { kind: 'text', name: 'addressCity', label: 'City', required: true },
    { kind: 'text', name: 'addressState', label: 'State', required: true, placeholder: 'CA' },
    { kind: 'text', name: 'addressZip', label: 'ZIP Code', required: true, placeholder: '94964' },
    { kind: 'tel', name: 'phoneNumber', label: 'Phone Number (required)', required: true, placeholder: '(415) 555-1234' },
    { kind: 'tel', name: 'cellNumber', label: 'Cell Number (optional)', placeholder: '(415) 555-5678' },
    {
      kind: 'radio',
      name: 'gender',
      label: 'Gender',
      required: true,
      span: 2,
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
      ],
    },
    { kind: 'text', name: 'height', label: 'Height', required: true, placeholder: "5'10\"" },
    { kind: 'text', name: 'weight', label: 'Weight', required: true, placeholder: '170 lbs' },
    { kind: 'text', name: 'eyeColor', label: 'Eye Color', required: true, placeholder: 'Brown' },
    { kind: 'text', name: 'hairColor', label: 'Hair Color', required: true, placeholder: 'Black' },
    { kind: 'text', name: 'occupation', label: 'Occupation (optional)', span: 2, placeholder: 'Software Engineer' },
    { kind: 'textarea', name: 'specialSkills', label: 'Special Skills / Certificates (optional)', span: 2, rows: 3 },
    { kind: 'text', name: 'organizationName', label: 'Organization / Company Name (optional)', span: 2 },
    { kind: 'textarea', name: 'organizationAddress', label: 'Organization Address (optional)', span: 2, rows: 2 },
  ],
};

// ============================================
// STEP 3: BACKGROUND QUESTIONS (CDCR 966 Q1–Q7)
// ============================================
export const annualBackgroundConfig: SectionConfig = {
  title: 'Background Questions',
  subtitle: 'CDCR 966 — Questions 1–7. Answer all questions honestly.',
  icon: <AlertCircle className="h-6 w-6" />,
  zodSchema: asFormSchema(annualBackgroundSchema),
  columns: 1,
  ctaLabel: 'Continue',
  fields: [
    {
      kind: 'radio', name: 'q1LiveScan',
      label: '1. Have you submitted Live Scan fingerprints to CDCR in the past?',
      required: true,
      options: [{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }],
    },
    {
      kind: 'text', name: 'q1LiveScanDetails',
      label: 'If yes — provide date and location/institution',
      placeholder: 'e.g. March 2022, San Quentin State Prison',
      showIf: (v) => v.q1LiveScan === 'yes',
    },
    {
      kind: 'radio', name: 'q2OtherCdcr',
      label: '2. Do you provide volunteer service at any other CDCR institution?',
      required: true,
      options: [{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }],
    },
    {
      kind: 'text', name: 'q2OtherCdcrDetails',
      label: 'If yes — provide date and location/institution',
      showIf: (v) => v.q2OtherCdcr === 'yes',
    },
    {
      kind: 'radio', name: 'q3VisitInmates',
      label: '3. Do you visit and/or correspond with any inmates at any other CDCR institution?',
      required: true,
      options: [{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }],
    },
    {
      kind: 'textarea', name: 'q3VisitInmatesDetails',
      label: 'If yes — provide inmate name(s), CDCR number(s), and institution(s)',
      rows: 3,
      showIf: (v) => v.q3VisitInmates === 'yes',
    },
    {
      kind: 'radio', name: 'q4RelatedToInmate',
      label: '4. Are you related to any inmate(s) at any CDCR institution?',
      required: true,
      options: [{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }],
    },
    {
      kind: 'textarea', name: 'q4RelatedDetails',
      label: 'If yes — provide inmate name(s) and CDCR number(s)',
      rows: 3,
      showIf: (v) => v.q4RelatedToInmate === 'yes',
    },
    {
      kind: 'radio', name: 'q5ArrestedConvicted',
      label: '5. Have you ever been arrested and/or convicted of any offense?',
      helpText: 'Include all detentions, arrests, and/or convictions.',
      required: true,
      options: [{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }],
    },
    {
      kind: 'textarea', name: 'criminalHistory',
      label: 'Criminal history — list offense, approximate date, disposition, county, state, country',
      helpText: 'Format each entry on a new line: Offense | Approx Date | Disposition | County | State | Country',
      rows: 5,
      showIf: (v) => v.q5ArrestedConvicted === 'yes',
    },
    {
      kind: 'radio', name: 'q6OnParole',
      label: '6. Are you currently on parole or probation?',
      helpText: 'If yes, you must be one year free of illegal activity and submit an approval letter.',
      required: true,
      options: [{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }],
    },
    {
      kind: 'textarea', name: 'q6ParoleDetails',
      label: 'If yes — name, telephone number, and county of parole/probation officer',
      rows: 2,
      showIf: (v) => v.q6OnParole === 'yes',
    },
    {
      kind: 'radio', name: 'q7Discharged',
      label: '7. Are you discharged from prison or parole?',
      helpText: 'If yes, you must be one year free of illegal activity and attach a letter to the Warden.',
      required: true,
      options: [{ label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' }],
    },
    {
      kind: 'textarea', name: 'q7DischargeDetails',
      label: 'If yes — date of discharge and name of institution',
      rows: 2,
      showIf: (v) => v.q7Discharged === 'yes',
    },
    {
      kind: 'file', name: 'wardenLetter',
      label: 'Upload letter addressed to the Warden',
      accept: '.pdf,.jpg,.jpeg,.png',
      helpText: 'Required if discharged from prison or parole (PDF, JPG, or PNG, max 5MB)',
      showIf: (v) => v.q7Discharged === 'yes',
    },
  ],
};

// ============================================
// STEP 4: EMERGENCY CONTACTS (CDCR 894)
// ============================================
export const annualEmergencyConfig: SectionConfig = {
  title: 'Emergency Contact Information',
  subtitle: 'CDCR 894 — Emergency Notification Information',
  icon: <Shield className="h-6 w-6" />,
  zodSchema: asFormSchema(annualEmergencySchema),
  columns: 2,
  ctaLabel: 'Continue',
  fields: [
    { kind: 'text', name: 'ssnLast4', label: 'Last 4 digits of SSN (for ID purposes only)', required: true, placeholder: '1234' },
    // Emergency Contact 1
    { kind: 'text', name: 'ec1Name', label: 'Emergency Contact 1 — Full Name (Last, First, Middle)', required: true, span: 2, placeholder: 'Smith, John A.' },
    { kind: 'text', name: 'ec1Relationship', label: 'Relationship', required: true, placeholder: 'Spouse, Parent...' },
    { kind: 'text', name: 'ec1Address', label: 'Home Address', required: true, span: 2, placeholder: 'Street, City, State, ZIP' },
    { kind: 'tel', name: 'ec1HomePhone', label: 'Home Phone', required: true, placeholder: '(415) 555-1234' },
    { kind: 'tel', name: 'ec1WorkPhone', label: 'Work Phone (optional)', placeholder: '(415) 555-5678' },
    { kind: 'tel', name: 'ec1CellPhone', label: 'Cell Phone (optional)', placeholder: '(415) 555-9012' },
    // Emergency Contact 2
    { kind: 'text', name: 'ec2Name', label: 'Emergency Contact 2 — Full Name (optional)', span: 2, placeholder: 'Smith, Jane B.' },
    { kind: 'text', name: 'ec2Relationship', label: 'Relationship (optional)', placeholder: 'Spouse, Parent...' },
    { kind: 'text', name: 'ec2Address', label: 'Home Address (optional)', span: 2 },
    { kind: 'tel', name: 'ec2HomePhone', label: 'Home Phone (optional)', placeholder: '(415) 555-1234' },
    { kind: 'tel', name: 'ec2WorkPhone', label: 'Work Phone (optional)' },
    { kind: 'tel', name: 'ec2CellPhone', label: 'Cell Phone (optional)' },
    // Medical info
    { kind: 'text', name: 'physicianName', label: "Personal Physician's Name (optional)", placeholder: 'Dr. Jane Smith' },
    { kind: 'tel', name: 'physicianPhone', label: "Physician's Phone (optional)", placeholder: '(415) 555-1234' },
    { kind: 'text', name: 'medicalPlanName', label: 'Medical Plan Name (optional)', placeholder: 'Kaiser Permanente' },
    { kind: 'text', name: 'medicalPlanCardNumber', label: 'Medical Plan Card Number (optional)', placeholder: 'Member ID' },
    { kind: 'text', name: 'medicalFacility', label: 'Medical Facility Name and Location (optional)', span: 2 },
    { kind: 'textarea', name: 'specialConditions', label: 'Special Medical Conditions / Allergies (optional)', span: 2, rows: 2 },
    { kind: 'textarea', name: 'specialInstructions', label: 'Special Instructions (optional)', span: 2, rows: 2 },
  ],
};

// ============================================
// STEP 5: ACKNOWLEDGMENT + SIGNATURE
// ============================================
export const annualAcknowledgmentConfig: SectionConfig = {
  title: 'Certification & Signature',
  subtitle: 'CDCR 966 — Applicant Certification and CDCR 859 Acknowledgment',
  icon: <Building2 className="h-6 w-6" />,
  zodSchema: asFormSchema(annualAcknowledgmentSchema),
  columns: 1,
  ctaLabel: 'Submit Application',
  fields: [
    {
      kind: 'checkbox',
      name: 'certificationAgreement',
      required: true,
      label: "I certify that: No salaries or wages are to be paid for volunteer services; there is no Worker's Compensation provided; I must attend required training; I have read and understand CDCR Primary Laws, Rules, and Regulations; I authorize CDCR to obtain criminal history information; and I understand I must notify the Community Resources Manager of any changes to this information.",
    },
    {
      kind: 'checkbox',
      name: 'reasonableAccommodationAck',
      required: true,
      label: 'I acknowledge I have received and read the Notice of Right to Request Reasonable Accommodation (CDCR 859) and understand I may request reasonable accommodations at any time.',
    },
    {
      kind: 'signature',
      name: 'digitalSignature',
      label: 'Applicant Signature',
      required: true,
      height: 160,
    },
    {
      kind: 'checkbox',
      name: 'consentToDataUse',
      required: true,
      label: 'I consent to my information being entered and stored in a secure electronic database for a minimum of three years, as required by CDCR.',
    },
  ],
};
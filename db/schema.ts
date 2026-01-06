// db/schema.ts
import {
  pgTable,
  uuid,
  text,
  boolean,
  date,
  timestamp,
  pgEnum,
  integer,
  jsonb
} from "drizzle-orm/pg-core";

/* ========= Enums ========= */
export const genderEnum = pgEnum("gender", [
  "male",
  "female",
  "nonbinary",
  "prefer_not_to_say",
  "other",
]);

export const appStatusEnum = pgEnum("application_status", [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
]);

// Government ID type
export const governmentIdTypeEnum = pgEnum("government_id_type", [
  "driver_license",
  "passport",
]);

// SSN method
export const ssnMethodEnum = pgEnum("ssn_method", [
  "direct",
  "call",
  "split",
]);

/* ========= Tables ========= */
export const applications = pgTable("applications", {
  // PK
  id: uuid("id").defaultRandom().primaryKey(),

  // Auth / linkage
  userId: text("user_id").notNull(),
  email: text("email").notNull(),

  // STEP 1: Personal Information
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  otherNames: text("other_names"),
  dateOfBirth: text("date_of_birth").notNull(), // Stored as MM-DD-YYYY text
  gender: genderEnum("gender").notNull(),

  // STEP 2: Contact & Organization
  phoneNumber: text("phone_number").notNull(),
  visitDate: text("visit_date"), // Optional, stored as MM-DD-YYYY text
  companyOrOrganization: text("company_or_organization").notNull(),
  purposeOfVisit: text("purpose_of_visit").notNull(),

  // STEP 3: Experience & Expectations
  engagedDirectly: text("engaged_directly").notNull(),
  perceptions: text("perceptions").notNull(),
  expectations: text("expectations").notNull(),
  justiceReformBefore: text("justice_reform_before").notNull(),
  interestsMost: text("interests_most").notNull(),
  reformFuture: text("reform_future").notNull(),
  additionalNotes: text("additional_notes"),

  // STEP 4: Rules & Acknowledgment (SIMPLIFIED - removed quiz fields)
  acknowledgmentAgreement: boolean("acknowledgment_agreement").notNull(),

  // STEP 5: Security Clearance - Government ID
  governmentIdType: governmentIdTypeEnum("government_id_type").notNull(),
  governmentIdNumber: text("government_id_number").notNull(),
  governmentIdNumberConfirm: text("government_id_number_confirm").notNull(),
  idState: text("id_state"),
  idExpiration: text("id_expiration").notNull(), // Stored as MM-DD-YYYY text
  passportScanUrl: text("passport_scan_url"), // Google Drive URL

  // STEP 5: Security Clearance - SSN
  ssnMethod: ssnMethodEnum("ssn_method").notNull(),
  ssnFull: text("ssn_full"), // Encrypted
  ssnFullConfirm: text("ssn_full_confirm"), // Encrypted
  ssnFirstFive: text("ssn_first_five"), // Encrypted
  ssnFirstFiveConfirm: text("ssn_first_five_confirm"), // Encrypted
  ssnVerifiedByPhone: boolean("ssn_verified_by_phone"), // NEW FIELD

  // STEP 5: Security Clearance - Background
  formerInmate: text("former_inmate").notNull(), // "yes" or "no"
  wardenLetterUrl: text("warden_letter_url"), // Google Drive URL
  onParole: text("on_parole").notNull(), // "yes" or "no"

  // STEP 5: Security Clearance - Final
  confirmAccuracy: boolean("confirm_accuracy").notNull(),
  digitalSignature: text("digital_signature").notNull(), // Base64 data URL
  consentToDataUse: boolean("consent_to_data_use").notNull(),

  // Application Status
  status: appStatusEnum("status").notNull().default("draft"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;

// Documents table 
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }), 
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),

  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  uploadedByUserId: text("uploaded_by_user_id"),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
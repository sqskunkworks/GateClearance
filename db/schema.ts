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

export const governmentIdTypeEnum = pgEnum("government_id_type", [
  "state_id",
  "driver_license",
  "passport",
  "other",
]);

export const applicationTypeEnum = pgEnum("application_type", [
  "short_gc",
  "annual_gc",
  "brown_card",
]);

/* ========= Tables ========= */
export const applications = pgTable("applications", {
  // Primary Key
  id: uuid("id").defaultRandom().primaryKey(),

  // Auth / User
  userId: text("user_id").notNull(),

  // Contact
  email: text("email").notNull(),

  // Application Type
  applicationType: applicationTypeEnum("application_type").notNull().default("short_gc"),

  // Personal Information
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  otherNames: text("other_names"), // nullable
  dateOfBirth: date("date_of_birth").notNull(), // date type, not text
  gender: genderEnum("gender").notNull(),

  // Contact & Organization
  phoneNumber: text("phone_number").notNull(),
  companyOrOrganization: text("company_or_organization").notNull(),
  purposeOfVisit: text("purpose_of_visit"), // nullable

  // Authorization
  authorizationType: text("authorization_type").notNull(),

  // Government ID
  governmentIdType: governmentIdTypeEnum("government_id_type").notNull(),
  governmentIdNumber: text("government_id_number").notNull(),
  idState: text("id_state"), // nullable
  idExpiration: date("id_expiration"), // nullable, date type

  // Background Questions (all have defaults)
  visitedInmate: boolean("visited_inmate").notNull().default(false),
  formerInmate: boolean("former_inmate").notNull().default(false),
  restrictedAccess: boolean("restricted_access").notNull().default(false),
  felonyConviction: boolean("felony_conviction").notNull().default(false),
  onProbationParole: boolean("on_probation_parole").notNull().default(false),
  pendingCharges: boolean("pending_charges").notNull().default(false),

  // Digital Signature
  digitalSignature: text("digital_signature"), // nullable

  // Status
  status: appStatusEnum("status").notNull().default("draft"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }), // nullable

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),

  // JSONB columns
  impactResponses: jsonb("impact_responses"), // nullable
  rulesQuizAnswers: jsonb("rules_quiz_answers"), // nullable

  // SSN verification (only this field exists)
  ssnVerifiedByPhone: boolean("ssn_verified_by_phone"), // nullable
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
  mimeType: text("mime_type"), // nullable
  sizeBytes: integer("size_bytes"), // nullable
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  uploadedByUserId: text("uploaded_by_user_id"), // nullable
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
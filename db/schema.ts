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
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  email: text("email").notNull(),
  applicationType: applicationTypeEnum("application_type").notNull().default("short_gc"),

  // Personal Information
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  otherNames: text("other_names"),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: genderEnum("gender").notNull(),

  // Contact & Organization
  phoneNumber: text("phone_number").notNull(),
  companyOrOrganization: text("company_or_organization").notNull(),
  purposeOfVisit: text("purpose_of_visit"),

  // Visit Dates ('yes' | 'no')
  hasConfirmedDate: text("has_confirmed_date"),
  visitDate1: date("visit_date_1"),
  visitDate2: date("visit_date_2"),
  visitDate3: date("visit_date_3"),

  // Authorization
  authorizationType: text("authorization_type").notNull(),
  isUsCitizen: boolean("is_us_citizen"),

  // Government ID
  governmentIdType: governmentIdTypeEnum("government_id_type").notNull(),
  governmentIdNumber: text("government_id_number").notNull(),
  idState: text("id_state"),
  idExpiration: date("id_expiration"),
  ssnVerifiedByPhone: boolean("ssn_verified_by_phone"),

  // Background Questions
  visitedInmate: boolean("visited_inmate").notNull().default(false),
  formerInmate: boolean("former_inmate").notNull().default(false),
  restrictedAccess: boolean("restricted_access").notNull().default(false),
  felonyConviction: boolean("felony_conviction").notNull().default(false),
  onProbationParole: boolean("on_probation_parole").notNull().default(false),
  pendingCharges: boolean("pending_charges").notNull().default(false),

  digitalSignature: text("digital_signature"),
  status: appStatusEnum("status").notNull().default("draft"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  impactResponses: jsonb("impact_responses"),
  rulesQuizAnswers: jsonb("rules_quiz_answers"),

  // ─────────────────────────────────────────────────────────────────
  // ANNUAL GC ONLY — all nullable, ignored by short_gc flow
  // ─────────────────────────────────────────────────────────────────
  isRenewal: boolean("is_renewal"),
  programName: text("program_name"),
  ppFacilitator: text("pp_facilitator"),
  ppName: text("pp_name"),
  birthday: date("birthday"),
  middleInitial: text("middle_initial"),
  cellNumber: text("cell_number"),
  addressStreet: text("address_street"),
  addressApt: text("address_apt"),
  addressCity: text("address_city"),
  addressState: text("address_state"),
  addressZip: text("address_zip"),
  height: text("height"),
  weight: text("weight"),
  eyeColor: text("eye_color"),
  hairColor: text("hair_color"),
  occupation: text("occupation"),
  specialSkills: text("special_skills"),
  organizationAddress: text("organization_address"),
  q1LiveScan: boolean("q1_live_scan"),
  q1LiveScanDetails: text("q1_live_scan_details"),
  q2OtherCdcr: boolean("q2_other_cdcr"),
  q2OtherCdcrDetails: text("q2_other_cdcr_details"),
  q3VisitInmates: boolean("q3_visit_inmates"),
  q3VisitInmatesDetails: text("q3_visit_inmates_details"),
  q4RelatedToInmate: boolean("q4_related_to_inmate"),
  q4RelatedDetails: text("q4_related_details"),
  q5ArrestedConvicted: boolean("q5_arrested_convicted"),
  criminalHistory: jsonb("criminal_history"),
  q6OnParole: boolean("q6_on_parole"),
  q6ParoleDetails: text("q6_parole_details"),
  q7Discharged: boolean("q7_discharged"),
  q7DischargeDetails: text("q7_discharge_details"),
  ssnLast4: text("ssn_last4"),
  ec1Name: text("ec1_name"),
  ec1Relationship: text("ec1_relationship"),
  ec1Address: text("ec1_address"),
  ec1HomePhone: text("ec1_home_phone"),
  ec1WorkPhone: text("ec1_work_phone"),
  ec1CellPhone: text("ec1_cell_phone"),
  ec2Name: text("ec2_name"),
  ec2Relationship: text("ec2_relationship"),
  ec2Address: text("ec2_address"),
  ec2HomePhone: text("ec2_home_phone"),
  ec2WorkPhone: text("ec2_work_phone"),
  ec2CellPhone: text("ec2_cell_phone"),
  physicianName: text("physician_name"),
  physicianPhone: text("physician_phone"),
  medicalPlanName: text("medical_plan_name"),
  medicalPlanCardNumber: text("medical_plan_card_number"),
  medicalFacility: text("medical_facility"),
  specialConditions: text("special_conditions"),
  specialInstructions: text("special_instructions"),
  certificationAgreement: boolean("certification_agreement"),
  reasonableAccommodationAck: boolean("reasonable_accommodation_ack"),
});

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;

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
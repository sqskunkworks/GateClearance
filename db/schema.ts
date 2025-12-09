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
  
  // Consolidated government ID type
  export const governmentIdTypeEnum = pgEnum("government_id_type", [
    "state_id",
    "driver_license",
    "passport",
    "other",
  ]);
  
  /* ========= Tables ========= */
  export const applications = pgTable("applications", {
    // PK
    id: uuid("id").defaultRandom().primaryKey(),
  
    // Auth / linkage
    userId: text("user_id").notNull(),
    email: text("email").notNull(),
  
    // Personal
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    otherNames: text("other_names"),
    dateOfBirth: date("date_of_birth").notNull(), // YYYY-MM-DD
    gender: genderEnum("gender").notNull(),
  
    // Contact
    phoneNumber: text("phone_number").notNull(),
  
    // From Google Form (per PR)
    companyOrOrganization: text("company_or_organization").notNull(),
    purposeOfVisit: text("purpose_of_visit"),
  
    // Authorization
    authorizationType: text("authorization_type").notNull(), // e.g., "Gate Clearance"
  
    // Government ID (consolidated; per PR)
    governmentIdType: governmentIdTypeEnum("government_id_type").notNull(),
    governmentIdNumber: text("government_id_number").notNull(),
    idState: text("id_state"),           // state where ID was issued
    idExpiration: date("id_expiration"), // to validate expired IDs
  
    // Background questions
    visitedInmate: boolean("visited_inmate").notNull().default(false),
    formerInmate: boolean("former_inmate").notNull().default(false),
    restrictedAccess: boolean("restricted_access").notNull().default(false),
    felonyConviction: boolean("felony_conviction").notNull().default(false),
    onProbationParole: boolean("on_probation_parole").notNull().default(false),
    pendingCharges: boolean("pending_charges").notNull().default(false),
    impactResponses: jsonb("impact_responses"),
    rulesQuizAnswers: jsonb("rules_quiz_answers"),
    // Digital signature (per PR)
    digitalSignature: text("digital_signature"),
  
    // Lifecycle (keep if already in your codebase)
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
      .references(() => applications.id, { onDelete: "cascade" }), // FK to applications.id
  
    // File metadata (store actual file in object storage; keep URL/key here)
    url: text("url").notNull(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
  
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
    uploadedByUserId: text("uploaded_by_user_id"),
  });
  
  export type Document = typeof documents.$inferSelect;
  export type NewDocument = typeof documents.$inferInsert;
  
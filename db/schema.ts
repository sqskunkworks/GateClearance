import { pgTable, uuid, text, boolean, date, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["male","female","nonbinary","prefer_not_to_say","other"]);
export const appStatusEnum = pgEnum("application_status", ["draft","submitted","under_review","approved","rejected"]);

export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),     // your auth user id
  email: text("email").notNull(),        // if you collect it

  // Personal
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  otherNames: text("other_names"),
  dateOfBirth: date("date_of_birth").notNull(),   // use YYYY-MM-DD
  gender: genderEnum("gender").notNull(),

  // Contact
  phoneNumber: text("phone_number").notNull(),
  stateId: text("state_id"),
  driverLicense: text("driver_license"),

  // Authorization
  authorizationType: text("authorization_type").notNull(), // keep text for now (e.g., "Gate Clearance")

  // Background questions (default false so inserts don’t fail)
  visitedInmate: boolean("visited_inmate").notNull().default(false),
  formerInmate: boolean("former_inmate").notNull().default(false),
  restrictedAccess: boolean("restricted_access").notNull().default(false),
  felonyConviction: boolean("felony_conviction").notNull().default(false),
  onProbationParole: boolean("on_probation_parole").notNull().default(false),
  pendingCharges: boolean("pending_charges").notNull().default(false),

  // Lifecycle
  status: appStatusEnum("status").notNull().default("draft"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;

import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Symptoms knowledge base table
 * Stores symptom names and their corresponding long text descriptions
 */
export const symptoms = mysqlTable("symptoms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  longText: text("long_text").notNull(),
  displayOrder: int("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Symptom = typeof symptoms.$inferSelect;
export type InsertSymptom = typeof symptoms.$inferInsert;

/**
 * Employees table
 * Stores employee authentication and profile information
 */
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "employee"]).default("employee").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

/**
 * Reports table
 * Stores generated reports with symptom input and markdown content
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employee_id").notNull(),
  symptomInput: text("symptom_input").notNull(),
  markdownContent: text("markdown_content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Report template settings table
 * Stores intro paragraphs and other template configuration
 */
export const reportTemplates = mysqlTable("report_templates", {
  id: int("id").autoincrement().primaryKey(),
  introParagraph: text("intro_paragraph").notNull(),
  imageUrls: text("image_urls").notNull(), // JSON array of image URLs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
/**
 * Questionnaire responses table
 * Stores basic information from health questionnaires
 */
export const questionnaireResponses = mysqlTable("questionnaire_responses", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  gender: mysqlEnum("gender", ["male", "female"]).notNull(),
  ageRange: varchar("age_range", { length: 20 }).notNull(),
  height: varchar("height", { length: 10 }),
  weight: varchar("weight", { length: 10 }),
  waist: varchar("waist", { length: 10 }),
  bloodPressure: varchar("blood_pressure", { length: 20 }),
  bloodSugar: varchar("blood_sugar", { length: 20 }),
  bodyFat: varchar("body_fat", { length: 20 }),
  additionalNotes: text("additional_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type QuestionnaireResponse = typeof questionnaireResponses.$inferSelect;
export type InsertQuestionnaireResponse = typeof questionnaireResponses.$inferInsert;

/**
 * Questionnaire symptoms table
 * Stores selected symptoms for each questionnaire response
 */
export const questionnaireSymptoms = mysqlTable("questionnaire_symptoms", {
  id: int("id").autoincrement().primaryKey(),
  responseId: int("response_id").notNull(),
  symptomName: varchar("symptom_name", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["head", "body", "limbs", "mental"]).notNull(),
});

export type QuestionnaireSymptom = typeof questionnaireSymptoms.$inferSelect;
export type InsertQuestionnaireSymptom = typeof questionnaireSymptoms.$inferInsert;

/**
 * Questionnaire lifestyle data table
 * Stores lifestyle and habit information from questionnaires
 */
export const questionnaireLifestyle = mysqlTable("questionnaire_lifestyle", {
  id: int("id").autoincrement().primaryKey(),
  responseId: int("response_id").notNull(),
  
  // Exercise
  exerciseParticipation: varchar("exercise_participation", { length: 10 }),
  exerciseType: varchar("exercise_type", { length: 255 }),
  exerciseFrequency: varchar("exercise_frequency", { length: 50 }),
  
  // Sleep and daily routine
  wakeTime: varchar("wake_time", { length: 10 }),
  napTime: varchar("nap_time", { length: 10 }),
  sleepTime: varchar("sleep_time", { length: 10 }),
  hungriestTime: varchar("hungriest_time", { length: 10 }),
  mostTiredTime: varchar("most_tired_time", { length: 10 }),
  
  // Lifestyle habits (JSON)
  lifestyleHabits: text("lifestyle_habits"),
  
  // Meal times
  breakfastTime: varchar("breakfast_time", { length: 10 }),
  breakfastHas: varchar("breakfast_has", { length: 10 }),
  lunchTime: varchar("lunch_time", { length: 10 }),
  lunchHas: varchar("lunch_has", { length: 10 }),
  dinnerTime: varchar("dinner_time", { length: 10 }),
  dinnerHas: varchar("dinner_has", { length: 10 }),
  lateNightSnackTime: varchar("late_night_snack_time", { length: 10 }),
  lateNightSnackHas: varchar("late_night_snack_has", { length: 10 }),
  
  // Dietary preferences (JSON)
  dietaryPreferences: text("dietary_preferences"),
  unsuitableFoods: text("unsuitable_foods"),
  fruitFrequency: varchar("fruit_frequency", { length: 255 }),
  coarseGrainFrequency: varchar("coarse_grain_frequency", { length: 255 }),
  
  // Work environment (JSON)
  workEnvironment: text("work_environment"),
  
  // Medical history
  medicationsAllergies: text("medications_allergies"),
  medicalHistory: text("medical_history"),
});

export type QuestionnaireLifestyle = typeof questionnaireLifestyle.$inferSelect;
export type InsertQuestionnaireLifestyle = typeof questionnaireLifestyle.$inferInsert;

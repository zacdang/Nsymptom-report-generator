import { getDb } from "./db";
import { symptomAnalysis } from "../drizzle/schema";
import { sql } from "drizzle-orm";
import seedData from "./symptom-analysis-seed.json";

/**
 * Safely execute a SQL statement, logging success or error.
 */
async function safeExecute(db: any, label: string, query: any) {
  try {
    await db.execute(query);
    console.log(`[Seed] ${label}: OK`);
  } catch (e: any) {
    console.error(`[Seed] ${label}: ERROR - ${e.message}`);
  }
}

/**
 * Ensure all required tables exist by creating them via raw SQL.
 * This avoids needing drizzle-kit push/migrate at deploy time.
 * 
 * IMPORTANT: All CREATE TABLE statements run first, then ALTER TABLE statements.
 * This ensures that even if ALTER TABLE fails, all tables are created.
 */
async function ensureAllTables(db: any) {
  console.log("[Seed] Starting table creation...");

  // ============ STEP 1: Create all tables first ============
  
  await safeExecute(db, "symptom_analysis", sql`
    CREATE TABLE IF NOT EXISTS symptom_analysis (
      id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
      group_label varchar(500) NOT NULL,
      symptom_names text NOT NULL,
      analysis_text text NOT NULL,
      category varchar(50) NOT NULL,
      sub_category varchar(50) NOT NULL,
      display_order int NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await safeExecute(db, "reports", sql`
    CREATE TABLE IF NOT EXISTS reports (
      id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
      employee_id int NOT NULL,
      symptoms json NOT NULL,
      generated_text text,
      created_at timestamp DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await safeExecute(db, "report_templates", sql`
    CREATE TABLE IF NOT EXISTS report_templates (
      id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
      name varchar(255) NOT NULL,
      template_text text NOT NULL,
      created_at timestamp DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await safeExecute(db, "questionnaire_responses", sql`
    CREATE TABLE IF NOT EXISTS questionnaire_responses (
      id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
      name varchar(100) NOT NULL,
      gender enum('male','female') NOT NULL,
      age_range varchar(20) NOT NULL,
      height varchar(10),
      weight varchar(10),
      waist varchar(10),
      blood_pressure varchar(20),
      blood_sugar varchar(20),
      body_fat varchar(20),
      additional_notes text,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await safeExecute(db, "questionnaire_symptoms", sql`
    CREATE TABLE IF NOT EXISTS questionnaire_symptoms (
      id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
      response_id int NOT NULL,
      symptom_name varchar(255) NOT NULL,
      category enum('head','body','limbs','mental') NOT NULL
    )
  `);

  await safeExecute(db, "questionnaire_lifestyle", sql`
    CREATE TABLE IF NOT EXISTS questionnaire_lifestyle (
      id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
      response_id int NOT NULL,
      exercise_participation varchar(10),
      exercise_type varchar(255),
      exercise_frequency varchar(50),
      wake_time varchar(10),
      nap_time varchar(10),
      sleep_time varchar(10),
      hungriest_time varchar(10),
      most_tired_time varchar(10),
      lifestyle_habits text,
      breakfast_time varchar(10),
      breakfast_has varchar(10),
      lunch_time varchar(10),
      lunch_has varchar(10),
      dinner_time varchar(10),
      dinner_has varchar(10),
      late_night_snack_time varchar(10),
      late_night_snack_has varchar(10),
      dietary_preferences text,
      unsuitable_foods text,
      fruit_frequency varchar(255),
      coarse_grain_frequency varchar(255),
      work_environment text,
      medications_allergies text,
      medical_history text
    )
  `);

  console.log("[Seed] All CREATE TABLE statements completed");

  // ============ STEP 2: ALTER TABLE for missing columns (best effort) ============
  
  const alterColumns = [
    "blood_pressure varchar(20)",
    "blood_sugar varchar(20)",
    "body_fat varchar(20)",
    "additional_notes text",
  ];
  for (const colDef of alterColumns) {
    const colName = colDef.split(" ")[0];
    try {
      await db.execute(sql.raw(`ALTER TABLE questionnaire_responses ADD COLUMN ${colDef}`));
      console.log(`[Seed] Added column ${colName} to questionnaire_responses`);
    } catch (e: any) {
      // Silently ignore all ALTER TABLE errors (column already exists, etc.)
    }
  }

  console.log("[Seed] All table creation and alteration attempts completed");
}

/**
 * Seed the symptom_analysis table with data from the Excel report.
 * This runs on server startup. Creates the table if it doesn't exist,
 * then inserts data only if the table is empty.
 */
export async function seedSymptomAnalysis() {
  const db = await getDb();
  if (!db) {
    console.log("[Seed] Database not available, skipping symptom analysis seed");
    return;
  }

  try {
    // Create all tables if they don't exist
    await ensureAllTables(db);

    // Check if table has data
    const existing = await db.select({ count: sql<number>`count(*)` }).from(symptomAnalysis);
    const count = existing[0]?.count || 0;

    if (count > 0) {
      console.log(`[Seed] symptom_analysis table already has ${count} rows, skipping seed`);
      return;
    }

    console.log(`[Seed] Seeding ${seedData.length} symptom analysis entries...`);

    for (let i = 0; i < seedData.length; i++) {
      const entry = seedData[i];
      await db.insert(symptomAnalysis).values({
        groupLabel: entry.group_label,
        symptomNames: JSON.stringify(entry.symptom_names),
        analysisText: entry.analysis,
        category: entry.entry_type,
        subCategory: entry.category,
        displayOrder: i + 1,
      });
    }

    console.log(`[Seed] Successfully seeded ${seedData.length} symptom analysis entries`);
  } catch (error) {
    console.error("[Seed] Error seeding symptom analysis:", error);
  }
}

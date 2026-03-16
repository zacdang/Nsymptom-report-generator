import { getDb } from "./db";
import { symptomAnalysis } from "../drizzle/schema";
import { sql } from "drizzle-orm";
import seedData from "./symptom-analysis-seed.json";

/**
 * Ensure all required tables exist by creating them via raw SQL.
 * This avoids needing drizzle-kit push/migrate at deploy time.
 */
async function ensureAllTables(db: any) {
  // symptom_analysis table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS symptom_analysis (
      id int AUTO_INCREMENT NOT NULL,
      group_label varchar(500) NOT NULL,
      symptom_names text NOT NULL,
      analysis_text text NOT NULL,
      category varchar(50) NOT NULL,
      sub_category varchar(50) NOT NULL,
      display_order int NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT (now()),
      updated_at timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT symptom_analysis_id PRIMARY KEY(id)
    )
  `);

  // questionnaire_responses table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS questionnaire_responses (
      id int AUTO_INCREMENT NOT NULL,
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
      created_at timestamp NOT NULL DEFAULT (now()),
      updated_at timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT questionnaire_responses_id PRIMARY KEY(id)
    )
  `);

  // Ensure all columns exist (ALTER TABLE for columns that may be missing)
  const alterQueries = [
    "ALTER TABLE questionnaire_responses ADD COLUMN IF NOT EXISTS blood_pressure varchar(20)",
    "ALTER TABLE questionnaire_responses ADD COLUMN IF NOT EXISTS blood_sugar varchar(20)",
    "ALTER TABLE questionnaire_responses ADD COLUMN IF NOT EXISTS body_fat varchar(20)",
    "ALTER TABLE questionnaire_responses ADD COLUMN IF NOT EXISTS additional_notes text",
  ];
  for (const q of alterQueries) {
    try {
      await db.execute(sql.raw(q));
    } catch (e: any) {
      // Ignore "Duplicate column name" errors
      if (!e.message?.includes('Duplicate column')) {
        console.warn(`[Seed] ALTER TABLE warning: ${e.message}`);
      }
    }
  }

  // reports table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS reports (
      id int AUTO_INCREMENT NOT NULL,
      employee_id int NOT NULL,
      symptom_input text NOT NULL,
      markdown_content text NOT NULL,
      created_at timestamp NOT NULL DEFAULT (now()),
      updated_at timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT reports_id PRIMARY KEY(id)
    )
  `);

  // report_templates table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS report_templates (
      id int AUTO_INCREMENT NOT NULL,
      intro_paragraph text NOT NULL,
      image_urls text NOT NULL,
      created_at timestamp NOT NULL DEFAULT (now()),
      updated_at timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT report_templates_id PRIMARY KEY(id)
    )
  `);

  // questionnaire_symptoms table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS questionnaire_symptoms (
      id int AUTO_INCREMENT NOT NULL,
      response_id int NOT NULL,
      symptom_name varchar(255) NOT NULL,
      category enum('head','body','limbs','mental') NOT NULL,
      CONSTRAINT questionnaire_symptoms_id PRIMARY KEY(id)
    )
  `);

  // questionnaire_lifestyle table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS questionnaire_lifestyle (
      id int AUTO_INCREMENT NOT NULL,
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
      medical_history text,
      CONSTRAINT questionnaire_lifestyle_id PRIMARY KEY(id)
    )
  `);
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
    console.log("[Seed] All tables ensured");

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

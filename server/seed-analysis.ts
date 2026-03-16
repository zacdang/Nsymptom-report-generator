import { getDb } from "./db";
import { symptomAnalysis } from "../drizzle/schema";
import { sql } from "drizzle-orm";
import seedData from "./symptom-analysis-seed.json";

/**
 * Ensure the symptom_analysis table exists by creating it via raw SQL.
 * This avoids needing drizzle-kit push/migrate at deploy time.
 */
async function ensureTable(db: any) {
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
    // Create table if it doesn't exist
    await ensureTable(db);
    console.log("[Seed] symptom_analysis table ensured");

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

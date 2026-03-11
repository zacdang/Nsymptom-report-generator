import { getDb } from "./db";
import { symptomAnalysis } from "../drizzle/schema";
import { sql } from "drizzle-orm";
import seedData from "./symptom-analysis-seed.json";

/**
 * Seed the symptom_analysis table with data from the Excel report.
 * This runs on server startup and uses INSERT IGNORE to avoid duplicates.
 */
export async function seedSymptomAnalysis() {
  const db = await getDb();
  if (!db) {
    console.log("[Seed] Database not available, skipping symptom analysis seed");
    return;
  }

  try {
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

import { getDb } from "./db";
import { 
  questionnaireResponses, 
  questionnaireSymptoms, 
  questionnaireLifestyle,
} from "../drizzle/schema";
import { eq, like, desc } from "drizzle-orm";

export async function insertQuestionnaireResponse(data: {
  name: string;
  gender: string;
  ageRange: string;
  height?: string | null;
  weight?: string | null;
  waist?: string | null;
  bloodPressure?: string | null;
  bloodSugar?: string | null;
  bodyFat?: string | null;
  additionalNotes?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(questionnaireResponses).values(data);
  return result[0].insertId;
}

export async function insertQuestionnaireSymptoms(
  responseId: number,
  symptoms: Array<{ name: string; category: 'head' | 'body' | 'limbs' | 'mental' }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const values = symptoms.map(symptom => ({
    responseId,
    symptomName: symptom.name,
    category: symptom.category,
  }));
  
  await db.insert(questionnaireSymptoms).values(values);
}

export async function insertQuestionnaireLifestyle(
  responseId: number,
  data: Record<string, any>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(questionnaireLifestyle).values({
    responseId,
    ...data,
  });
}

export async function searchQuestionnaireByName(name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(questionnaireResponses)
    .where(like(questionnaireResponses.name, `%${name}%`))
    .orderBy(desc(questionnaireResponses.createdAt));
}

export async function getQuestionnaireResponse(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(questionnaireResponses)
    .where(eq(questionnaireResponses.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function getQuestionnaireSymptoms(responseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(questionnaireSymptoms)
    .where(eq(questionnaireSymptoms.responseId, responseId));
}

export async function getQuestionnaireLifestyle(responseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(questionnaireLifestyle)
    .where(eq(questionnaireLifestyle.responseId, responseId))
    .limit(1);
  
  return result[0] || null;
}

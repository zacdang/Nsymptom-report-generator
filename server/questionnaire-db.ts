import { db } from "./db";
import { 
  questionnaireResponses, 
  questionnaireSymptoms, 
  questionnaireLifestyle,
  type InsertQuestionnaireResponse,
  type InsertQuestionnaireSymptom,
  type InsertQuestionnaireLifestyle,
} from "../drizzle/schema";
import { eq, like } from "drizzle-orm";

export async function insertQuestionnaireResponse(data: Omit<InsertQuestionnaireResponse, 'id' | 'createdAt' | 'updatedAt'>) {
  const result = await db.insert(questionnaireResponses).values(data);
  return result[0].insertId;
}

export async function insertQuestionnaireSymptoms(
  responseId: number,
  symptoms: Array<{ name: string; category: 'head' | 'body' | 'limbs' | 'mental' }>
) {
  const values = symptoms.map(symptom => ({
    responseId,
    symptomName: symptom.name,
    category: symptom.category,
  }));
  
  await db.insert(questionnaireSymptoms).values(values);
}

export async function insertQuestionnaireLifestyle(
  responseId: number,
  data: Omit<InsertQuestionnaireLifestyle, 'id' | 'responseId'>
) {
  await db.insert(questionnaireLifestyle).values({
    responseId,
    ...data,
  });
}

export async function searchQuestionnaireByName(name: string) {
  return await db
    .select()
    .from(questionnaireResponses)
    .where(like(questionnaireResponses.name, `%${name}%`))
    .orderBy(questionnaireResponses.createdAt);
}

export async function getQuestionnaireResponse(id: number) {
  const result = await db
    .select()
    .from(questionnaireResponses)
    .where(eq(questionnaireResponses.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function getQuestionnaireSymptoms(responseId: number) {
  return await db
    .select()
    .from(questionnaireSymptoms)
    .where(eq(questionnaireSymptoms.responseId, responseId));
}

export async function getQuestionnaireLifestyle(responseId: number) {
  const result = await db
    .select()
    .from(questionnaireLifestyle)
    .where(eq(questionnaireLifestyle.responseId, responseId))
    .limit(1);
  
  return result[0] || null;
}

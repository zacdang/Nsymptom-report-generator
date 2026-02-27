import { eq, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, employees, Employee, InsertEmployee, symptoms, Symptom, InsertSymptom, reports, Report, InsertReport, reportTemplates } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: any | null = null;
let _pool: mysql.Pool | null = null;

// Lazily create the drizzle instance with connection pooling
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Create connection pool for better performance and reliability
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10,
        idleTimeout: 60000,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });
      
      // Test the connection
      const connection = await _pool.getConnection();
      connection.release();
      
      _db = drizzle(_pool);
      console.log("[Database] Connected successfully with connection pool");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      // Don't set _db to null here, throw the error so it can be handled
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  return _db;
}

// Gracefully close database connection
export async function closeDb() {
  if (_pool) {
    try {
      await _pool.end();
      console.log("[Database] Connection pool closed");
    } catch (error) {
      console.error("[Database] Error closing connection pool:", error);
    }
    _pool = null;
    _db = null;
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log("[Database] SIGTERM received, closing database connection...");
  await closeDb();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log("[Database] SIGINT received, closing database connection...");
  await closeDb();
  process.exit(0);
});

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Employee management functions
export async function getEmployeeByUsername(username: string): Promise<Employee | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(employees).where(eq(employees.username, username)).limit(1);
  return result[0];
}

export async function getEmployeeById(id: number): Promise<Employee | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return result[0];
}

export async function getAllEmployees(): Promise<Employee[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(employees);
}

export async function createEmployee(employee: InsertEmployee): Promise<Employee> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(employees).values(employee);
  return await getEmployeeById(Number(result[0].insertId)) as Employee;
}

export async function updateEmployee(id: number, updates: Partial<InsertEmployee>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(employees).set(updates).where(eq(employees.id, id));
}

export async function deleteEmployee(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(employees).where(eq(employees.id, id));
}

// Symptom management functions
export async function getAllSymptoms(): Promise<Symptom[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(symptoms).orderBy(asc(symptoms.displayOrder));
}

export async function getSymptomById(id: number): Promise<Symptom | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(symptoms).where(eq(symptoms.id, id)).limit(1);
  return result[0];
}

export async function getSymptomByName(name: string): Promise<Symptom | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(symptoms).where(eq(symptoms.name, name)).limit(1);
  return result[0];
}

export async function createSymptom(symptom: InsertSymptom): Promise<Symptom> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(symptoms).values(symptom);
  return await getSymptomById(Number(result[0].insertId)) as Symptom;
}

export async function updateSymptom(id: number, updates: Partial<InsertSymptom>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(symptoms).set(updates).where(eq(symptoms.id, id));
}

export async function deleteSymptom(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(symptoms).where(eq(symptoms.id, id));
}

// Report management functions
export async function getAllReports(): Promise<Report[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(reports).orderBy(desc(reports.createdAt));
}

export async function getReportsByEmployeeId(employeeId: number): Promise<Report[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(reports).where(eq(reports.employeeId, employeeId)).orderBy(desc(reports.createdAt));
}

export async function getReportById(id: number): Promise<Report | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  return result[0];
}

export async function createReport(report: InsertReport): Promise<Report> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reports).values(report);
  return await getReportById(Number(result[0].insertId)) as Report;
}

export async function updateReport(id: number, updates: Partial<InsertReport>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reports).set(updates).where(eq(reports.id, id));
}

export async function deleteReport(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(reports).where(eq(reports.id, id));
}

// Report template functions
export async function getReportTemplate() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(reportTemplates).limit(1);
  return result[0] || null;
}

export async function upsertReportTemplate(introParagraph: string, imageUrls: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getReportTemplate();
  const imageUrlsJson = JSON.stringify(imageUrls);
  
  if (existing) {
    await db.update(reportTemplates).set({ introParagraph, imageUrls: imageUrlsJson }).where(eq(reportTemplates.id, existing.id));
  } else {
    await db.insert(reportTemplates).values({ introParagraph, imageUrls: imageUrlsJson });
  }
}

// Re-export questionnaire database functions
export {
  insertQuestionnaireResponse,
  insertQuestionnaireSymptoms,
  insertQuestionnaireLifestyle,
  searchQuestionnaireByName,
  getQuestionnaireResponse,
  getQuestionnaireSymptoms,
  getQuestionnaireLifestyle,
} from "./questionnaire-db";

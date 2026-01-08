import bcrypt from "bcryptjs";
import { getEmployeeByUsername } from "./db";
import type { Employee } from "../drizzle/schema";

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Authenticate an employee with username and password
 * Returns the employee object if successful, null otherwise
 */
export async function authenticateEmployee(
  username: string,
  password: string
): Promise<Employee | null> {
  const employee = await getEmployeeByUsername(username);
  
  if (!employee) {
    return null;
  }
  
  const isValid = await verifyPassword(password, employee.passwordHash);
  
  if (!isValid) {
    return null;
  }
  
  return employee;
}

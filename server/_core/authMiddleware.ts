import { TRPCError } from "@trpc/server";
import cookie from "cookie";
import { verifyEmployeeToken } from "../employeeContext";
import * as db from "../db";
import { EMPLOYEE_COOKIE_NAME } from "../../shared/employeeConst";
import type { Employee } from "../../drizzle/schema";

/**
 * Middleware to verify employee authentication
 * Extracts and verifies the employee session token from cookies
 */
export async function requireEmployeeAuth(req: any): Promise<Employee> {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies[EMPLOYEE_COOKIE_NAME];
  
  if (!token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not logged in. Please log in to continue.",
    });
  }
  
  const payload = await verifyEmployeeToken(token);
  
  if (!payload) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired session. Please log in again.",
    });
  }
  
  const employee = await db.getEmployeeById(payload.employeeId);
  
  if (!employee) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Employee account not found.",
    });
  }
  
  return employee;
}

/**
 * Middleware to verify admin role
 * First verifies employee authentication, then checks for admin role
 */
export async function requireAdminAuth(req: any): Promise<Employee> {
  const employee = await requireEmployeeAuth(req);
  
  if (employee.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required. You do not have permission to perform this action.",
    });
  }
  
  return employee;
}

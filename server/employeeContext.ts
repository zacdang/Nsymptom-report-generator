import type { Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
// @ts-ignore - cookie package has type issues
import cookie from "cookie";
import { getEmployeeById } from "./db";
import type { Employee } from "../drizzle/schema";
import { EMPLOYEE_COOKIE_NAME, EMPLOYEE_SESSION_MAX_AGE } from "../shared/employeeConst";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key");

export type EmployeeContext = {
  req: Request;
  res: Response;
  employee: Employee | null;
};

/**
 * Create a JWT token for an employee session
 */
export async function createEmployeeToken(employeeId: number): Promise<string> {
  return await new SignJWT({ employeeId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Verify and decode an employee JWT token
 */
export async function verifyEmployeeToken(token: string): Promise<{ employeeId: number } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { employeeId: number };
  } catch {
    return null;
  }
}

/**
 * Set employee session cookie
 */
export function setEmployeeSessionCookie(res: Response, token: string) {
  res.setHeader(
    "Set-Cookie",
    // @ts-ignore - cookie package has type issues
    cookie.serialize(EMPLOYEE_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: EMPLOYEE_SESSION_MAX_AGE / 1000, // Convert to seconds
      path: "/",
    })
  );
}

/**
 * Clear employee session cookie
 */
export function clearEmployeeSessionCookie(res: Response) {
  res.setHeader(
    "Set-Cookie",
    // @ts-ignore - cookie package has type issues
    cookie.serialize(EMPLOYEE_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: -1,
      path: "/",
    })
  );
}

/**
 * Create employee context from request
 */
export async function createEmployeeContext(req: Request, res: Response): Promise<EmployeeContext> {
  // @ts-ignore - cookie package has type issues
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies[EMPLOYEE_COOKIE_NAME];

  let employee: Employee | null = null;

  if (token) {
    const payload = await verifyEmployeeToken(token);
    if (payload) {
      employee = (await getEmployeeById(payload.employeeId)) || null;
    }
  }

  return { req, res, employee };
}

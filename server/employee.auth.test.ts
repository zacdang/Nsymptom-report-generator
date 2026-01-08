import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { hashPassword } from "./auth";
import * as db from "./db";

type AuthenticatedEmployee = {
  id: number;
  username: string;
  name: string;
  role: "admin" | "employee";
};

function createMockContext(): { ctx: TrpcContext; clearedCookies: any[]; setCookies: any[] } {
  const clearedCookies: any[] = [];
  const setCookies: any[] = [];

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
      setHeader: (name: string, value: string) => {
        if (name === "Set-Cookie") {
          setCookies.push(value);
        }
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies, setCookies };
}

describe("Employee Authentication", () => {
  let testEmployee: AuthenticatedEmployee;

  beforeAll(async () => {
    // Create a test employee with unique username
    const uniqueUsername = `testemployee_${Date.now()}`;
    const passwordHash = await hashPassword("testpassword123");
    const employee = await db.createEmployee({
      username: uniqueUsername,
      passwordHash,
      name: "Test Employee",
      role: "employee",
    });
    testEmployee = {
      id: employee.id,
      username: employee.username,
      name: employee.name,
      role: employee.role,
    };
  });

  it("should successfully login with correct credentials", async () => {
    const { ctx, setCookies } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.employee.login({
      username: testEmployee.username,
      password: "testpassword123",
    });

    expect(result.success).toBe(true);
    expect(result.employee.username).toBe(testEmployee.username);
    expect(result.employee.name).toBe("Test Employee");
    expect(result.employee.role).toBe("employee");
    expect(setCookies.length).toBeGreaterThan(0);
  });

  it("should fail login with incorrect password", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.employee.login({
        username: testEmployee.username,
        password: "wrongpassword",
      })
    ).rejects.toThrow();
  });

  it("should fail login with non-existent username", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.employee.login({
        username: "nonexistent",
        password: "anypassword",
      })
    ).rejects.toThrow();
  });

  it("should successfully logout", async () => {
    const { ctx, setCookies } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.employee.logout();

    expect(result.success).toBe(true);
    // Logout sets a cookie with maxAge: -1 to clear it
    expect(setCookies.length).toBeGreaterThan(0);
  });
});

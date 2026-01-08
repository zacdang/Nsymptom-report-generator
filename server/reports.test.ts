import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { hashPassword } from "./auth";
import * as db from "./db";

function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      setHeader: () => {},
    } as TrpcContext["res"],
  };
}

describe("Report Management", () => {
  let testEmployeeId: number;

  beforeAll(async () => {
    // Create a test employee with unique username
    const uniqueUsername = `reporttester_${Date.now()}`;
    const passwordHash = await hashPassword("testpassword");
    const employee = await db.createEmployee({
      username: uniqueUsername,
      passwordHash,
      name: "Report Tester",
      role: "employee",
    });
    testEmployeeId = employee.id;

    // Create some test symptoms with unique names
    const uniqueSuffix = Date.now();
    try {
      await db.createSymptom({
        name: `头痛_${uniqueSuffix}`,
        longText: "头痛是指头部疼痛的症状，可能由多种原因引起。",
        displayOrder: 1,
      });
    } catch (e) {
      // Symptom might already exist, ignore
    }

    try {
      await db.createSymptom({
        name: `发烧_${uniqueSuffix}`,
        longText: "发烧是指体温升高超过正常范围的症状。",
        displayOrder: 2,
      });
    } catch (e) {
      // Symptom might already exist, ignore
    }
  });

  it("should create a new report", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const report = await caller.reports.create({
      employeeId: testEmployeeId,
      symptomInput: "头痛, 发烧",
      markdownContent: "# 测试报告\n\n这是一个测试报告。",
    });

    expect(report.employeeId).toBe(testEmployeeId);
    expect(report.symptomInput).toBe("头痛, 发烧");
    expect(report.markdownContent).toContain("测试报告");
  });

  it("should list reports for a specific employee", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const reports = await caller.reports.list({
      employeeId: testEmployeeId,
    });

    expect(Array.isArray(reports)).toBe(true);
    expect(reports.length).toBeGreaterThan(0);
    expect(reports[0]?.employeeId).toBe(testEmployeeId);
  });

  it("should get a specific report by id", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Create a report first
    const newReport = await caller.reports.create({
      employeeId: testEmployeeId,
      symptomInput: "头痛",
      markdownContent: "# 头痛报告",
    });

    // Get it by id
    const report = await caller.reports.get({
      id: newReport.id,
    });

    expect(report).toBeDefined();
    expect(report?.id).toBe(newReport.id);
  });

  it("should update a report", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Create a report first
    const newReport = await caller.reports.create({
      employeeId: testEmployeeId,
      symptomInput: "发烧",
      markdownContent: "# 原始内容",
    });

    // Update it
    const result = await caller.reports.update({
      id: newReport.id,
      markdownContent: "# 更新后的内容",
    });

    expect(result.success).toBe(true);
  });

  it("should delete a report", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Create a report first
    const newReport = await caller.reports.create({
      employeeId: testEmployeeId,
      symptomInput: "测试",
      markdownContent: "# 将被删除",
    });

    // Delete it
    const result = await caller.reports.delete({
      id: newReport.id,
    });

    expect(result.success).toBe(true);
  });
});

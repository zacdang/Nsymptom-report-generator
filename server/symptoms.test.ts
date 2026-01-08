import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

describe("Symptom Management", () => {
  it("should create a new symptom", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const uniqueName = `测试症状_${Date.now()}`;
    const symptom = await caller.admin.symptoms.create({
      name: uniqueName,
      longText: "这是一个测试症状的详细描述。",
      displayOrder: 1,
    });

    expect(symptom.name).toBe(uniqueName);
    expect(symptom.longText).toBe("这是一个测试症状的详细描述。");
    expect(symptom.displayOrder).toBe(1);
  });

  it("should list all symptoms", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const symptoms = await caller.admin.symptoms.list();

    expect(Array.isArray(symptoms)).toBe(true);
    expect(symptoms.length).toBeGreaterThan(0);
  });

  it("should update a symptom", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Create a symptom first with unique name
    const uniqueName = `更新测试_${Date.now()}`;
    const symptom = await caller.admin.symptoms.create({
      name: uniqueName,
      longText: "原始描述",
      displayOrder: 2,
    });

    // Update it
    const result = await caller.admin.symptoms.update({
      id: symptom.id,
      longText: "更新后的描述",
    });

    expect(result.success).toBe(true);
  });

  it("should delete a symptom", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Create a symptom first with unique name
    const uniqueName = `删除测试_${Date.now()}`;
    const symptom = await caller.admin.symptoms.create({
      name: uniqueName,
      longText: "将被删除的症状",
      displayOrder: 3,
    });

    // Delete it
    const result = await caller.admin.symptoms.delete({
      id: symptom.id,
    });

    expect(result.success).toBe(true);
  });
});

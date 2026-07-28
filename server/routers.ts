import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import * as db from "./db";
import { authenticateEmployee, hashPassword } from "./auth";
import { createEmployeeToken, setEmployeeSessionCookie, clearEmployeeSessionCookie, verifyEmployeeToken } from "./employeeContext";
import type { Employee } from "../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { employeeProcedure, adminProcedure } from "./_core/authProcedures";
import { EMPLOYEE_COOKIE_NAME } from "../shared/employeeConst";
import { ensureSummaryAdjustmentPlan } from "../shared/reportPlan";
// @ts-ignore - cookie package has type issues
import cookie from "cookie";

// Input validation schemas
const nameSchema = z.string().min(1, "Name is required").max(100);

const passwordSchema = z.string();

const bulkEmployeeRowSchema = z.object({
  name: z.string(),
  password: z.string(),
  sourceRowNumber: z.number().int().positive().optional(),
});

const normalizeEmployeeName = (name: string) =>
  name.replace(/[\u00a0\u3000]/g, " ").replace(/\s+/g, " ").trim();

const normalizeEmployeePassword = (password: string) =>
  password.replace(/[\u00a0\u3000]/g, " ").trim();

const makeUniqueEmployeeUsername = (name: string, usedUsernames: Set<string>) => {
  const base = name.slice(0, 100) || "employee";
  if (!usedUsernames.has(base)) {
    usedUsernames.add(base);
    return base;
  }

  for (let suffixNumber = 2; ; suffixNumber += 1) {
    const suffix = `_${suffixNumber}`;
    const candidate = `${base.slice(0, 100 - suffix.length)}${suffix}`;
    if (!usedUsernames.has(candidate)) {
      usedUsernames.add(candidate);
      return candidate;
    }
  }
};

type ActivityPeriodKey = "today" | "week" | "month" | "allTime";
type ActivityKind = "client" | "report";

type MutableActivityPeriodStats = {
  clientKeys: Set<string>;
  reportKeys: Set<string>;
  clientSubmissionCount: number;
  lastActivityAt: Date | null;
};

type MutableEmployeeActivityStats = {
  employeeId: number;
  name: string;
  role: "admin" | "employee";
  periods: Record<ActivityPeriodKey, MutableActivityPeriodStats>;
  lastActivityAt: Date | null;
  lastActivityType: ActivityKind | null;
  lastClientName: string | null;
};

const CHINA_TIME_OFFSET_MS = 8 * 60 * 60 * 1000;
const ACTIVITY_PERIOD_LABELS: Record<ActivityPeriodKey, string> = {
  today: "今日",
  week: "本周",
  month: "本月",
  allTime: "历史",
};

const normalizeActivityName = (name: string) =>
  normalizeEmployeeName(name).replace(/\s/g, "").toLocaleLowerCase("zh-CN");

const toValidDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const getChinaPeriodStarts = (now = new Date()) => {
  const shiftedNow = new Date(now.getTime() + CHINA_TIME_OFFSET_MS);
  const year = shiftedNow.getUTCFullYear();
  const month = shiftedNow.getUTCMonth();
  const date = shiftedNow.getUTCDate();
  const dayOfWeek = shiftedNow.getUTCDay() || 7;
  const chinaMidnightToUtcDate = (day: number) =>
    new Date(Date.UTC(year, month, day) - CHINA_TIME_OFFSET_MS);

  return {
    today: chinaMidnightToUtcDate(date),
    week: chinaMidnightToUtcDate(date - dayOfWeek + 1),
    month: new Date(Date.UTC(year, month, 1) - CHINA_TIME_OFFSET_MS),
    allTime: null,
  } satisfies Record<ActivityPeriodKey, Date | null>;
};

const createEmptyActivityPeriodStats = (): MutableActivityPeriodStats => ({
  clientKeys: new Set<string>(),
  reportKeys: new Set<string>(),
  clientSubmissionCount: 0,
  lastActivityAt: null,
});

const createEmptyEmployeeActivityStats = (employee: Employee): MutableEmployeeActivityStats => ({
  employeeId: employee.id,
  name: employee.name,
  role: employee.role,
  periods: {
    today: createEmptyActivityPeriodStats(),
    week: createEmptyActivityPeriodStats(),
    month: createEmptyActivityPeriodStats(),
    allTime: createEmptyActivityPeriodStats(),
  },
  lastActivityAt: null,
  lastActivityType: null,
  lastClientName: null,
});

const isSameOrAfter = (date: Date, start: Date | null) =>
  start === null || date.getTime() >= start.getTime();

const isLaterThan = (left: Date, right: Date | null) =>
  right === null || left.getTime() > right.getTime();

const parseReportClientName = (symptoms: unknown) => {
  if (typeof symptoms !== "string") return "";
  const match = symptoms.trim().match(/^\[问卷生成\]\s*(.+)$/);
  return match ? normalizeEmployeeName(match[1]) : "";
};

const getEmployeeActivityStats = async () => {
  const [employees, questionnaires, reports] = await Promise.all([
    db.getAllEmployees(),
    db.getAllQuestionnaireResponses(),
    db.getAllReports(),
  ]);
  const periodStarts = getChinaPeriodStarts();
  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
  const statsByEmployee = new Map(
    employees.map((employee) => [employee.id, createEmptyEmployeeActivityStats(employee)])
  );
  const recentEventByKey = new Map<string, {
    employeeId: number;
    employeeName: string;
    activityType: ActivityKind;
    clientName: string | null;
    occurredAt: Date;
  }>();

  const recordRecentEvent = (
    key: string,
    event: {
      employeeId: number;
      employeeName: string;
      activityType: ActivityKind;
      clientName: string | null;
      occurredAt: Date;
    }
  ) => {
    const existing = recentEventByKey.get(key);
    if (!existing || event.occurredAt.getTime() > existing.occurredAt.getTime()) {
      recentEventByKey.set(key, event);
    }
  };

  const updateLastActivity = (
    employeeStats: MutableEmployeeActivityStats,
    activityType: ActivityKind,
    clientName: string | null,
    occurredAt: Date
  ) => {
    if (isLaterThan(occurredAt, employeeStats.lastActivityAt)) {
      employeeStats.lastActivityAt = occurredAt;
      employeeStats.lastActivityType = activityType;
      employeeStats.lastClientName = clientName;
    }
  };

  questionnaires.forEach((questionnaire: any) => {
    const employeeId = questionnaire.employeeId;
    const employee = employeeById.get(employeeId);
    const employeeStats = statsByEmployee.get(employeeId);
    const occurredAt = toValidDate(questionnaire.createdAt);
    const clientName = normalizeEmployeeName(questionnaire.name ?? "");
    const clientKey = normalizeActivityName(clientName);

    if (!employee || !employeeStats || !occurredAt || !clientKey) return;
    if (clientKey === normalizeActivityName(employee.name)) return;

    (Object.keys(periodStarts) as ActivityPeriodKey[]).forEach((periodKey) => {
      if (!isSameOrAfter(occurredAt, periodStarts[periodKey])) return;
      const periodStats = employeeStats.periods[periodKey];
      periodStats.clientKeys.add(clientKey);
      periodStats.clientSubmissionCount += 1;
      if (isLaterThan(occurredAt, periodStats.lastActivityAt)) {
        periodStats.lastActivityAt = occurredAt;
      }
    });

    updateLastActivity(employeeStats, "client", clientName, occurredAt);
    recordRecentEvent(`client:${employee.id}:${clientKey}`, {
      employeeId: employee.id,
      employeeName: employee.name,
      activityType: "client",
      clientName,
      occurredAt,
    });
  });

  reports.forEach((report: any) => {
    const employeeId = report.employeeId;
    const employee = employeeById.get(employeeId);
    const employeeStats = statsByEmployee.get(employeeId);
    const occurredAt = toValidDate(report.createdAt);
    const clientName = parseReportClientName(report.symptoms);
    const clientKey = normalizeActivityName(clientName);

    if (!employee || !employeeStats || !occurredAt) return;
    if (clientKey && clientKey === normalizeActivityName(employee.name)) return;

    const reportKey = clientKey || `report:${report.id}`;
    (Object.keys(periodStarts) as ActivityPeriodKey[]).forEach((periodKey) => {
      if (!isSameOrAfter(occurredAt, periodStarts[periodKey])) return;
      const periodStats = employeeStats.periods[periodKey];
      periodStats.reportKeys.add(reportKey);
      if (isLaterThan(occurredAt, periodStats.lastActivityAt)) {
        periodStats.lastActivityAt = occurredAt;
      }
    });

    updateLastActivity(employeeStats, "report", clientName || null, occurredAt);
    recordRecentEvent(`report:${employee.id}:${reportKey}`, {
      employeeId: employee.id,
      employeeName: employee.name,
      activityType: "report",
      clientName: clientName || null,
      occurredAt,
    });
  });

  const finalizedEmployees = Array.from(statsByEmployee.values()).map((employeeStats) => {
    const periods = (Object.keys(employeeStats.periods) as ActivityPeriodKey[]).reduce((acc, periodKey) => {
      const periodStats = employeeStats.periods[periodKey];
      const uniqueClientCount = periodStats.clientKeys.size;
      const reportCount = periodStats.reportKeys.size;
      acc[periodKey] = {
        uniqueClientCount,
        reportCount,
        clientSubmissionCount: periodStats.clientSubmissionCount,
        activityScore: uniqueClientCount + reportCount,
        lastActivityAt: periodStats.lastActivityAt,
      };
      return acc;
    }, {} as Record<ActivityPeriodKey, {
      uniqueClientCount: number;
      reportCount: number;
      clientSubmissionCount: number;
      activityScore: number;
      lastActivityAt: Date | null;
    }>);

    return {
      employeeId: employeeStats.employeeId,
      name: employeeStats.name,
      role: employeeStats.role,
      periods,
      lastActivityAt: employeeStats.lastActivityAt,
      lastActivityType: employeeStats.lastActivityType,
      lastClientName: employeeStats.lastClientName,
    };
  });

  const rankEmployees = (periodKey: ActivityPeriodKey) =>
    finalizedEmployees
      .filter((employee) => employee.periods[periodKey].activityScore > 0)
      .sort((a, b) => {
        const periodA = a.periods[periodKey];
        const periodB = b.periods[periodKey];
        return (
          periodB.activityScore - periodA.activityScore ||
          periodB.uniqueClientCount - periodA.uniqueClientCount ||
          periodB.reportCount - periodA.reportCount ||
          (b.lastActivityAt?.getTime() ?? 0) - (a.lastActivityAt?.getTime() ?? 0)
        );
      })
      .slice(0, 5)
      .map((employee) => ({
        employeeId: employee.employeeId,
        name: employee.name,
        role: employee.role,
        ...employee.periods[periodKey],
      }));

  const topReportGenerators = finalizedEmployees
    .filter((employee) => employee.periods.allTime.reportCount > 0)
    .sort((a, b) => {
      const periodA = a.periods.allTime;
      const periodB = b.periods.allTime;
      return (
        periodB.reportCount - periodA.reportCount ||
        periodB.uniqueClientCount - periodA.uniqueClientCount ||
        (b.lastActivityAt?.getTime() ?? 0) - (a.lastActivityAt?.getTime() ?? 0)
      );
    })
    .slice(0, 8)
    .map((employee) => ({
      employeeId: employee.employeeId,
      name: employee.name,
      role: employee.role,
      ...employee.periods.allTime,
    }));

  const getPeriodActivityScore = (periodKey: ActivityPeriodKey) =>
    finalizedEmployees.reduce(
      (total, employee) => total + employee.periods[periodKey].activityScore,
      0
    );

  const recentActivity = Array.from(recentEventByKey.values())
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, 8);

  const allTimeTotals = finalizedEmployees.reduce(
    (totals, employee) => {
      totals.uniqueClientCount += employee.periods.allTime.uniqueClientCount;
      totals.reportCount += employee.periods.allTime.reportCount;
      return totals;
    },
    { uniqueClientCount: 0, reportCount: 0 }
  );

  return {
    totals: {
      members: employees.length,
      admins: employees.filter((employee) => employee.role === "admin").length,
      employees: employees.filter((employee) => employee.role === "employee").length,
      uniqueClientCount: allTimeTotals.uniqueClientCount,
      reportCount: allTimeTotals.reportCount,
    },
    periods: {
      today: {
        label: ACTIVITY_PERIOD_LABELS.today,
        activeMembers: finalizedEmployees.filter((employee) => employee.periods.today.activityScore > 0).length,
        activityScore: getPeriodActivityScore("today"),
        leaders: rankEmployees("today"),
      },
      week: {
        label: ACTIVITY_PERIOD_LABELS.week,
        activeMembers: finalizedEmployees.filter((employee) => employee.periods.week.activityScore > 0).length,
        activityScore: getPeriodActivityScore("week"),
        leaders: rankEmployees("week"),
      },
      month: {
        label: ACTIVITY_PERIOD_LABELS.month,
        activeMembers: finalizedEmployees.filter((employee) => employee.periods.month.activityScore > 0).length,
        activityScore: getPeriodActivityScore("month"),
        leaders: rankEmployees("month"),
      },
      allTime: {
        label: ACTIVITY_PERIOD_LABELS.allTime,
        activeMembers: finalizedEmployees.filter((employee) => employee.periods.allTime.activityScore > 0).length,
        activityScore: getPeriodActivityScore("allTime"),
        leaders: rankEmployees("allTime"),
      },
    },
    topReportGenerators,
    recentActivity,
  };
};

const symptomNameSchema = z.string()
  .trim()
  .min(1, "Symptom name is required")
  .max(200, "Symptom name too long");

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Employee authentication router
  employee: router({
    login: publicProcedure
      .input(z.object({ 
        name: z.string(), 
        password: z.string() // Don't validate password on login, only on creation
      }))
      .mutation(async ({ input, ctx }) => {
        const employee = await authenticateEmployee(
          normalizeEmployeeName(input.name),
          normalizeEmployeePassword(input.password)
        );
        
        if (!employee) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "姓名或密码错误",
          });
        }
        
        const token = await createEmployeeToken(employee.id);
        setEmployeeSessionCookie(ctx.req, ctx.res, token);
        
        return {
          success: true,
          employee: {
            id: employee.id,
            name: employee.name,
            role: employee.role,
          },
        };
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      clearEmployeeSessionCookie(ctx.req, ctx.res);
      return { success: true };
    }),
    
    me: publicProcedure.query(async ({ ctx }) => {
      // Get employee from cookie
      const cookies = cookie.parse(ctx.req.headers.cookie || "");
      const token = cookies[EMPLOYEE_COOKIE_NAME];
      
      if (!token) {
        return null;
      }
      
      const { verifyEmployeeToken } = await import("./employeeContext");
      const payload = await verifyEmployeeToken(token);
      
      if (!payload) {
        return null;
      }
      
      const employee = await db.getEmployeeById(payload.employeeId);
      
      if (!employee) {
        return null;
      }
      
      return {
        id: employee.id,
        name: employee.name,
        role: employee.role,
      };
    }),
  }),
  
  // Admin router for managing symptoms and employees - NOW WITH AUTH!
  admin: router({
    // Symptom management
    symptoms: router({
      list: employeeProcedure.query(async () => {
        return await db.getAllSymptoms();
      }),
      
      create: adminProcedure
        .input(z.object({
          name: symptomNameSchema,
          longText: z.string().min(1, "Description is required"),
          displayOrder: z.number().int().min(0),
        }))
        .mutation(async ({ input }) => {
          return await db.createSymptom(input);
        }),
      
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          name: symptomNameSchema.optional(),
          longText: z.string().optional(),
          displayOrder: z.number().int().min(0).optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          await db.updateSymptom(id, updates);
          return { success: true };
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteSymptom(input.id);
          return { success: true };
        }),
    }),
    
    // Symptom Analysis knowledge base management
    symptomAnalysis: router({
      list: employeeProcedure.query(async () => {
        return await db.getAllSymptomAnalysis();
      }),

      create: adminProcedure
        .input(z.object({
          groupLabel: z.string().min(1),
          symptomNames: z.string().min(1),
          analysisText: z.string().min(1),
          category: z.string().min(1),
          subCategory: z.string().min(1),
          displayOrder: z.number().int().min(0),
        }))
        .mutation(async ({ input }) => {
          return await db.createSymptomAnalysis(input);
        }),

      update: adminProcedure
        .input(z.object({
          id: z.number(),
          groupLabel: z.string().optional(),
          symptomNames: z.string().optional(),
          analysisText: z.string().optional(),
          category: z.string().optional(),
          subCategory: z.string().optional(),
          displayOrder: z.number().int().min(0).optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          await db.updateSymptomAnalysis(id, updates);
          return { success: true };
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteSymptomAnalysis(input.id);
          return { success: true };
        }),
    }),

    // Employee management
    employees: router({
      list: adminProcedure.query(async () => {
        return await db.getAllEmployees();
      }),

      activityStats: adminProcedure.query(async () => {
        return await getEmployeeActivityStats();
      }),
      
      create: adminProcedure
        .input(z.object({
          password: passwordSchema,
          name: z.string().min(1, "Name is required").max(100),
          role: z.enum(["admin", "employee"]),
        }))
        .mutation(async ({ input }) => {
          const name = normalizeEmployeeName(input.name);
          const password = normalizeEmployeePassword(input.password);
          if (!name) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "姓名不能为空",
            });
          }

          if (!password) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "密码不能为空",
            });
          }

          const employees = await db.getAllEmployees();
          const existingNames = new Set(employees.map((employee) => normalizeEmployeeName(employee.name)));
          if (existingNames.has(name)) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "该姓名已存在",
            });
          }
          
          const usedUsernames = new Set(employees.map((employee) => employee.username));
          const passwordHash = await hashPassword(password);
          return await db.createEmployee({
            username: makeUniqueEmployeeUsername(name, usedUsernames),
            passwordHash,
            name,
            role: input.role,
          });
        }),

      bulkCreate: adminProcedure
        .input(z.object({
          rows: z.array(bulkEmployeeRowSchema).min(1).max(1000),
        }))
        .mutation(async ({ input }) => {
          const invalidRows: Array<{ sourceRowNumber: number; reason: string }> = [];
          const dedupedRows = new Map<string, {
            name: string;
            password: string;
            sourceRowNumber: number;
            occurrences: number;
          }>();
          const passwordConflictNames = new Set<string>();

          input.rows.forEach((row, index) => {
            const sourceRowNumber = row.sourceRowNumber ?? index + 1;
            const name = normalizeEmployeeName(row.name);
            const password = normalizeEmployeePassword(row.password);

            if (!name || !password) {
              invalidRows.push({
                sourceRowNumber,
                reason: "姓名或密码为空",
              });
              return;
            }

            if (name.length > 100) {
              invalidRows.push({
                sourceRowNumber,
                reason: "姓名过长",
              });
              return;
            }

            const existing = dedupedRows.get(name);
            if (existing) {
              if (existing.password !== password) {
                passwordConflictNames.add(name);
              }
              dedupedRows.set(name, {
                name,
                password,
                sourceRowNumber,
                occurrences: existing.occurrences + 1,
              });
              return;
            }

            dedupedRows.set(name, {
              name,
              password,
              sourceRowNumber,
              occurrences: 1,
            });
          });

          const employees = await db.getAllEmployees();
          const existingNames = new Set(employees.map((employee) => normalizeEmployeeName(employee.name)));
          const usedUsernames = new Set(employees.map((employee) => employee.username));
          const created: Array<{ id: number; name: string; role: "admin" | "employee" }> = [];
          const skippedExisting: string[] = [];

          for (const row of Array.from(dedupedRows.values())) {
            if (existingNames.has(row.name)) {
              skippedExisting.push(row.name);
              continue;
            }

            const passwordHash = await hashPassword(row.password);
            const employee = await db.createEmployee({
              username: makeUniqueEmployeeUsername(row.name, usedUsernames),
              passwordHash,
              name: row.name,
              role: "employee",
            });

            created.push({
              id: employee.id,
              name: employee.name,
              role: employee.role,
            });
            existingNames.add(row.name);
          }

          const duplicateInputRows = Array.from(dedupedRows.values())
            .reduce((total, row) => total + row.occurrences - 1, 0);

          return {
            success: true,
            inputRows: input.rows.length,
            validRows: input.rows.length - invalidRows.length,
            uniqueNames: dedupedRows.size,
            duplicateInputRows,
            passwordConflictNames: Array.from(passwordConflictNames),
            created,
            skippedExisting,
            invalidRows,
          };
        }),
      
      resetPassword: adminProcedure
        .input(z.object({
          id: z.number(),
          newPassword: passwordSchema,
        }))
        .mutation(async ({ input }) => {
          const newPassword = normalizeEmployeePassword(input.newPassword);
          if (!newPassword) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "密码不能为空",
            });
          }

          const passwordHash = await hashPassword(newPassword);
          await db.updateEmployee(input.id, { passwordHash });
          return { success: true };
        }),
      
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          // Prevent deleting yourself
          if (input.id === ctx.employee.id) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot delete your own account",
            });
          }
          
          await db.deleteEmployee(input.id);
          return { success: true };
        }),
    }),
  }),
  
  // Reports router - NOW WITH AUTH!
  reports: router({
    list: employeeProcedure
      .input(z.object({ employeeId: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        // Employees can only see their own reports
        // Admins can see all reports or filter by employee
        if (ctx.employee.role === "admin") {
          if (input.employeeId) {
            return await db.getReportsByEmployeeId(input.employeeId);
          }
          return await db.getAllReports();
        } else {
          // Non-admin employees can only see their own reports
          return await db.getReportsByEmployeeId(ctx.employee.id);
        }
      }),
    
    get: employeeProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const report = await db.getReportById(input.id);
        
        if (!report) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Report not found",
          });
        }
        
        // Check if employee has permission to view this report
        if (ctx.employee.role !== "admin" && report.employeeId !== ctx.employee.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to view this report",
          });
        }
        
        return report;
      }),
    
    create: employeeProcedure
      .input(z.object({
        employeeId: z.number(),
        symptoms: z.string().min(1, "Symptom input is required"),
        generatedText: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Employees can only create reports for themselves
        if (ctx.employee.role !== "admin" && input.employeeId !== ctx.employee.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only create reports for yourself",
          });
        }
        
        return await db.createReport(input);
      }),
    
    update: employeeProcedure
      .input(z.object({
        id: z.number(),
        generatedText: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const report = await db.getReportById(input.id);
        
        if (!report) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Report not found",
          });
        }
        
        // Check if employee has permission to update this report
        if (ctx.employee.role !== "admin" && report.employeeId !== ctx.employee.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to update this report",
          });
        }
        
        await db.updateReport(input.id, { generatedText: input.generatedText });
        return { success: true };
      }),
    
    delete: employeeProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const report = await db.getReportById(input.id);
        
        if (!report) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Report not found",
          });
        }
        
        // Check if employee has permission to delete this report
        if (ctx.employee.role !== "admin" && report.employeeId !== ctx.employee.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to delete this report",
          });
        }
        
        await db.deleteReport(input.id);
        return { success: true };
      }),
  }),

  // Questionnaire router - Public access for questionnaire submission
  questionnaire: router({
    submit: publicProcedure
      .input(z.object({
        // Employee binding
        employeeName: z.string().min(1, "负责人是必填项"),
        // Basic info
        name: z.string().min(1, "Name is required"),
        gender: z.enum(["male", "female"]),
        ageRange: z.string().min(1, "Age range is required"),
        height: z.string().optional(),
        weight: z.string().optional(),
        waist: z.string().optional(),
        bloodPressure: z.string().optional(),
        bloodSugar: z.string().optional(),
        bodyFat: z.string().optional(),
        
        // Symptoms
        selectedSymptoms: z.array(z.object({
          name: z.string(),
          category: z.enum(["head", "body", "limbs", "mental"]),
        })),
        
        // Lifestyle
        exerciseParticipation: z.string().optional(),
        exerciseType: z.string().optional(),
        exerciseFrequency: z.string().optional(),
        wakeTime: z.string().optional(),
        napTime: z.string().optional(),
        sleepTime: z.string().optional(),
        hungriestTime: z.string().optional(),
        mostTiredTime: z.string().optional(),
        lifestyleHabits: z.array(z.string()).optional(),
        breakfastTime: z.string().optional(),
        breakfastHas: z.string().optional(),
        lunchTime: z.string().optional(),
        lunchHas: z.string().optional(),
        dinnerTime: z.string().optional(),
        dinnerHas: z.string().optional(),
        lateNightSnackTime: z.string().optional(),
        lateNightSnackHas: z.string().optional(),
        dietaryPreferences: z.array(z.string()).optional(),
        unsuitableFoods: z.string().optional(),
        fruitFrequency: z.string().optional(),
        coarseGrainFrequency: z.string().optional(),
        workEnvironment: z.array(z.string()).optional(),
        medicationsAllergies: z.string().optional(),
        medicalHistory: z.array(z.string()).optional(),
        additionalNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Validate employee name
        const employee = await db.getEmployeeByName(input.employeeName);
        if (!employee) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `未找到负责人 "${input.employeeName}"，请确认姓名是否正确`,
          });
        }

        // Insert questionnaire response with employee binding
        const responseId = await db.insertQuestionnaireResponse({
          employeeId: employee.id,
          name: input.name,
          gender: input.gender,
          ageRange: input.ageRange,
          height: input.height,
          weight: input.weight,
          waist: input.waist,
          bloodPressure: input.bloodPressure,
          bloodSugar: input.bloodSugar,
          bodyFat: input.bodyFat,
          additionalNotes: input.additionalNotes,
        });
        
        // Insert selected symptoms
        if (input.selectedSymptoms && input.selectedSymptoms.length > 0) {
          await db.insertQuestionnaireSymptoms(
            responseId,
            input.selectedSymptoms
          );
        }
        
        // Insert lifestyle data
        await db.insertQuestionnaireLifestyle(responseId, {
          exerciseParticipation: input.exerciseParticipation,
          exerciseType: input.exerciseType,
          exerciseFrequency: input.exerciseFrequency,
          wakeTime: input.wakeTime,
          napTime: input.napTime,
          sleepTime: input.sleepTime,
          hungriestTime: input.hungriestTime,
          mostTiredTime: input.mostTiredTime,
          lifestyleHabits: input.lifestyleHabits ? JSON.stringify(input.lifestyleHabits) : null,
          breakfastTime: input.breakfastTime,
          breakfastHas: input.breakfastHas,
          lunchTime: input.lunchTime,
          lunchHas: input.lunchHas,
          dinnerTime: input.dinnerTime,
          dinnerHas: input.dinnerHas,
          lateNightSnackTime: input.lateNightSnackTime,
          lateNightSnackHas: input.lateNightSnackHas,
          dietaryPreferences: input.dietaryPreferences ? JSON.stringify(input.dietaryPreferences) : null,
          unsuitableFoods: input.unsuitableFoods,
          fruitFrequency: input.fruitFrequency,
          coarseGrainFrequency: input.coarseGrainFrequency,
          workEnvironment: input.workEnvironment ? JSON.stringify(input.workEnvironment) : null,
          medicationsAllergies: input.medicationsAllergies,
          medicalHistory: input.medicalHistory ? JSON.stringify(input.medicalHistory) : null,
        });
        
        return { success: true, responseId };
      }),
    
    // Get all customers bound to the current employee
    myCustomers: employeeProcedure
      .query(async ({ ctx }) => {
        if (ctx.employee.role === "admin") {
          // Admin can see all questionnaires
          return await db.searchQuestionnaireByName("");
        }
        return await db.getQuestionnairesByEmployeeId(ctx.employee.id);
      }),

    // Admin: get questionnaires by specific employee ID
    byEmployeeId: adminProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getQuestionnairesByEmployeeId(input.employeeId);
      }),

    search: employeeProcedure
      .input(z.object({ name: z.string().min(1, "Name is required") }))
      .query(async ({ input, ctx }) => {
        // Admin can search all, employees can only search their own
        if (ctx.employee.role === "admin") {
          return await db.searchQuestionnaireByName(input.name);
        }
        const myCustomers = await db.getQuestionnairesByEmployeeId(ctx.employee.id);
        return myCustomers.filter((c: any) => c.name.includes(input.name));
      }),
    
    get: employeeProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const response = await db.getQuestionnaireResponse(input.id);
        if (!response) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Questionnaire response not found",
          });
        }
        
        const symptoms = await db.getQuestionnaireSymptoms(input.id);
        const lifestyle = await db.getQuestionnaireLifestyle(input.id);
        
        return {
          ...response,
          symptoms,
          lifestyle,
        };
      }),

    // Admin-only delete questionnaire response
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const response = await db.getQuestionnaireResponse(input.id);
        if (!response) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "问卷记录不存在",
          });
        }
        await db.deleteQuestionnaireResponse(input.id);
        return { success: true };
      }),

    generateReport: employeeProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const response = await db.getQuestionnaireResponse(input.id);
        if (!response) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Questionnaire response not found",
          });
        }

        const symptoms = await db.getQuestionnaireSymptoms(input.id);
        const lifestyle = await db.getQuestionnaireLifestyle(input.id);

        // Collect all symptom/lifestyle/medical names
        const symptomNames = symptoms.map((s: any) => s.symptomName);
        const lifestyleHabits: string[] = lifestyle?.lifestyleHabits ? JSON.parse(lifestyle.lifestyleHabits) : [];
        const dietaryPrefs: string[] = lifestyle?.dietaryPreferences ? JSON.parse(lifestyle.dietaryPreferences) : [];
        const workEnv: string[] = lifestyle?.workEnvironment ? JSON.parse(lifestyle.workEnvironment) : [];
        const medicalHistory: string[] = lifestyle?.medicalHistory ? JSON.parse(lifestyle.medicalHistory) : [];

        const allNames = [...symptomNames, ...lifestyleHabits, ...dietaryPrefs, ...workEnv, ...medicalHistory];

        // Match against symptom_analysis table
        const matchedAnalysis = await db.getSymptomAnalysisByNames(allNames);

        // Get report template
        const template = await db.getReportTemplate();

        // Build markdown report
        let markdown = `# ${response.name} \u2014 \u4f53\u8d28\u89e3\u6790\u62a5\u544a\n\n`;

        if (template?.templateText) {
          markdown += `${template.templateText}\n\n`;
        }

        markdown += `## \u57fa\u672c\u4fe1\u606f\n\n`;
        markdown += `- **\u59d3\u540d**\uff1a${response.name}\n`;
        markdown += `- **\u6027\u522b**\uff1a${response.gender === 'male' ? '\u7537' : '\u5973'}\n`;
        markdown += `- **\u5e74\u9f84\u8303\u56f4**\uff1a${response.ageRange}\n`;
        if (response.height) markdown += `- **\u8eab\u9ad8**\uff1a${response.height} cm\n`;
        if (response.weight) markdown += `- **\u4f53\u91cd**\uff1a${response.weight} kg\n`;
        if (response.waist) markdown += `- **\u8170\u56f4**\uff1a${response.waist} cm\n`;
        if (response.bloodPressure) markdown += `- **\u8840\u538b**\uff1a${response.bloodPressure}\n`;
        if (response.bloodSugar) markdown += `- **\u8840\u7cd6**\uff1a${response.bloodSugar}\n`;
        if (response.bodyFat) markdown += `- **\u4f53\u8102\u7387**\uff1a${response.bodyFat}%\n`;
        markdown += `\n`;

        if (symptomNames.length > 0) {
          markdown += `## \u9009\u62e9\u7684\u75c7\u72b6\n\n`;
          markdown += symptomNames.join('\u3001') + `\n\n`;
        }

        const symptomAnalysisEntries = matchedAnalysis.filter((a: any) => a.category === 'symptom');
        if (symptomAnalysisEntries.length > 0) {
          markdown += `## \u75c7\u72b6\u89e3\u6790\n\n`;
          for (const entry of symptomAnalysisEntries) {
            markdown += `### ${entry.groupLabel}\n\n`;
            markdown += `${entry.analysisText}\n\n`;
          }
        }

        const lifestyleAnalysis = matchedAnalysis.filter((a: any) => ['lifestyle', 'dietary', 'dietary_text', 'work'].includes(a.category));
        if (lifestyleAnalysis.length > 0) {
          markdown += `## \u751f\u6d3b\u4e60\u60ef\u89e3\u6790\n\n`;
          for (const entry of lifestyleAnalysis) {
            markdown += `### ${entry.groupLabel}\n\n`;
            markdown += `${entry.analysisText}\n\n`;
          }
        }

        const medicalAnalysis = matchedAnalysis.filter((a: any) => a.category === 'medical');
        if (medicalAnalysis.length > 0) {
          markdown += `## \u65e2\u5f80\u75c5\u53f2\u89e3\u6790\n\n`;
          for (const entry of medicalAnalysis) {
            markdown += `### ${entry.groupLabel}\n\n`;
            markdown += `${entry.analysisText}\n\n`;
          }
        }

        if (response.additionalNotes) {
          markdown += `## \u8865\u5145\u8bf4\u660e\n\n`;
          markdown += `${response.additionalNotes}\n\n`;
        }

        markdown = ensureSummaryAdjustmentPlan(markdown);

        return { success: true, markdown, matchedCount: matchedAnalysis.length };
      }),
  }),

  // Symptom analysis knowledge base router
  symptomAnalysis: router({
    list: employeeProcedure.query(async () => {
      return await db.getAllSymptomAnalysis();
    }),
  }),
});

export type AppRouter = typeof appRouter;

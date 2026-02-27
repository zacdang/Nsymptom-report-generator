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
// @ts-ignore - cookie package has type issues
import cookie from "cookie";

// Input validation schemas
const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(50, "Username must be less than 50 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, _ and -");

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be less than 100 characters");

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
        username: usernameSchema, 
        password: z.string() // Don't validate password on login, only on creation
      }))
      .mutation(async ({ input, ctx }) => {
        const employee = await authenticateEmployee(input.username, input.password);
        
        if (!employee) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid username or password",
          });
        }
        
        const token = await createEmployeeToken(employee.id);
        setEmployeeSessionCookie(ctx.res, token);
        
        return {
          success: true,
          employee: {
            id: employee.id,
            username: employee.username,
            name: employee.name,
            role: employee.role,
          },
        };
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      clearEmployeeSessionCookie(ctx.res);
      return { success: true };
    }),
    
    me: publicProcedure.query(async ({ ctx }) => {
      // Get employee from cookie
      const cookies = cookie.parse(ctx.req.headers.cookie || "");
      const token = cookies["employee_session"];
      
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
        username: employee.username,
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
    
    // Employee management
    employees: router({
      list: adminProcedure.query(async () => {
        return await db.getAllEmployees();
      }),
      
      create: adminProcedure
        .input(z.object({
          username: usernameSchema,
          password: passwordSchema,
          name: z.string().min(1, "Name is required").max(100),
          role: z.enum(["admin", "employee"]),
        }))
        .mutation(async ({ input }) => {
          // Check if username already exists
          const existing = await db.getEmployeeByUsername(input.username);
          if (existing) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Username already exists",
            });
          }
          
          const passwordHash = await hashPassword(input.password);
          return await db.createEmployee({
            username: input.username,
            passwordHash,
            name: input.name,
            role: input.role,
          });
        }),
      
      resetPassword: adminProcedure
        .input(z.object({
          id: z.number(),
          newPassword: passwordSchema,
        }))
        .mutation(async ({ input }) => {
          const passwordHash = await hashPassword(input.newPassword);
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
        symptomInput: z.string().min(1, "Symptom input is required"),
        markdownContent: z.string().min(1, "Report content is required"),
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
        markdownContent: z.string().min(1, "Report content is required"),
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
        
        await db.updateReport(input.id, { markdownContent: input.markdownContent });
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
});

export type AppRouter = typeof appRouter;

  // Questionnaire router - Public access for questionnaire submission
  questionnaire: router({
    submit: publicProcedure
      .input(z.object({
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
        // Insert questionnaire response
        const responseId = await db.insertQuestionnaireResponse({
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
    
    search: employeeProcedure
      .input(z.object({ name: z.string().min(1, "Name is required") }))
      .query(async ({ input }) => {
        return await db.searchQuestionnaireByName(input.name);
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
  }),

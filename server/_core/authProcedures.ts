import { publicProcedure } from "./trpc";
import { requireEmployeeAuth, requireAdminAuth } from "./authMiddleware";

/**
 * Procedure that requires employee authentication
 * Can be used by both employees and admins
 */
export const employeeProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const employee = await requireEmployeeAuth(ctx.req);
  
  return next({
    ctx: {
      ...ctx,
      employee,
    },
  });
});

/**
 * Procedure that requires admin authentication
 * Can only be used by admins
 */
export const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const employee = await requireAdminAuth(ctx.req);
  
  return next({
    ctx: {
      ...ctx,
      employee,
      admin: employee, // Alias for clarity
    },
  });
});

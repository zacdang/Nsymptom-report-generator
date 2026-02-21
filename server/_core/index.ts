import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { generatePDF } from "../pdfGenerator";
import { requireEmployeeAuth } from "./authMiddleware";
import cookie from "cookie";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Trust proxy for Railway deployment
  app.set('trust proxy', 1);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Rate limiting configuration
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
  });
  
  const pdfLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // 10 PDF generations per minute
    message: 'Too many PDF generation requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  // Apply rate limiting to API routes
  app.use('/api/', apiLimiter);
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // PDF generation endpoint with authentication and rate limiting
  app.post("/api/generate-pdf", 
    pdfLimiter,
    express.json(), 
    async (req, res) => {
      try {
        // Verify employee authentication
        try {
          await requireEmployeeAuth(req);
        } catch (authError) {
          return res.status(401).json({ 
            error: authError instanceof Error ? authError.message : 'Authentication required' 
          });
        }
        
        const { markdownContent } = req.body;
        
        // Validate input
        if (!markdownContent || typeof markdownContent !== 'string') {
          return res.status(400).json({ error: "Invalid markdownContent" });
        }
        
        // Check content length (prevent abuse)
        if (markdownContent.length > 100000) { // 100KB limit
          return res.status(400).json({ error: "Content too large (max 100KB)" });
        }
        
        // Set timeout for PDF generation
        const pdfBuffer = await Promise.race([
          generatePDF(markdownContent),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('PDF generation timeout')), 30000)
          )
        ]);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report-${Date.now()}.pdf"`);
        res.send(pdfBuffer);
      } catch (error) {
        console.error('PDF generation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';
        res.status(500).json({ error: errorMessage });
      }
    }
  );
  
  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const db = await getDb();
      const dbHealthy = db !== null;
      
      res.status(dbHealthy ? 200 : 503).json({
        status: dbHealthy ? 'healthy' : 'unhealthy',
        database: dbHealthy ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        database: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`Health check available at http://localhost:${port}/health`);
  });
}

startServer().catch(console.error);

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
import { seedSymptomAnalysis } from "../seed-analysis";
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
  
  // Generate report from questionnaire endpoint
  app.post("/api/generate-report",
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

        const { questionnaireId } = req.body;
        if (!questionnaireId || typeof questionnaireId !== 'number') {
          return res.status(400).json({ error: "Invalid questionnaireId" });
        }

        const { getQuestionnaireResponse, getQuestionnaireSymptoms, getQuestionnaireLifestyle, getSymptomAnalysisByNames, getReportTemplate } = await import("../db");

        // Get questionnaire data
        const response = await getQuestionnaireResponse(questionnaireId);
        if (!response) {
          return res.status(404).json({ error: "Questionnaire not found" });
        }

        const symptoms = await getQuestionnaireSymptoms(questionnaireId);
        const lifestyle = await getQuestionnaireLifestyle(questionnaireId);

        // Collect all symptom/lifestyle/medical names
        const symptomNames = symptoms.map((s: any) => s.symptomName);
        const lifestyleHabits: string[] = lifestyle?.lifestyleHabits ? JSON.parse(lifestyle.lifestyleHabits) : [];
        const dietaryPrefs: string[] = lifestyle?.dietaryPreferences ? JSON.parse(lifestyle.dietaryPreferences) : [];
        const workEnv: string[] = lifestyle?.workEnvironment ? JSON.parse(lifestyle.workEnvironment) : [];
        const medicalHistory: string[] = lifestyle?.medicalHistory ? JSON.parse(lifestyle.medicalHistory) : [];

        // Combine all names for matching
        const allNames = [...symptomNames, ...lifestyleHabits, ...dietaryPrefs, ...workEnv, ...medicalHistory];

        // Match against symptom_analysis table
        const matchedAnalysis = await getSymptomAnalysisByNames(allNames);

        // Get report template
        const template = await getReportTemplate();

        // Build markdown report
        let markdown = `# ${response.name} — 体质解析报告\n\n`;

        // Add intro paragraph from template if available
        if (template?.templateText) {
          markdown += `${template.templateText}\n\n`;
        }

        // Basic info section
        markdown += `## 基本信息\n\n`;
        markdown += `- **姓名**：${response.name}\n`;
        markdown += `- **性别**：${response.gender === 'male' ? '男' : '女'}\n`;
        markdown += `- **年龄范围**：${response.ageRange}\n`;
        if (response.height) markdown += `- **身高**：${response.height} cm\n`;
        if (response.weight) markdown += `- **体重**：${response.weight} kg\n`;
        if (response.waist) markdown += `- **腰围**：${response.waist} cm\n`;
        if (response.bloodPressure) markdown += `- **血压**：${response.bloodPressure}\n`;
        if (response.bloodSugar) markdown += `- **血糖**：${response.bloodSugar}\n`;
        if (response.bodyFat) markdown += `- **体脂率**：${response.bodyFat}%\n`;
        markdown += `\n`;

        // Selected symptoms summary
        if (symptomNames.length > 0) {
          markdown += `## 选择的症状\n\n`;
          markdown += symptomNames.join('、') + `\n\n`;
        }

        // Symptom analysis sections
        const symptomAnalysisEntries = matchedAnalysis.filter((a: any) => a.category === 'symptom');
        if (symptomAnalysisEntries.length > 0) {
          markdown += `## 症状解析\n\n`;
          for (const entry of symptomAnalysisEntries) {
            markdown += `### ${entry.groupLabel}\n\n`;
            markdown += `${entry.analysisText}\n\n`;
          }
        }

        // Lifestyle analysis
        const lifestyleAnalysis = matchedAnalysis.filter((a: any) => ['lifestyle', 'dietary', 'dietary_text', 'work'].includes(a.category));
        if (lifestyleAnalysis.length > 0) {
          markdown += `## 生活习惯解析\n\n`;
          for (const entry of lifestyleAnalysis) {
            markdown += `### ${entry.groupLabel}\n\n`;
            markdown += `${entry.analysisText}\n\n`;
          }
        }

        // Medical history analysis
        const medicalAnalysis = matchedAnalysis.filter((a: any) => a.category === 'medical');
        if (medicalAnalysis.length > 0) {
          markdown += `## 既往病史解析\n\n`;
          for (const entry of medicalAnalysis) {
            markdown += `### ${entry.groupLabel}\n\n`;
            markdown += `${entry.analysisText}\n\n`;
          }
        }

        // Additional notes
        if (response.additionalNotes) {
          markdown += `## 补充说明\n\n`;
          markdown += `${response.additionalNotes}\n\n`;
        }

        res.json({ success: true, markdown, matchedCount: matchedAnalysis.length });
      } catch (error) {
        console.error('Report generation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate report';
        res.status(500).json({ error: errorMessage });
      }
    }
  );

  // Diagnostic endpoint to check tables and run seed
  app.get('/api/debug/tables', async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) {
        return res.json({ error: 'No database connection' });
      }
      const { sql } = await import("drizzle-orm");
      
      // Check which tables exist
      const tables = await db.execute(sql`SHOW TABLES`);
      
      // Try to create reports table directly
      let reportsResult = 'skipped';
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS reports (
            id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
            employee_id int NOT NULL,
            symptoms json NOT NULL,
            generated_text text,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        reportsResult = 'OK';
      } catch (e: any) {
        reportsResult = `ERROR: ${e.message}`;
      }
      
      let templatesResult = 'skipped';
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS report_templates (
            id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
            name varchar(255) NOT NULL,
            template_text text NOT NULL,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        templatesResult = 'OK';
      } catch (e: any) {
        templatesResult = `ERROR: ${e.message}`;
      }
      
      // Try raw SQL queries on reports and report_templates
      let rawReportsQuery = 'skipped';
      try {
        const rows = await db.execute(sql`SELECT * FROM reports LIMIT 1`);
        rawReportsQuery = `OK - rows: ${JSON.stringify(rows[0])}`;
      } catch (e: any) {
        rawReportsQuery = `ERROR: ${e.message}`;
      }
      
      let rawTemplatesQuery = 'skipped';
      try {
        const rows = await db.execute(sql`SELECT * FROM report_templates LIMIT 1`);
        rawTemplatesQuery = `OK - rows: ${JSON.stringify(rows[0])}`;
      } catch (e: any) {
        rawTemplatesQuery = `ERROR: ${e.message}`;
      }
      
      // Try drizzle ORM query on reports
      let drizzleReportsQuery = 'skipped';
      try {
        const { reports: reportsTable } = await import("../drizzle/schema");
        const rows = await db.select().from(reportsTable).limit(1);
        drizzleReportsQuery = `OK - rows: ${JSON.stringify(rows)}`;
      } catch (e: any) {
        drizzleReportsQuery = `ERROR: ${e.message}`;
      }

      // Describe reports table
      let describeReports = 'skipped';
      try {
        const desc = await db.execute(sql`DESCRIBE reports`);
        describeReports = JSON.stringify(desc[0]);
      } catch (e: any) {
        describeReports = `ERROR: ${e.message}`;
      }

      // Describe report_templates table
      let describeTemplates = 'skipped';
      try {
        const desc2 = await db.execute(sql`DESCRIBE report_templates`);
        describeTemplates = JSON.stringify(desc2[0]);
      } catch (e: any) {
        describeTemplates = `ERROR: ${e.message}`;
      }

      // Try drizzle ORM query on report_templates
      let drizzleTemplatesQuery = 'skipped';
      try {
        const { reportTemplates: templatesTable } = await import("../drizzle/schema");
        const rows = await db.select().from(templatesTable).limit(1);
        drizzleTemplatesQuery = `OK - rows: ${JSON.stringify(rows)}`;
      } catch (e: any) {
        drizzleTemplatesQuery = `ERROR: ${e.message}`;
      }

      res.json({ tables, reportsResult, templatesResult, rawReportsQuery, rawTemplatesQuery, drizzleReportsQuery, drizzleTemplatesQuery, describeReports, describeTemplates });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

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

  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`Health check available at http://localhost:${port}/health`);
    
    // Seed symptom analysis data on startup
    try {
      await seedSymptomAnalysis();
    } catch (error) {
      console.error("[Seed] Failed to seed symptom analysis:", error);
    }
  });
}

startServer().catch(console.error);

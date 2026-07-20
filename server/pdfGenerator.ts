import puppeteer from 'puppeteer';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true
});

/**
 * Generate PDF from Markdown content using Puppeteer
 * This approach supports Chinese characters and complex layouts
 */
export async function generatePDF(markdownContent: string): Promise<Buffer> {
  // Convert Markdown to HTML
  const htmlContent = md.render(markdownContent);
  
  // Create the full HTML document with styling
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <title>体质解析报告</title>
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        body {
          font-family: "PingFang SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
          color: #333;
          line-height: 1.6;
          margin: 0;
          padding: 0;
          background-color: #fff;
        }
        
        /* Template Pages */
        .page {
          width: 210mm;
          height: 297mm;
          page-break-after: always;
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
        }
        
        .content-page {
          padding: 20mm;
          box-sizing: border-box;
          page-break-after: always;
        }
        
        /* Cover Page */
        .cover-page {
          background: linear-gradient(135deg, #e6f7f0 0%, #ffffff 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .cover-title {
          font-size: 36px;
          font-weight: bold;
          color: #1a5c40;
          margin-bottom: 20px;
          letter-spacing: 2px;
        }
        .cover-subtitle {
          font-size: 24px;
          color: #2e8b57;
          margin-bottom: 40px;
        }
        .cover-logo {
          font-size: 48px;
          font-weight: bold;
          color: #2e8b57;
          margin-bottom: 60px;
        }
        
        /* Theory Pages */
        .theory-page {
          padding: 20mm;
        }
        .section-title {
          font-size: 24px;
          font-weight: bold;
          color: #1a365d;
          margin-bottom: 20px;
          border-bottom: 2px solid #1a365d;
          padding-bottom: 10px;
        }
        .theory-content {
          font-size: 14px;
          text-align: justify;
        }
        .theory-content p {
          margin-bottom: 15px;
        }
        
        /* Dynamic Content Styles */
        h1 {
          font-size: 28px;
          color: #1a365d;
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 15px;
        }
        h2 {
          font-size: 22px;
          color: #2c5282;
          margin-top: 30px;
          margin-bottom: 15px;
          border-left: 4px solid #3182ce;
          padding-left: 10px;
        }
        h3 {
          font-size: 18px;
          color: #2b6cb0;
          margin-top: 20px;
          margin-bottom: 10px;
        }
        
        /* Symptom Analysis Boxes */
        .analysis-box {
          background-color: #f7fafc;
          border-left: 4px solid #48bb78;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 0 4px 4px 0;
        }
        
        p {
          margin-bottom: 12px;
          font-size: 14px;
        }
        
        ul, ol {
          margin-bottom: 15px;
          padding-left: 20px;
        }
        
        li {
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        strong {
          color: #2d3748;
        }
        
        /* Custom parsing for the markdown content */
        .markdown-content h3 {
          color: #38a169; /* Green color for symptom titles */
          font-size: 18px;
          margin-top: 25px;
        }
        
        .markdown-content h3 + p {
          background-color: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #48bb78;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <!-- Page 1: Cover -->
      <div class="page cover-page">
        <div class="cover-logo">宝健 | 美食美塑同行者</div>
        <div class="cover-title">体质管理方案</div>
        <div class="cover-subtitle">专业体质分析与调理指南</div>
        <div style="margin-top: 100px; font-size: 18px; color: #4a5568;">
          HEALTH, ACCOMPLISHES THE VALUE OF LIFE<br>
          健康 成就人生价值
        </div>
      </div>
      
      <!-- Page 2: Theory 1 -->
      <div class="page theory-page">
        <div class="section-title">三、美食美塑体质管理的范畴</div>
        <div class="theory-content">
          <p><strong>1. 营养干预：</strong>通过科学的饮食指导，补充身体所需的各类营养素，纠正营养失衡状态。</p>
          <p><strong>2. 肠道微生态调节：</strong>改善肠道菌群环境，促进消化吸收，增强免疫力。</p>
          <p><strong>3. 细胞代谢修复：</strong>提供细胞再生所需的原料，促进受损细胞修复，提升整体代谢水平。</p>
          <p><strong>4. 生活方式指导：</strong>包括作息、运动、情绪管理等全方位的健康生活方式干预。</p>
          <p><strong>5. 动态监测与调整：</strong>根据身体反馈，持续优化调理方案，确保效果最大化。</p>
        </div>
        
        <div class="section-title" style="margin-top: 40px;">四、新陈代谢与细胞再生理论基础</div>
        <div class="theory-content">
          <p>人体是由大约60万亿个细胞组成的。细胞的健康决定了器官的健康，器官的健康决定了系统的健康，系统的健康最终决定了人体的整体健康状态。</p>
          <p><strong>新陈代谢：</strong>是生命活动的基本特征。它包括物质代谢和能量代谢。当新陈代谢出现障碍时，体内毒素无法及时排出，营养物质无法有效吸收，就会导致各种亚健康状态和疾病。</p>
          <p><strong>细胞再生：</strong>人体细胞具有自我修复和再生的能力。只要提供充足、均衡的营养原料（如优质蛋白质、必需脂肪酸、维生素、矿物质等），并创造良好的体内环境，受损的细胞就能得到修复，老化的细胞会被新生的健康细胞替代。</p>
          <p>美食美塑体质管理的核心理念，就是通过科学的营养干预和生活方式调整，激活人体自身的自愈能力，促进细胞再生，恢复正常的新陈代谢，从而从根本上改善体质，实现真正的健康。</p>
        </div>
      </div>
      
      <!-- Dynamic Content Pages -->
      <div class="content-page markdown-content">
        ${htmlContent}
      </div>
      
    </body>
    </html>
  `;

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set content and wait for network idle
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      }
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

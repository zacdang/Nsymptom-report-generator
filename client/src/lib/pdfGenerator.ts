/**
 * PDF Report Generator
 * Uses a print-friendly popup window approach for reliable Chinese text rendering.
 * Template pages are rendered as full-page images, followed by formatted report content.
 */

// Convert markdown to simple HTML
function markdownToHtml(markdown: string): string {
  let html = markdown;
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // List items
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  // Group consecutive list items
  html = html.replace(/(<li>.*?<\/li>\s*)+/gs, '<ul>$&</ul>');
  // Paragraphs (double newline)
  html = html.replace(/\n\n/g, '</p><p>');
  // Single newline to <br>
  html = html.replace(/\n/g, '<br>');
  // Wrap in paragraph if not starting with tag
  if (!html.startsWith('<')) {
    html = '<p>' + html + '</p>';
  }
  return html;
}

export async function generateReportPDF(
  markdownContent: string,
  customerName: string
): Promise<void> {
  // Open a new window for print
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    alert('请允许弹出窗口以下载 PDF');
    return;
  }

  const htmlContent = markdownToHtml(markdownContent);

  // Build the full HTML document for printing
  const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${customerName} - 体质管理方案</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", "SimHei", sans-serif;
      color: #333;
      line-height: 1.8;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    /* Template pages - each image fills one full A4 page */
    .template-page {
      width: 210mm;
      height: 297mm;
      page-break-after: always;
      overflow: hidden;
      position: relative;
    }
    .template-page img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    
    /* Report content pages */
    .report-content {
      padding: 20mm 25mm;
      font-size: 14px;
    }
    .report-content h1 {
      font-size: 24px;
      color: #2c3e50;
      margin: 30px 0 15px 0;
      font-weight: bold;
      page-break-after: avoid;
    }
    .report-content h2 {
      font-size: 20px;
      color: #2c5282;
      margin: 25px 0 12px 0;
      border-left: 4px solid #3182ce;
      padding-left: 12px;
      page-break-after: avoid;
    }
    .report-content h3 {
      font-size: 16px;
      color: #2e7d32;
      margin: 20px 0 10px 0;
      font-weight: bold;
      page-break-after: avoid;
    }
    .report-content p {
      margin-bottom: 12px;
      text-align: justify;
    }
    .report-content ul {
      padding-left: 24px;
      margin-bottom: 15px;
    }
    .report-content li {
      margin-bottom: 8px;
    }
    .report-content strong {
      color: #2d3748;
    }
    
    /* Print button - hidden when printing */
    .print-controls {
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 9999;
      display: flex;
      gap: 10px;
    }
    .print-controls button {
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      border: none;
      border-radius: 6px;
      font-weight: bold;
    }
    .btn-print {
      background: #2e7d32;
      color: white;
    }
    .btn-print:hover {
      background: #1b5e20;
    }
    .btn-close {
      background: #666;
      color: white;
    }
    @media print {
      .print-controls {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="btn-print" onclick="window.print()">保存为 PDF / 打印</button>
    <button class="btn-close" onclick="window.close()">关闭</button>
  </div>

  <!-- Template Page 1: Cover -->
  <div class="template-page">
    <img src="/pdf-cover-01.png" alt="封面" />
  </div>

  <!-- Template Page 2 -->
  <div class="template-page">
    <img src="/pdf-template-02.png" alt="体质管理范畴" />
  </div>

  <!-- Template Page 3 -->
  <div class="template-page">
    <img src="/pdf-template-03.png" alt="新陈代谢理论基础1" />
  </div>

  <!-- Template Page 4 -->
  <div class="template-page">
    <img src="/pdf-template-04.png" alt="新陈代谢理论基础2" />
  </div>

  <!-- Dynamic Report Content -->
  <div class="report-content">
    ${htmlContent}
  </div>
</body>
</html>`;

  printWindow.document.write(fullHtml);
  printWindow.document.close();

  // Wait for images to load, then auto-trigger print
  printWindow.onload = () => {
    // Give a small delay for rendering
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
}

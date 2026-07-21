/**
 * PDF Report Generator
 * Uses a print-friendly popup window approach for reliable Chinese text rendering.
 * Cover page uses dynamic customer name. Theory pages merged into one page.
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
    
    /* Cover page */
    .cover-page {
      width: 210mm;
      height: 297mm;
      page-break-after: always;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #fff;
    }
    .cover-top-bar {
      width: 100%;
      height: 12mm;
      background: #2c3e50;
    }
    .cover-title-area {
      margin-top: 15mm;
      width: 80%;
      background: #f5f6fa;
      padding: 12mm 15mm;
      text-align: center;
    }
    .cover-title {
      font-size: 42px;
      font-weight: bold;
      color: #2c3e50;
      letter-spacing: 2px;
    }
    .cover-subtitle {
      margin-top: 12mm;
      font-size: 16px;
      color: #666;
      letter-spacing: 1px;
    }
    .cover-logo {
      margin-top: 8mm;
      width: 120px;
      height: auto;
    }
    .cover-illustration {
      margin-top: auto;
      margin-bottom: 15mm;
      width: 75%;
      object-fit: contain;
    }

    /* Theory page - merged content */
    .theory-page {
      width: 210mm;
      height: 297mm;
      page-break-after: always;
      padding: 18mm 22mm;
      position: relative;
      background: #fff;
    }
    .theory-page .section-title {
      font-size: 26px;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 8mm;
      padding-bottom: 3mm;
      border-bottom: 2px solid #e0e0e0;
    }
    .theory-page .section-content {
      font-size: 14px;
      line-height: 2;
      color: #444;
      margin-bottom: 12mm;
      padding-left: 12px;
      border-left: 4px solid #4CAF50;
    }
    .theory-page .section-content p {
      margin-bottom: 6mm;
      text-align: justify;
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

  <!-- Page 1: Dynamic Cover -->
  <div class="cover-page">
    <div class="cover-top-bar"></div>
    <div class="cover-title-area">
      <div class="cover-title">${customerName}体质管理方案</div>
    </div>
    <p class="cover-subtitle">专业体质分析与调理指南</p>
    <img class="cover-logo" src="/logo.jpg" alt="美食美塑" />
    <img class="cover-illustration" src="/pdf-cover-01.png" alt="Pro-Health" />
  </div>

  <!-- Page 2: Theory (merged) -->
  <div class="theory-page">
    <div class="section-title">一、美食美塑体质管理的范畴</div>
    <div class="section-content">
      <p>美食美塑体质管理帮助会员管理症状形成的原因，从餐桌饮食管理和生活方式按下体质继续发展的暂停键，同时把这些年已经形成的功能伤害，比如肠道菌群、过敏反应、酸性疲劳体质，皮肤问题、眼部问题等透过营养素治疗重塑体质。一周会有明显感受，一个月建立起新的代谢平衡，3个月趋于正向循环。</p>
    </div>
    <div class="section-title" style="margin-top: 6mm;">二、新陈代谢与细胞再生理论基础</div>
    <div class="section-content">
      <p>人体由最小的构成单位细胞构成，所有人身上的细胞在经过六个月左右的时间，大部分细胞组织都会被更新90%，产生新的组织。头发指甲的生长，伤口愈合都展示了人体神奇的再生和自我修复能力。胃细胞七天便更新一次；皮肤细胞28天左右更新一次；肝脏细胞在180天更换一次；红血球细胞120天更新一次。在一年左右的时间，身体98%的细胞都会被重新更新一遍。而最结实的骨细胞也会更新，需要七年。</p>
      <p>每个人都有机会从今天开始利用细胞再生的机会学会采购身体构成的原料来重新建设自己，焕然一新，甚至逆龄。只要营养充足，受损的器官通过细胞的不断"新陈代谢"和"自我修复"，经过一段时间，受损的组织和器官就会被"软性置换"，产生出"新"的组织与器官。很多疾病都有机会彻底康复。</p>
      <p>真正能让我们恢复健康的绝对不是药物，因为药物的成分不是细胞修复所需要的成分。而一旦给足时间，给足生命构成所需要营养物质，如蛋白质、维生素、矿物质、脂类等这些人体构成所需要的材料，人体就会启动自我修复的过程。国家大力推动2030健康中国计划，重预防疾病康复轻医疗就是这个原因。</p>
    </div>
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

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// A4 dimensions in mm
const A4_WIDTH = 210;
const A4_HEIGHT = 297;

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
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  // Line breaks and paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  // Wrap in paragraph tags if not already
  if (!html.startsWith('<')) {
    html = '<p>' + html + '</p>';
  }
  return html;
}

export async function generateReportPDF(
  markdownContent: string,
  customerName: string
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');

  // ===== PAGE 1: Cover Page =====
  const coverDiv = document.createElement('div');
  coverDiv.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 794px; height: 1123px;
    background: white;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif;
    padding: 60px;
    box-sizing: border-box;
  `;
  coverDiv.innerHTML = `
    <div style="width: 100%; text-align: center;">
      <div style="background: #2c3e50; color: white; padding: 30px 40px; margin-bottom: 40px;">
        <h1 style="font-size: 48px; margin: 0; font-weight: bold;">${customerName}体质管理方案</h1>
      </div>
      <p style="font-size: 20px; color: #666; margin-bottom: 40px;">专业体质分析与调理指南</p>
      <div style="margin: 30px 0;">
        <img src="/logo.jpg" style="width: 120px; height: auto;" crossorigin="anonymous" />
      </div>
      <div style="margin-top: 60px;">
        <p style="font-size: 28px; color: #2e7d32; font-weight: bold;">美食美塑®</p>
        <p style="font-size: 16px; color: #666; margin-top: 10px;">Pro-Health</p>
      </div>
      <div style="margin-top: 80px; font-size: 16px; color: #888;">
        <p>HEALTH, ACCOMPLISHES THE VALUE OF LIFE</p>
        <p>健康 成就人生价值</p>
      </div>
    </div>
  `;
  document.body.appendChild(coverDiv);

  try {
    const coverCanvas = await html2canvas(coverDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    const coverImgData = coverCanvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(coverImgData, 'JPEG', 0, 0, A4_WIDTH, A4_HEIGHT);
  } finally {
    document.body.removeChild(coverDiv);
  }

  // ===== PAGE 2: Fixed Template - 三、美食美塑体质管理的范畴 =====
  pdf.addPage();
  const templatePage2Div = document.createElement('div');
  templatePage2Div.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 794px; height: 1123px;
    background: white;
    font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif;
    padding: 60px;
    box-sizing: border-box;
  `;
  templatePage2Div.innerHTML = `
    <h1 style="font-size: 32px; color: #2c3e50; margin-bottom: 30px;">三、美食美塑体质管理的范畴</h1>
    <div style="border-left: 4px solid #2e7d32; padding: 20px 25px; background: #f8faf8; margin-bottom: 30px; font-size: 16px; line-height: 1.8; color: #333;">
      <p>美食美塑体质管理帮助会员管理症状形成的原因，从餐桌饮食管理和生活方式按下体质继续发展的暂停键，同时把这些年已经形成的功能伤害，比如肠道菌群、过敏反应、酸性疲劳体质，皮肤问题、眼部问题等透过营养素治疗重塑体质。一周会有明显感受，一个月建立起新的代谢平衡，3个月趋于正向循环。</p>
    </div>

    <h1 style="font-size: 32px; color: #2c3e50; margin-top: 50px; margin-bottom: 30px;">四、新陈代谢与细胞再生理论基础</h1>
    <div style="border-left: 4px solid #2e7d32; padding: 20px 25px; background: #f8faf8; margin-bottom: 20px; font-size: 16px; line-height: 1.8; color: #333;">
      <p>人体由最小的构成单位细胞构成，所有人身上的细胞在经过六个月左右的时间，大部分细胞组织都会被更新90%，产生新的组织。头发指甲的生长，伤口愈合都展示了人体神奇的再生和自我修复能力。胃细胞七天便更新一次；皮肤细胞28天左右更新一次；肝脏细胞在180天更换一次；红血球细胞120天更新一次。在一年左右的时间，身体98%的细胞都会被重新更新一遍。而最结实的骨细胞也会更新，需要七年。</p>
    </div>
    <div style="border-left: 4px solid #3498db; padding: 20px 25px; background: #f8fafc; margin-bottom: 20px; font-size: 16px; line-height: 1.8; color: #333;">
      <p>每个人都有机会从今天开始利用细胞再生的机会学会采购身体构成的原料来重新建设自己，焕然一新，甚至逆龄。只要营养充足，受损的器官通过细胞的不断"新陈代谢"和"自我修复"，经过一段时间，受损的组织和器官就会被"软性置换"，产生出"新"的组织与器官。很多疾病都有机会彻底康复。</p>
    </div>
    <div style="border-left: 4px solid #e67e22; padding: 20px 25px; background: #fffaf5; font-size: 16px; line-height: 1.8; color: #333;">
      <p>真正能让我们恢复健康的绝对不是药物，因为药物的成分不是细胞修复所需要的成分。而一旦给足时间，给足生命构成所需要营养物质，如蛋白质、维生素、矿物质、脂类等这些人体构成所需要的材料，人体就会启动自我修复的过程。国家大力推动2030健康中国计划，重预防疾病康复轻医疗就是这个原因。</p>
    </div>
  `;
  document.body.appendChild(templatePage2Div);

  try {
    const template2Canvas = await html2canvas(templatePage2Div, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    const template2ImgData = template2Canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(template2ImgData, 'JPEG', 0, 0, A4_WIDTH, A4_HEIGHT);
  } finally {
    document.body.removeChild(templatePage2Div);
  }

  // ===== DYNAMIC CONTENT PAGES =====
  const htmlContent = markdownToHtml(markdownContent);

  // Create a container for the dynamic content and paginate it
  const contentDiv = document.createElement('div');
  contentDiv.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 794px;
    background: white;
    font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif;
    padding: 50px 60px;
    box-sizing: border-box;
    line-height: 1.8;
    font-size: 15px;
    color: #333;
  `;
  contentDiv.innerHTML = `
    <style>
      h1 { font-size: 28px; color: #2c3e50; margin: 25px 0 15px 0; font-weight: bold; }
      h2 { font-size: 22px; color: #2c5282; margin: 20px 0 12px 0; border-left: 4px solid #3182ce; padding-left: 10px; }
      h3 { font-size: 18px; color: #2e7d32; margin: 18px 0 10px 0; font-weight: bold; }
      p { margin-bottom: 12px; }
      ul { padding-left: 20px; margin-bottom: 15px; }
      li { margin-bottom: 8px; }
      strong { color: #2d3748; }
    </style>
    <div class="report-content">${htmlContent}</div>
  `;
  document.body.appendChild(contentDiv);

  try {
    // Get the total height of the content
    const totalHeight = contentDiv.scrollHeight;
    const pageHeight = 1123; // A4 height in pixels at 96dpi equivalent
    const pageWidth = 794;
    const totalPages = Math.ceil(totalHeight / pageHeight);

    for (let i = 0; i < totalPages; i++) {
      if (i > 0 || true) { // Always add a new page for dynamic content
        pdf.addPage();
      }

      // Create a clipped view of the content for this page
      const pageDiv = document.createElement('div');
      pageDiv.style.cssText = `
        position: fixed; left: -9999px; top: 0;
        width: ${pageWidth}px; height: ${pageHeight}px;
        overflow: hidden;
        background: white;
      `;
      const innerDiv = document.createElement('div');
      innerDiv.style.cssText = `
        position: relative;
        top: -${i * pageHeight}px;
        width: ${pageWidth}px;
      `;
      innerDiv.innerHTML = contentDiv.innerHTML;
      innerDiv.style.fontFamily = '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif';
      innerDiv.style.padding = '50px 60px';
      innerDiv.style.boxSizing = 'border-box';
      innerDiv.style.lineHeight = '1.8';
      innerDiv.style.fontSize = '15px';
      innerDiv.style.color = '#333';
      pageDiv.appendChild(innerDiv);
      document.body.appendChild(pageDiv);

      try {
        const pageCanvas = await html2canvas(pageDiv, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          height: pageHeight,
          width: pageWidth
        });
        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage(pageImgData, 'JPEG', 0, 0, A4_WIDTH, A4_HEIGHT);
      } finally {
        document.body.removeChild(pageDiv);
      }
    }
  } finally {
    document.body.removeChild(contentDiv);
  }

  // Save the PDF
  pdf.save(`${customerName}-体质管理方案.pdf`);
}

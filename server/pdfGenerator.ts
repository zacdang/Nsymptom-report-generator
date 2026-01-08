import PDFDocument from 'pdfkit';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

/**
 * Generate PDF from Markdown content using PDFKit
 * Returns the PDF buffer
 */
export async function generatePDF(markdownContent: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Convert Markdown to HTML first for parsing
      const htmlContent = md.render(markdownContent);
      
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 56.7, // 2cm
          bottom: 56.7,
          left: 56.7,
          right: 56.7
        },
        bufferPages: true,
        autoFirstPage: true
      });

      const chunks: Buffer[] = [];
      
      // Collect PDF data
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Parse HTML and render to PDF
      renderHtmlToPdf(doc, htmlContent);
      
      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Parse HTML content and render it to PDF
 */
function renderHtmlToPdf(doc: PDFKit.PDFDocument, html: string) {
  // Remove HTML tags and parse content
  const lines = html.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Handle headings
    if (trimmed.startsWith('<h1>')) {
      const text = stripHtmlTags(trimmed);
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .fillColor('#1a1a1a')
         .text(text, { continued: false })
         .moveDown(0.5)
         .strokeColor('#333333')
         .lineWidth(2)
         .moveTo(doc.x, doc.y)
         .lineTo(doc.page.width - doc.page.margins.right, doc.y)
         .stroke()
         .moveDown(1);
    } else if (trimmed.startsWith('<h2>')) {
      const text = stripHtmlTags(trimmed);
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor('#2a2a2a')
         .text(text)
         .moveDown(0.8);
    } else if (trimmed.startsWith('<h3>')) {
      const text = stripHtmlTags(trimmed);
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#3a3a3a')
         .text(text)
         .moveDown(0.6);
    } else if (trimmed.startsWith('<p>')) {
      const text = stripHtmlTags(trimmed);
      if (text) {
        doc.fontSize(12)
           .font('Helvetica')
           .fillColor('#333333')
           .text(text, { align: 'justify' })
           .moveDown(1);
      }
    } else if (trimmed.startsWith('<li>')) {
      const text = stripHtmlTags(trimmed);
      if (text) {
        doc.fontSize(12)
           .font('Helvetica')
           .fillColor('#333333')
           .text('• ' + text, { indent: 20 })
           .moveDown(0.5);
      }
    } else if (trimmed.startsWith('<blockquote>')) {
      const text = stripHtmlTags(trimmed);
      if (text) {
        doc.fontSize(12)
           .font('Helvetica-Oblique')
           .fillColor('#666666')
           .text(text, { indent: 20 })
           .moveDown(1);
      }
    } else if (trimmed.startsWith('<code>') || trimmed.startsWith('<pre>')) {
      const text = stripHtmlTags(trimmed);
      if (text) {
        doc.fontSize(10)
           .font('Courier')
           .fillColor('#333333')
           .rect(doc.x - 5, doc.y - 5, doc.page.width - doc.page.margins.left - doc.page.margins.right, 20)
           .fill('#f5f5f5')
           .fillColor('#333333')
           .text(text)
           .moveDown(1);
      }
    } else if (!trimmed.startsWith('<') && trimmed.length > 0) {
      // Plain text
      const text = stripHtmlTags(trimmed);
      if (text) {
        doc.fontSize(12)
           .font('Helvetica')
           .fillColor('#333333')
           .text(text, { align: 'justify' })
           .moveDown(1);
      }
    }
  }
}

/**
 * Strip HTML tags from text
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

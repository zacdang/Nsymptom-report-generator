// PDF generation is now handled client-side using jsPDF + html2canvas
// This file is kept as a stub for the /api/generate-pdf endpoint backward compatibility

export async function generatePDF(markdownContent: string): Promise<Buffer> {
  // Return a simple error message as this endpoint is deprecated
  throw new Error('PDF generation has been moved to client-side. Please update your client.');
}

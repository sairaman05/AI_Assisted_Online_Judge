import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

/**
 * Comprehensive PDF Document Generator Service
 * Dynamically builds a detailed multi-page interview preparation guide PDF.
 */
export function buildPreparationPdfBuffer(docData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Title & Header Banner
      doc
        .fillColor('#1e1b4b')
        .fontSize(22)
        .text(`Interview Preparation Curriculum`, { align: 'center' });

      doc
        .fillColor('#4338ca')
        .fontSize(14)
        .text(`${docData.role || 'Software Engineer'} at ${docData.company || 'Target Company'}`, { align: 'center' });

      doc.moveDown(1.5);

      // Section 1: Must-Know Core Concepts & Teaching Modules
      if (docData.mustKnowConcepts && docData.mustKnowConcepts.length > 0) {
        doc.fillColor('#111827').fontSize(14).text('1. Must-Know Core Concepts', { underline: true });
        doc.moveDown(0.5);
        doc.fillColor('#374151').fontSize(10);
        docData.mustKnowConcepts.forEach((concept) => {
          doc.text(`• ${concept}`);
        });
        doc.moveDown(1);
      }

      // Section 2: Key Algorithmic & Coding Patterns
      if (docData.dsaPatterns && docData.dsaPatterns.length > 0) {
        doc.fillColor('#111827').fontSize(14).text('2. Key Algorithmic Patterns & Coding Questions', { underline: true });
        doc.moveDown(0.5);
        doc.fillColor('#374151').fontSize(10);
        docData.dsaPatterns.forEach((pattern) => {
          doc.text(`• ${pattern}`);
        });
        doc.moveDown(1);
      }

      // Section 3: System Design Chapters (if present)
      if (docData.systemDesignChapters && docData.systemDesignChapters.length > 0) {
        doc.fillColor('#111827').fontSize(14).text('3. System Design Modules', { underline: true });
        doc.moveDown(0.5);
        docData.systemDesignChapters.forEach((ch, idx) => {
          doc.fillColor('#1f2937').fontSize(11).text(`Chapter ${idx + 1}: ${ch.title}`, { bold: true });
          doc.fillColor('#4b5563').fontSize(9.5).text(`   ${ch.explanation || ch.content}`);
          if (ch.keyTakeaway) {
            doc.fillColor('#4338ca').fontSize(9).text(`   Takeaway: ${ch.keyTakeaway}`);
          }
          doc.moveDown(0.5);
        });
        doc.moveDown(1);
      }

      // Section 4: Key Technical Q&A & Interview Framework
      if (docData.keyTechnicalQnA && docData.keyTechnicalQnA.length > 0) {
        doc.fillColor('#111827').fontSize(14).text('4. High-Yield Technical Q&A', { underline: true });
        doc.moveDown(0.5);
        docData.keyTechnicalQnA.forEach((qna, idx) => {
          doc.fillColor('#1f2937').fontSize(10).text(`Q${idx + 1}: ${qna.question}`, { bold: true });
          doc.fillColor('#4b5563').fontSize(9.5).text(`   Ans: ${qna.answerSummary}`);
          doc.moveDown(0.5);
        });
        doc.moveDown(1);
      }

      // Section 5: Behavioral STAR Framework & HR
      if (docData.behavioralFramework && docData.behavioralFramework.length > 0) {
        doc.fillColor('#111827').fontSize(14).text('5. Behavioral & STAR Framework Strategy', { underline: true });
        doc.moveDown(0.5);
        doc.fillColor('#374151').fontSize(10);
        docData.behavioralFramework.forEach((tip) => {
          doc.text(`• ${tip}`);
        });
        doc.moveDown(1);
      }

      // Section 6: Final Interview Checklist
      if (docData.finalChecklist && docData.finalChecklist.length > 0) {
        doc.fillColor('#111827').fontSize(14).text('6. Final Interview Checklist', { underline: true });
        doc.moveDown(0.5);
        doc.fillColor('#374151').fontSize(10);
        docData.finalChecklist.forEach((item) => {
          doc.text(`[  ] ${item}`);
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

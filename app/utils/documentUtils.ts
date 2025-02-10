'use client';

import mammoth from 'mammoth';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document, Packer, Paragraph } from 'docx';

// Constants for PDF generation
const MARGIN_X = 50;
const MARGIN_Y = 50;
const FONT_SIZE = 12;
const LINE_HEIGHT = 1.2;
const CHARS_PER_LINE = 90; // Approximate characters per line

function splitTextIntoLines(text: string, charsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= charsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

async function createMultiPagePDF(text: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Split text into paragraphs
  const paragraphs = text.split('\n');
  
  let currentPage = pdfDoc.addPage();
  const { width, height } = currentPage.getSize();
  let yOffset = height - MARGIN_Y;
  
  for (const paragraph of paragraphs) {
    // Split paragraph into lines that fit the page width
    const lines = splitTextIntoLines(paragraph, CHARS_PER_LINE);
    
    for (const line of lines) {
      // Check if we need a new page
      if (yOffset < MARGIN_Y + FONT_SIZE) {
        currentPage = pdfDoc.addPage();
        yOffset = height - MARGIN_Y;
      }
      
      // Draw the line
      currentPage.drawText(line, {
        x: MARGIN_X,
        y: yOffset,
        size: FONT_SIZE,
        font: font,
        color: rgb(0, 0, 0),
        lineHeight: FONT_SIZE * LINE_HEIGHT,
      });
      
      // Move to next line
      yOffset -= FONT_SIZE * LINE_HEIGHT;
    }
    
    // Add extra space after paragraph
    yOffset -= FONT_SIZE * 0.5;
  }
  
  return pdfDoc.save();
}

export async function convertDocument(
  file: File,
  targetFormat: string
): Promise<Blob> {
  const sourceFormat = file.name.split('.').pop()?.toLowerCase();
  
  if (!sourceFormat) {
    throw new Error('Could not determine source file format');
  }

  // Convert to array buffer for processing
  const arrayBuffer = await file.arrayBuffer();

  // DOCX to PDF conversion
  if (sourceFormat === 'docx' && targetFormat === 'pdf') {
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const text = result.value.replace(/<[^>]*>/g, ''); // Strip HTML tags
    const pdfBytes = await createMultiPagePDF(text);
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  // DOCX to TXT conversion
  if (sourceFormat === 'docx' && targetFormat === 'txt') {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return new Blob([result.value], { type: 'text/plain' });
  }

  // TXT to DOCX conversion
  if (sourceFormat === 'txt' && targetFormat === 'docx') {
    const text = new TextDecoder().decode(arrayBuffer);
    const doc = new Document({
      sections: [{
        properties: {},
        children: text.split('\n').map(line => 
          new Paragraph({ text: line })
        ),
      }],
    });

    const docxBuffer = await Packer.toBuffer(doc);
    return new Blob([docxBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
  }

  // TXT to PDF conversion
  if (sourceFormat === 'txt' && targetFormat === 'pdf') {
    const text = new TextDecoder().decode(arrayBuffer);
    const pdfBytes = await createMultiPagePDF(text);
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  // PDF to TXT conversion
  if (sourceFormat === 'pdf' && targetFormat === 'txt') {
    throw new Error('PDF to TXT conversion is not supported yet');
  }

  // PDF to DOCX conversion
  if (sourceFormat === 'pdf' && targetFormat === 'docx') {
    throw new Error('PDF to DOCX conversion is not supported yet');
  }

  throw new Error(`Unsupported conversion: ${sourceFormat} to ${targetFormat}`);
} 
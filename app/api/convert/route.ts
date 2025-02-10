import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun } from 'docx';

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const targetFormat = formData.get('targetFormat') as string;

    if (!file || !targetFormat) {
      return NextResponse.json({ error: 'Missing file or target format' }, { status: 400 });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputFormat = file.name.split('.').pop()?.toLowerCase();

    try {
      let convertedBuffer: Buffer | Uint8Array;
      let contentType: string;

      // DOCX to PDF conversion
      if (inputFormat === 'docx' && targetFormat === 'pdf') {
        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        page.drawText(result.value.replace(/<[^>]*>/g, ''), {
          x: 50,
          y: height - 50,
          size: 12,
        });
        const pdfBytes = await pdfDoc.save();
        convertedBuffer = Buffer.from(pdfBytes);
        contentType = 'application/pdf';
      }
      // DOCX to TXT conversion
      else if (inputFormat === 'docx' && targetFormat === 'txt') {
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        convertedBuffer = Buffer.from(result.value);
        contentType = 'text/plain';
      }
      // TXT to DOCX conversion
      else if (inputFormat === 'txt' && targetFormat === 'docx') {
        const text = Buffer.from(arrayBuffer).toString('utf-8');
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text })
                ],
              }),
            ],
          }],
        });
        const docxBuffer = await Packer.toBuffer(doc);
        convertedBuffer = Buffer.from(docxBuffer);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
      // TXT to PDF conversion
      else if (inputFormat === 'txt' && targetFormat === 'pdf') {
        const text = Buffer.from(arrayBuffer).toString('utf-8');
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        page.drawText(text, {
          x: 50,
          y: height - 50,
          size: 12,
        });
        const pdfBytes = await pdfDoc.save();
        convertedBuffer = Buffer.from(pdfBytes);
        contentType = 'application/pdf';
      }
      else {
        return NextResponse.json({
          error: 'Unsupported conversion',
          details: `Cannot convert from ${inputFormat} to ${targetFormat}`
        }, { status: 400 });
      }

      return new NextResponse(convertedBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="converted.${targetFormat}"`,
          'Cache-Control': 'no-cache'
        }
      });
    } catch (error) {
      console.error('Conversion error:', error);
      return NextResponse.json({
        error: 'Error converting document',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
  maxDuration: 300,
}; 
import fs from 'fs';
import path from 'path';

export interface ParsedPDF {
  text: string;
  pages: string[];
  pageCount: number;
  fileName: string;
}

export async function parsePDF(filePath: string): Promise<ParsedPDF> {
  // Import the inner lib directly to avoid pdf-parse's index.js bug
  // (it tries to read a non-existent test file on require)
  const pdfParse = require('pdf-parse/lib/pdf-parse');
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  
  // Split by page breaks (form feed character)
  const pages = data.text.split('\f').filter((p: string) => p.trim().length > 0);
  
  return {
    text: data.text,
    pages,
    pageCount: data.numpages,
    fileName: path.basename(filePath),
  };
}

import fs from 'fs';
import path from 'path';

export interface ParsedPDF {
  text: string;
  pages: string[];
  pageCount: number;
  fileName: string;
}

/**
 * Detect if a page is primarily Hindi/Devanagari text.
 * UPSC papers have alternate Hindi and English pages.
 * We skip Hindi pages since we only want English content.
 */
function isHindiPage(pageText: string): boolean {
  if (pageText.trim().length < 10) return false;
  // Count Devanagari characters (Unicode range U+0900 to U+097F)
  const devanagariChars = (pageText.match(/[\u0900-\u097F]/g) || []).length;
  const totalAlpha = (pageText.match(/[a-zA-Z\u0900-\u097F]/g) || []).length;
  if (totalAlpha === 0) return false;
  // If more than 30% of alphabetic characters are Devanagari, it's a Hindi page
  return devanagariChars / totalAlpha > 0.3;
}

export async function parsePDF(filePath: string): Promise<ParsedPDF> {
  // Import the inner lib directly to avoid pdf-parse's index.js bug
  // (it tries to read a non-existent test file on require)
  const pdfParse = require('pdf-parse/lib/pdf-parse');
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  
  // Split by page breaks (form feed character)
  const allPages = data.text.split('\f').filter((p: string) => p.trim().length > 0);
  
  // Filter out Hindi/Devanagari pages
  const englishPages = allPages.filter((p: string) => !isHindiPage(p));
  
  // Rejoin only English pages for full text
  const englishText = englishPages.join('\n\n');
  
  return {
    text: englishText,
    pages: englishPages,
    pageCount: englishPages.length,
    fileName: path.basename(filePath),
  };
}

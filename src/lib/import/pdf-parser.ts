import fs from 'fs';
import path from 'path';

export interface ParsedPDF {
  text: string;
  pages: string[];
  pageCount: number;
  fileName: string;
}

/**
 * Detect if a single line is primarily Hindi/Devanagari text.
 * Returns true if the line has significant Devanagari content.
 */
function isHindiLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3) return false;
  // Count Devanagari characters (Unicode range U+0900 to U+097F)
  const devanagariChars = (trimmed.match(/[\u0900-\u097F]/g) || []).length;
  // If line contains any Devanagari characters, it's Hindi
  // (English lines in UPSC papers never contain Devanagari)
  return devanagariChars > 2;
}

/**
 * Remove all Hindi/Devanagari lines from text.
 * Works for both:
 * - Separate Hindi pages (Prelims: alternate pages)
 * - Mixed pages (Mains/Essay: Hindi above, English below on same page)
 */
function stripHindiText(text: string): string {
  const lines = text.split('\n');
  const englishLines = lines.filter(line => !isHindiLine(line));
  return englishLines.join('\n');
}

export async function parsePDF(filePath: string): Promise<ParsedPDF> {
  // Import the inner lib directly to avoid pdf-parse's index.js bug
  // (it tries to read a non-existent test file on require)
  const pdfParse = require('pdf-parse/lib/pdf-parse');
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  
  // Strip all Hindi/Devanagari text line by line
  const cleanedText = stripHindiText(data.text);
  
  // Split by page breaks (form feed character)
  const pages = cleanedText.split('\f').filter((p: string) => p.trim().length > 0);
  
  return {
    text: cleanedText,
    pages,
    pageCount: pages.length,
    fileName: path.basename(filePath),
  };
}


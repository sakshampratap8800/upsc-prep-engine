const fs = require('fs');
const pdfParse = require('pdf-parse/lib/pdf-parse');
const buf = fs.readFileSync('E:/books/PYQ/mains/2026/QP-CSM-26-010926-GENERAL STUDIES PAPER - I.pdf');
pdfParse(buf).then(res => {
  const flatText = res.text.replace(/\n/g, ' ').replace(/\s+/g, ' ');
  const pattern = /\s(?:Q\.?\s*)?(\d+)\s*\.\s+([\s\S]*?)(?=\s(?:Q\.?\s*)?\d+\s*\.\s|$)/g;
  let match;
  while ((match = pattern.exec(flatText)) !== null) {
    let qText = match[2].trim();
    qText = qText.replace(/[\u0900-\u097F~@#_\|\\]/g, ' ');
    qText = qText.replace(/\(Answer in \d+ words\) \d+(?:\s*½)?/i, ' ');
    qText = qText.replace(/\s+/g, ' ').trim();
    console.log(match[1], qText.substring(0, 100));
  }
}).catch(console.error);

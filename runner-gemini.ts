import fs from 'fs';
import path from 'path';

// Load .env manually
if (fs.existsSync('.env')) {
  const envText = fs.readFileSync('.env', 'utf8');
  envText.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...values] = trimmed.split('=');
      process.env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

import { importPYQsWithGemini, mapOfficialAnswerKeys } from './src/lib/import/gemini-pyq-importer';

async function main() {
  await importPYQsWithGemini();
  await mapOfficialAnswerKeys();
}

main().catch(console.error);



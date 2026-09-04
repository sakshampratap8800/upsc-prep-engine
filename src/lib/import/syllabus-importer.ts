import { parsePDF } from './pdf-parser';
import prisma from '@/lib/db';
import { SYLLABUS_DIR } from '@/lib/constants';
import path from 'path';
import fs from 'fs';

export interface SyllabusImportResult {
  success: boolean;
  topicsImported: number;
  errors: string[];
}

export async function importSyllabus(): Promise<SyllabusImportResult> {
  const result: SyllabusImportResult = { success: true, topicsImported: 0, errors: [] };

  try {
    const files = fs.readdirSync(SYLLABUS_DIR).filter(f => f.endsWith('.pdf'));
    if (files.length === 0) {
      result.errors.push('No syllabus PDF found');
      result.success = false;
      return result;
    }

    const filePath = path.join(SYLLABUS_DIR, files[0]);
    const parsed = await parsePDF(filePath);
    const text = parsed.text;

    const sections = extractSyllabusSections(text);

    await prisma.syllabusTopic.deleteMany({});
    await prisma.importLog.deleteMany({ where: { fileType: 'syllabus' } });

    for (const section of sections) {
      const parentTopic = await prisma.syllabusTopic.create({
        data: {
          name: section.name,
          paper: section.paper,
          description: section.description || null,
        },
      });
      result.topicsImported++;

      for (const sub of section.subtopics) {
        await prisma.syllabusTopic.create({
          data: {
            name: sub,
            paper: section.paper,
            parentId: parentTopic.id,
          },
        });
        result.topicsImported++;
      }
    }

    await prisma.importLog.create({
      data: { fileName: files[0], fileType: 'syllabus', status: 'success', message: `Imported ${result.topicsImported} topics` },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(errMsg);
    result.success = false;
  }

  return result;
}

interface SyllabusSection {
  name: string;
  paper: string;
  description?: string;
  subtopics: string[];
}

function extractSyllabusSections(text: string): SyllabusSection[] {
  return [
    ...extractPrelimsSections(text),
    ...extractMainSections(text),
    ...extractOptionalSubjectSections(text, 'Sociology', 'SOCIOLOGY'),
  ].filter(section => section.subtopics.length > 0);
}

function extractPrelimsSections(text: string): SyllabusSection[] {
  const prelimsBlock = extractBetween(text, 'Part A—Preliminary Examination', 'Part B—Main Examination');
  const paperOneBlock = extractBetween(prelimsBlock, 'Paper I - (200 marks)', 'Paper II-(200 marks)');
  const paperTwoBlock = extractBetween(prelimsBlock, 'Paper II-(200 marks)', 'Note 1:');

  return [
    {
      name: 'Paper I - General Studies',
      paper: 'Prelims',
      subtopics: extractBulletTopics(paperOneBlock),
    },
    {
      name: 'Paper II - CSAT',
      paper: 'Prelims',
      subtopics: extractBulletTopics(paperTwoBlock),
    },
  ];
}

function extractMainSections(text: string): SyllabusSection[] {
  const essayBlock = extractBetween(text, 'PAPER-I', 'PAPER-II');
  const gsOneBlock = extractBetween(text, 'PAPER-II', 'PAPER-III');
  const gsTwoBlock = extractBetween(text, 'PAPER-III', 'PAPER-IV');
  const gsThreeBlock = extractBetween(text, 'PAPER-IV', 'PAPER-V');
  const gsFourBlock = extractBetween(text, 'PAPER-V', 'ANTHROPOLOGY');

  return [
    {
      name: 'Essay',
      paper: 'Essay',
      subtopics: [cleanTopic(essayBlock.replace(/^Essay:\s*/i, ''))].filter(Boolean),
    },
    {
      name: cleanHeading(gsOneBlock, 'General Studies-I:'),
      paper: 'GS-I',
      subtopics: extractBulletTopics(gsOneBlock),
    },
    {
      name: cleanHeading(gsTwoBlock, 'General Studies- II:'),
      paper: 'GS-II',
      subtopics: extractBulletTopics(gsTwoBlock),
    },
    {
      name: cleanHeading(gsThreeBlock, 'General Studies-III:'),
      paper: 'GS-III',
      subtopics: extractBulletTopics(gsThreeBlock),
    },
    {
      name: cleanHeading(gsFourBlock, 'General Studies- IV:'),
      paper: 'GS-IV',
      subtopics: extractBulletTopics(gsFourBlock),
    },
  ];
}

function extractOptionalSubjectSections(
  text: string,
  subject: 'Anthropology' | 'Sociology',
  startHeading: string,
  endHeading?: string,
): SyllabusSection[] {
  const subjectBlock = extractBetween(text, startHeading, endHeading);
  const paperOneMarker = subject === 'Sociology' ? 'PAPER– I' : 'PAPER-I';
  const paperTwoMarker = subject === 'Sociology' ? 'PAPER–II' : 'PAPER-II';
  const paperOneBlock = extractBetween(subjectBlock, paperOneMarker, paperTwoMarker);
  const paperTwoBlock = extractBetween(subjectBlock, paperTwoMarker);

  return [
    {
      name: `${subject} Paper-I`,
      paper: subject,
      subtopics: extractNumberedTopics(paperOneBlock),
    },
    {
      name: `${subject} Paper-II`,
      paper: subject,
      subtopics: extractNumberedTopics(paperTwoBlock),
    },
  ];
}

function extractBetween(text: string, start: string, end?: string): string {
  const startIndex = text.indexOf(start);
  if (startIndex === -1) return '';

  const contentStart = startIndex + start.length;
  const endIndex = end ? text.indexOf(end, contentStart) : -1;
  return text.slice(contentStart, endIndex === -1 ? undefined : endIndex).trim();
}

function cleanHeading(block: string, marker: string): string {
  const markerIndex = block.indexOf(marker);
  if (markerIndex === -1) return marker.replace(':', '').trim();

  const content = block.slice(markerIndex + marker.length);
  const bulletIndex = content.indexOf('');
  return cleanTopic(content.slice(0, bulletIndex === -1 ? undefined : bulletIndex));
}

function extractBulletTopics(block: string): string[] {
  const topics: string[] = [];
  const matches = block.matchAll(/\s*([\s\S]*?)(?=\n\s*|$)/g);

  for (const match of matches) {
    const topic = cleanTopic(match[1]);
    if (topic) topics.push(topic);
  }

  return topics;
}

function extractNumberedTopics(block: string): string[] {
  const topics: string[] = [];
  const lines = block
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !/^\d+$/.test(line));

  let current = '';
  const topicStartPattern = /^(?:\d+(?:\.\d+)*\.?|[A-Z]\.)\s+/;

  for (const line of lines) {
    if (topicStartPattern.test(line)) {
      if (current) topics.push(cleanTopic(current));
      current = line;
    } else if (current) {
      current += ` ${line}`;
    }
  }

  if (current) topics.push(cleanTopic(current));

  return topics.filter(Boolean);
}

function cleanTopic(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/([.;:])([A-Za-z])/g, '$1 $2')
    .trim();
}

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

    // Extract syllabus structure
    // UPSC syllabus typically has: Paper sections, topics under each
    const sections = extractSyllabusSections(text);

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
  const sections: SyllabusSection[] = [];

  // Try to detect GS Paper sections
  // Common patterns: "PAPER-I", "Paper I", "General Studies I"
  const paperPatterns = [
    { pattern: /(?:PAPER[\s-]*I(?![IV]))|(?:General Studies[\s-]*I(?![IV]))/gi, paper: 'GS-I' },
    { pattern: /(?:PAPER[\s-]*II)|(?:General Studies[\s-]*II)/gi, paper: 'GS-II' },
    { pattern: /(?:PAPER[\s-]*III)|(?:General Studies[\s-]*III)/gi, paper: 'GS-III' },
    { pattern: /(?:PAPER[\s-]*IV)|(?:General Studies[\s-]*IV)/gi, paper: 'GS-IV' },
  ];

  // Split text into lines and look for topic-like content
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Broad extraction: find lines that look like syllabus topics
  // These tend to be medium-length lines with subject keywords
  const topicKeywords = [
    'Indian History', 'Indian Culture', 'Modern Indian History', 'Freedom Struggle',
    'Post-independence', 'World History', 'Indian Society', 'Globalization',
    'Social Empowerment', 'Communalism', 'Regionalism', 'Secularism',
    'Geography', 'Physical Geography', 'Human Geography', 'Geomorphology',
    'Climatology', 'Oceanography', 'Biogeography', 'Environment',
    'Indian Constitution', 'Governance', 'Polity', 'Social Justice',
    'International Relations', 'Indian Economy', 'Economic Development',
    'Technology', 'Biodiversity', 'Disaster Management', 'Security',
    'Ethics', 'Integrity', 'Aptitude', 'Attitude', 'Emotional Intelligence',
    'Public Administration', 'Probity', 'Information Sharing',
  ];

  // Create default syllabus structure based on standard UPSC GS syllabus
  const defaultSyllabus: SyllabusSection[] = [
    {
      name: 'Indian Heritage and Culture, History and Geography of the World and Society',
      paper: 'GS-I',
      subtopics: [
        'Indian Culture - Art Forms, Literature, Architecture',
        'Modern Indian History - Freedom Struggle',
        'Post-independence Consolidation and Reorganization',
        'History of the World - 18th century events, World Wars, Colonization',
        'Indian Society - Features, Diversity, Role of Women',
        'Social Empowerment, Communalism, Regionalism, Secularism',
        'Salient features of World Physical Geography',
        'Distribution of Key Natural Resources',
        'Factors responsible for location of Industries',
        'Important Geophysical phenomena - Earthquakes, Tsunami, Volcanic activity, Cyclone',
      ],
    },
    {
      name: 'Governance, Constitution, Polity, Social Justice and International Relations',
      paper: 'GS-II',
      subtopics: [
        'Indian Constitution - Historical underpinnings, Evolution, Features, Amendments',
        'Functions and Responsibilities of Union and States, Federal Structure',
        'Separation of Powers, Dispute Redressal Mechanisms',
        'Parliament and State Legislatures - Structure, Functioning, Conduct of Business',
        'Structure, Organization and Functioning of Executive and Judiciary',
        'Representation of People\'s Act',
        'Statutory, Regulatory and Quasi-judicial Bodies',
        'Government Policies and Interventions for Development',
        'Development Processes and the Development Industry - NGOs, SHGs',
        'Welfare Schemes for Vulnerable Sections',
        'Issues relating to Health, Education, Human Resources',
        'India and its Neighborhood Relations',
        'Bilateral, Regional and Global Groupings affecting India',
        'Effect of Policies of Developed and Developing Countries on India',
        'Important International Institutions and Agencies',
      ],
    },
    {
      name: 'Technology, Economic Development, Biodiversity, Environment, Security and Disaster Management',
      paper: 'GS-III',
      subtopics: [
        'Indian Economy - Issues relating to Planning, Resource Mobilization',
        'Government Budgeting',
        'Inclusive Growth and issues arising from it',
        'Major Crops, Cropping Patterns, Irrigation, Farm Subsidies',
        'Food Processing and Related Industries',
        'Land Reforms in India',
        'Effects of Liberalization on the Economy',
        'Infrastructure - Energy, Ports, Roads, Airports, Railways',
        'Investment Models',
        'Science and Technology - Developments, Applications, Effects',
        'Awareness in IT, Space, Computers, Robotics, Nano-technology, Bio-technology',
        'Environmental Conservation, Environmental Pollution and Degradation',
        'Biodiversity and its Conservation',
        'Disaster Management',
        'Linkages between Development and Spread of Extremism',
        'Role of External State and Non-state Actors in creating challenges to Internal Security',
        'Challenges to Internal Security - Communication Networks, Cyber Security',
        'Money Laundering and its Prevention',
        'Border Area Security Challenges and Management',
      ],
    },
    {
      name: 'Ethics, Integrity and Aptitude',
      paper: 'GS-IV',
      subtopics: [
        'Ethics and Human Interface - Essence, Determinants, Consequences',
        'Dimensions of Ethics - Private and Public Relationships',
        'Attitude - Content, Structure, Function; Influence and Relation with Thought and Behaviour',
        'Aptitude and Foundational Values for Civil Service',
        'Emotional Intelligence - Concepts and Dimensions',
        'Contributions of Moral Thinkers and Philosophers',
        'Public/Civil Service Values and Ethics in Public Administration',
        'Probity in Governance - Concept, Philosophical Basis',
        'Information Sharing and Transparency in Government',
        'Right to Information, Codes of Ethics, Codes of Conduct',
        'Citizen\'s Charters, Transparency and Accountability',
        'Ethical Issues in International Relations and Funding',
        'Corporate Governance',
        'Case Studies on above issues',
      ],
    },
    {
      name: 'Preliminary Examination - General Studies',
      paper: 'Prelims',
      subtopics: [
        'Current events of national and international importance',
        'History of India and Indian National Movement',
        'Indian and World Geography - Physical, Social, Economic',
        'Indian Polity and Governance - Constitution, Political System, Panchayati Raj',
        'Economic and Social Development - Sustainable Development, Poverty, Demographics',
        'General issues on Environmental Ecology, Biodiversity and Climate Change',
        'General Science',
      ],
    },
  ];

  // Try extracting from the actual PDF text first
  let currentPaper = '';
  let currentSection: SyllabusSection | null = null;

  for (const line of lines) {
    // Check if line matches a paper heading
    for (const pp of paperPatterns) {
      if (pp.pattern.test(line)) {
        currentPaper = pp.paper;
        pp.pattern.lastIndex = 0;
        if (currentSection) sections.push(currentSection);
        currentSection = { name: line, paper: currentPaper, subtopics: [] };
        break;
      }
    }

    // Check if line looks like a topic
    if (currentSection && line.length > 10 && line.length < 200) {
      const isTopicLike = topicKeywords.some(k => line.toLowerCase().includes(k.toLowerCase()));
      if (isTopicLike || (line.includes('-') && line.length > 15 && line.length < 150)) {
        currentSection.subtopics.push(line);
      }
    }
  }
  if (currentSection && currentSection.subtopics.length > 0) {
    sections.push(currentSection);
  }

  // If extraction yielded too few results, use defaults
  if (sections.length < 3 || sections.reduce((a, s) => a + s.subtopics.length, 0) < 15) {
    return defaultSyllabus;
  }

  return sections;
}

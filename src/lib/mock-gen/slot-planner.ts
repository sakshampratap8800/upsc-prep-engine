import { APFC_SYLLABUS } from '@/lib/syllabus/apfc-syllabus';
import { loadMockGenConfig, getSectionBlueprint } from './config';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface QuestionSlot {
  slotId: number;
  primarySection: string;        // e.g. "10_social_security"
  sectionTitle: string;          // e.g. "Concept of Social Security"
  subtopic: string;              // e.g. "EPF_EPS_EDLI"
  archetype: string;             // e.g. "A01"
  targetDifficulty: 'easy' | 'moderate' | 'hard' | 'very_hard';
  currentAffairs: boolean;
  syllabusSlice: {
    keyConcepts: string[];
    importantPoints: string[];
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Difficulty distribution across 120 questions (from blueprint)
const DIFFICULTY_TARGETS = { easy: 15, moderate: 50, hard: 30, very_hard: 5 };

// Section ordering as per APFC exam
const SECTION_ORDER = [
  '1_general_english',
  '2_culture_heritage_freedom_movements',
  '3_economy_development',
  '4_governance',
  '5_general_science',
  '6_computer',
  '7_math_statistics',
  '8_general_mental_ability',
  '9_industrial_relations_labour_laws',
  '10_social_security',
  '11_accountancy_auditing',
  '12_insurance',
  '13_current_events',
];

// Maps blueprint section IDs to APFC_SYLLABUS slugs
const SECTION_SLUG_MAP: Record<string, string> = {
  '1_general_english': 'general-english',
  '2_culture_heritage_freedom_movements': 'culture-heritage-freedom-movements',
  '3_economy_development': 'economy-development',
  '4_governance': 'governance',
  '5_general_science': 'general-science',
  '6_computer': 'computer-application',
  '7_math_statistics': 'math-statistics',
  '8_general_mental_ability': 'general-mental-ability',
  '9_industrial_relations_labour_laws': 'industrial-relations-labour-laws',
  '10_social_security': 'social-security',
  '11_accountancy_auditing': 'accountancy-auditing',
  '12_insurance': 'insurance',
  '13_current_events': 'current-events',
};

// Default archetype per section (fallback if blueprint doesn't specify)
const DEFAULT_ARCHETYPES: Record<string, string[]> = {
  '1_general_english': ['A09', 'A10', 'A07'],
  '2_culture_heritage_freedom_movements': ['A01', 'A07', 'A02'],
  '3_economy_development': ['A01', 'A02', 'A07'],
  '4_governance': ['A01', 'A02', 'A07'],
  '5_general_science': ['A01', 'A07', 'A02'],
  '6_computer': ['A07', 'A01'],
  '7_math_statistics': ['A07', 'A06'],
  '8_general_mental_ability': ['A04', 'A05', 'A07'],
  '9_industrial_relations_labour_laws': ['A01', 'A02', 'A07'],
  '10_social_security': ['A01', 'A02', 'A07'],
  '11_accountancy_auditing': ['A07', 'A01', 'A06'],
  '12_insurance': ['A01', 'A07'],
  '13_current_events': ['A07', 'A01'],
};

// ─── Syllabus slice lookup ────────────────────────────────────────────────────

function getSyllabusSlice(sectionId: string, subtopicHint: string): { keyConcepts: string[]; importantPoints: string[] } {
  const sectionSlug = SECTION_SLUG_MAP[sectionId];
  const section = APFC_SYLLABUS.find(s => s.slug === sectionSlug);
  if (!section) return { keyConcepts: [], importantPoints: [] };

  // Try to find the best matching subtopic
  for (const topic of section.topics) {
    for (const sub of topic.subtopics) {
      if (
        sub.id.toLowerCase().includes(subtopicHint.toLowerCase()) ||
        sub.title.toLowerCase().includes(subtopicHint.toLowerCase()) ||
        subtopicHint.toLowerCase().includes(sub.id.toLowerCase())
      ) {
        return { keyConcepts: sub.keyConcepts, importantPoints: sub.importantPoints };
      }
    }
  }

  // Fallback: use first subtopic of section
  const firstSub = section.topics[0]?.subtopics[0];
  if (firstSub) return { keyConcepts: firstSub.keyConcepts, importantPoints: firstSub.importantPoints };

  return { keyConcepts: [], importantPoints: [] };
}

// ─── Difficulty assignment ────────────────────────────────────────────────────

function assignDifficulties(totalSlots: number): Array<'easy' | 'moderate' | 'hard' | 'very_hard'> {
  const difficulties: Array<'easy' | 'moderate' | 'hard' | 'very_hard'> = [];
  const counts = { ...DIFFICULTY_TARGETS };

  // Scale to totalSlots if needed
  const scale = totalSlots / 120;
  const scaled = {
    easy: Math.round(counts.easy * scale),
    moderate: Math.round(counts.moderate * scale),
    hard: Math.round(counts.hard * scale),
    very_hard: Math.max(1, Math.round(counts.very_hard * scale)),
  };

  // Fill array
  for (let i = 0; i < scaled.easy; i++) difficulties.push('easy');
  for (let i = 0; i < scaled.moderate; i++) difficulties.push('moderate');
  for (let i = 0; i < scaled.hard; i++) difficulties.push('hard');
  for (let i = 0; i < scaled.very_hard; i++) difficulties.push('very_hard');

  // Pad if rounding caused shortfall
  while (difficulties.length < totalSlots) difficulties.push('moderate');
  if (difficulties.length > totalSlots) difficulties.splice(totalSlots);

  // Shuffle difficulties so they're not clumped
  for (let i = difficulties.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [difficulties[i], difficulties[j]] = [difficulties[j], difficulties[i]];
  }

  return difficulties;
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Creates exactly 120 QuestionSlots from the blueprint + APFC_SYLLABUS.
 * Pure deterministic computation — no LLM calls needed.
 */
export function createQuestionSlots(): QuestionSlot[] {
  const config = loadMockGenConfig();
  const distribution = config.blueprint.final_primary_distribution;

  const slots: QuestionSlot[] = [];
  let slotId = 1;

  // Assign difficulties pool for 120 questions
  const allDifficulties = assignDifficulties(120);
  let diffIdx = 0;

  for (const sectionId of SECTION_ORDER) {
    const target = distribution[sectionId] ?? 0;
    if (target === 0) continue;

    const sectionBlueprint = getSectionBlueprint(sectionId);
    const sectionTitle = sectionBlueprint.title || sectionId;
    const subtypes = sectionBlueprint.subtypes || {};
    const archetypes = DEFAULT_ARCHETYPES[sectionId] || ['A07'];
    const isCurrentAffairs = sectionId === '13_current_events';

    // Distribute target questions across subtopics
    let subtopicQueue: string[] = [];
    const subtypeKeys = Object.keys(subtypes);
    
    if (subtypeKeys.length > 0) {
      for (const key of subtypeKeys) {
        const subtypeTarget = subtypes[key];
        const count = Math.round((subtypeTarget / (sectionBlueprint.target || target || 1)) * target);
        for (let i = 0; i < count; i++) {
          subtopicQueue.push(key);
        }
      }
    } else {
      subtopicQueue.push('general');
    }

    // Pad/trim to exactly match target
    while (subtopicQueue.length < target) subtopicQueue.push(subtypeKeys[0] || 'general');
    if (subtopicQueue.length > target) subtopicQueue = subtopicQueue.slice(0, target);

    for (let i = 0; i < target; i++) {
      const subtopic = subtopicQueue[i];
      const archetype = archetypes[i % archetypes.length];
      const difficulty = allDifficulties[diffIdx++] ?? 'moderate';
      const syllabusSlice = getSyllabusSlice(sectionId, subtopic);

      slots.push({
        slotId,
        primarySection: sectionId,
        sectionTitle,
        subtopic,
        archetype,
        targetDifficulty: difficulty,
        currentAffairs: isCurrentAffairs,
        syllabusSlice,
      });
      slotId++;
    }
  }

  return slots;
}

/**
 * Groups slots by section for batch generation.
 */
export function groupSlotsBySection(slots: QuestionSlot[]): Map<string, QuestionSlot[]> {
  const map = new Map<string, QuestionSlot[]>();
  for (const slot of slots) {
    if (!map.has(slot.primarySection)) map.set(slot.primarySection, []);
    map.get(slot.primarySection)!.push(slot);
  }
  return map;
}

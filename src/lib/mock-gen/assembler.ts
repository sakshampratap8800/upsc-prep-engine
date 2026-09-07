import { GeneratedQuestion } from './generator';
import { ValidationResult } from './validator';
import { NoveltyResult } from './novelty-filter';
import { loadMockGenConfig } from './config';

export interface FinalQuestion extends GeneratedQuestion {
  mockNumber: number;     // 1–120 final order
  subjectArea: string;   // display label for UI
}

// Section ordering in the final paper
const ENGLISH_SECTION = '1_general_english';

const SECTION_DISPLAY_NAMES: Record<string, string> = {
  '1_general_english': 'General English',
  '2_culture_heritage_freedom_movements': 'Culture & Heritage',
  '3_economy_development': 'Indian Economy',
  '4_governance': 'Governance',
  '5_general_science': 'General Science',
  '6_computer': 'Computer Applications',
  '7_math_statistics': 'Mathematics & Statistics',
  '8_general_mental_ability': 'Mental Ability',
  '9_industrial_relations_labour_laws': 'Industrial Relations & Labour Laws',
  '10_social_security': 'Social Security',
  '11_accountancy_auditing': 'Accountancy & Auditing',
  '12_insurance': 'Insurance',
  '13_current_events': 'Current Events',
};

export interface AssemblyResult {
  questions: FinalQuestion[];
  sectionCounts: Record<string, number>;
  difficultyCounts: Record<string, number>;
  warnings: string[];
}

export function assembleFinal(
  candidates: GeneratedQuestion[],
  validationResults: ValidationResult[],
  noveltyResults: NoveltyResult[]
): AssemblyResult {
  const warnings: string[] = [];
  const config = loadMockGenConfig();
  const targetDistribution = config.blueprint.final_primary_distribution;

  // Build pass/fail maps
  const validSet = new Set(validationResults.filter(r => r.valid).map(r => r.tempId));
  const novelSet = new Set(noveltyResults.filter(r => r.status === 'passed').map(r => r.tempId));

  // Filter to only candidates that passed both tiers
  const survivors = candidates.filter(q => validSet.has(q.tempId) && novelSet.has(q.tempId));

  if (survivors.length < 120) {
    warnings.push('Only ' + survivors.length + ' candidates survived validation+novelty filter. Target was 120. Paper may be incomplete.');
  }

  // Group survivors by section
  const bySection = new Map<string, GeneratedQuestion[]>();
  for (const q of survivors) {
    if (!bySection.has(q.primarySection)) bySection.set(q.primarySection, []);
    bySection.get(q.primarySection)!.push(q);
  }

  // Select per-section targets
  const selectedQuestions: GeneratedQuestion[] = [];
  const sectionCounts: Record<string, number> = {};

  const sections = Object.keys(targetDistribution);
  for (const sectionId of sections) {
    const target = targetDistribution[sectionId] || 0;
    const pool = bySection.get(sectionId) || [];

    if (pool.length < target) {
      warnings.push('Section ' + sectionId + ': needed ' + target + ', only ' + pool.length + ' survived');
    }

    // Prefer diversity across subtopics
    const subtopicCounts: Record<string, number> = {};
    const sorted = pool.sort((a, b) => {
      const aSub = subtopicCounts[a.subtopic] || 0;
      const bSub = subtopicCounts[b.subtopic] || 0;
      return aSub - bSub; // prefer under-represented subtopics
    });

    const selected = sorted.slice(0, target);
    for (const q of selected) {
      subtopicCounts[q.subtopic] = (subtopicCounts[q.subtopic] || 0) + 1;
    }

    selectedQuestions.push(...selected);
    sectionCounts[sectionId] = selected.length;
  }

  // If we still need more questions (due to shortfalls), take from any remaining survivors
  if (selectedQuestions.length < 120) {
    const selectedIds = new Set(selectedQuestions.map(q => q.tempId));
    const extra = survivors.filter(q => !selectedIds.has(q.tempId));
    const needed = 120 - selectedQuestions.length;
    selectedQuestions.push(...extra.slice(0, needed));
    warnings.push('Used ' + Math.min(needed, extra.length) + ' overflow questions to reach target');
  }

  // Trim to exactly 120 if over
  const finalPool = selectedQuestions.slice(0, 120);

  // ─── Order the paper ────────────────────────────────────────────────────────
  // English questions come first (Q1-20), rest are shuffled in mixed order

  const englishQuestions = finalPool.filter(q => q.primarySection === ENGLISH_SECTION);
  const otherQuestions = finalPool.filter(q => q.primarySection !== ENGLISH_SECTION);

  // Shuffle non-English questions (so they're not topic-wise grouped)
  for (let i = otherQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [otherQuestions[i], otherQuestions[j]] = [otherQuestions[j], otherQuestions[i]];
  }

  const ordered = [...englishQuestions, ...otherQuestions];

  // ─── Final deterministic validation ─────────────────────────────────────────

  const finalIds = new Set<string>();
  for (const q of ordered) {
    if (finalIds.has(q.tempId)) warnings.push('Duplicate question detected: ' + q.tempId);
    finalIds.add(q.tempId);
    if (!['A','B','C','D'].includes(q.correctAnswer)) warnings.push('Invalid answer for ' + q.tempId);
    if (q.optionsJson.length !== 4) warnings.push('Option count mismatch for ' + q.tempId);
  }

  // ─── Attach mock numbers and display labels ──────────────────────────────────

  const difficultyCounts: Record<string, number> = {};
  const finalQuestions: FinalQuestion[] = ordered.map((q, idx) => {
    difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;
    return {
      ...q,
      mockNumber: idx + 1,
      subjectArea: SECTION_DISPLAY_NAMES[q.primarySection] || q.primarySection,
    };
  });

  return { questions: finalQuestions, sectionCounts, difficultyCounts, warnings };
}

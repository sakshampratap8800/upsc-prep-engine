import * as fs from 'fs';
import * as path from 'path';

export interface SectionBlueprint {
  title?: string;
  target?: number;
  subtypes?: Record<string, number>;
  archetypes?: Record<string, number>;
}

export interface DifficultyBlueprint {
  easy: number;
  moderate: number;
  hard: number;
  very_hard: number;
}

export interface MockBlueprint {
  id: string;
  total_questions: number;
  final_primary_distribution: Record<string, number>;
  difficulty_blueprint: DifficultyBlueprint;
  section_blueprints: Record<string, SectionBlueprint>;
}

export interface StyleProfile {
  style: string;
}

export interface MockGenConfig {
  blueprint: MockBlueprint;
  styleProfile: StyleProfile;
  masterPrompt: string;
}

const BASE_DIR = path.resolve('E:/books/apfc/structured/config');
const BLUEPRINT_PATH = path.join(BASE_DIR, 'EPFO_APFC_EOAO_2026_mock_blueprint_final.json');
const STYLE_PROFILE_PATH = path.join(BASE_DIR, 'EPFO_PYQ_historical_style_profile.json');
const MASTER_PROMPT_PATH = path.join(BASE_DIR, 'EPFO_APFC_EOAO_2026_mock_generation_prompt_final.txt');

let _cachedConfig: MockGenConfig | null = null;

export function loadMockGenConfig(): MockGenConfig {
  if (_cachedConfig) return _cachedConfig;
  
  if (!fs.existsSync(BLUEPRINT_PATH)) throw new Error(`Blueprint not found: ${BLUEPRINT_PATH}`);
  if (!fs.existsSync(STYLE_PROFILE_PATH)) throw new Error(`Style profile not found: ${STYLE_PROFILE_PATH}`);
  if (!fs.existsSync(MASTER_PROMPT_PATH)) throw new Error(`Master prompt not found: ${MASTER_PROMPT_PATH}`);
  
  const blueprint: MockBlueprint = JSON.parse(fs.readFileSync(BLUEPRINT_PATH, 'utf-8'));
  const styleProfile: StyleProfile = JSON.parse(fs.readFileSync(STYLE_PROFILE_PATH, 'utf-8'));
  const masterPrompt: string = fs.readFileSync(MASTER_PROMPT_PATH, 'utf-8');

  _cachedConfig = { blueprint, styleProfile, masterPrompt };
  return _cachedConfig;
}

export function getSectionBlueprint(sectionId: string): SectionBlueprint {
  const config = loadMockGenConfig();
  return config.blueprint.section_blueprints[sectionId] || { subtypes: {}, archetypes: {} };
}

export function getMasterSystemPrompt(): string {
  return loadMockGenConfig().masterPrompt;
}

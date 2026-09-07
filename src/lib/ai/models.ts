export interface AIModelConfig {
  id: string;
  name: string;
  model: string;
  reasoning: 'ON' | 'OFF';
  description: string;
  badge?: string;
  isDefault?: boolean;
}

export const AI_TEACHER_MODELS: Record<string, AIModelConfig> = {
  lightning30b: {
    id: 'lightning30b',
    name: 'Nemotron 3.5 Lightning 30B',
    model: 'nvidia/nemotron-3.5-lightning-30b-a3b',
    reasoning: 'OFF',
    description: 'High-speed, exam-focused AI teacher for quick APFC lessons.',
    badge: 'DEFAULT (Fast & Focused)',
    isDefault: true
  },
  super120b: {
    id: 'super120b',
    name: 'Nemotron 3 Super 120B',
    model: 'nvidia/nemotron-3-super-120b-a12b',
    reasoning: 'OFF',
    description: 'Deep reasoning MoE model for complex legal, accounting & scenario analysis.',
    badge: 'Deep Reasoning (120B)'
  }
};

export const DEFAULT_AI_MODEL_ID = 'lightning30b';

export function getAIModelConfig(modelId?: string): AIModelConfig {
  if (modelId && AI_TEACHER_MODELS[modelId]) {
    return AI_TEACHER_MODELS[modelId];
  }
  return AI_TEACHER_MODELS[DEFAULT_AI_MODEL_ID];
}

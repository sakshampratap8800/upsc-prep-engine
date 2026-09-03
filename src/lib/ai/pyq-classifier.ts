import { groq } from './client';
import { PYQ_CLASSIFIER_PROMPT } from './prompts';

export interface PYQClassification {
  difficulty: string;
  questionType: string;
  directiveWord: string | null;
  subjectArea: string;
  explanation: string;
}

export async function classifyPYQ(questionText: string, paper: string): Promise<PYQClassification> {
  const response = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: PYQ_CLASSIFIER_PROMPT },
      { role: 'user', content: `Paper: ${paper}\nQuestion: ${questionText}` }
    ],
    model: 'llama-3.1-70b-versatile',
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content || '{}';
  
  try {
    return JSON.parse(content) as PYQClassification;
  } catch (e) {
    console.error('Failed to parse Groq response:', content);
    throw new Error('Invalid JSON response from AI');
  }
}

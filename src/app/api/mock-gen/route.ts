import { NextRequest } from 'next/server';
import { loadMockGenConfig } from '@/lib/mock-gen/config';
import { createQuestionSlots, groupSlotsBySection } from '@/lib/mock-gen/slot-planner';
import { loadHistoricalPYQs } from '@/lib/mock-gen/pyq-retriever-mock';
import { generateBatch, GeneratedQuestion } from '@/lib/mock-gen/generator';
import { validateBatch } from '@/lib/mock-gen/validator';
import { runNoveltyFilter } from '@/lib/mock-gen/novelty-filter';
import { assembleFinal } from '@/lib/mock-gen/assembler';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(data: any) {
        try {
          controller.enqueue(encoder.encode('data: ' + JSON.stringify(data) + '\n\n'));
        } catch (e) { }
      }

      try {
        sendEvent({ stage: 'init', progress: 0, message: 'Initializing mock generation pipeline...' });
        sendEvent({ stage: 'planning', progress: 5, message: 'Loading configurations and building 120 slots...' });
        
        loadMockGenConfig();
        loadHistoricalPYQs();
        const slots = createQuestionSlots();
        const slotsBySection = groupSlotsBySection(slots);

        const candidates: GeneratedQuestion[] = [];
        let completedSections = 0;
        const totalSections = slotsBySection.size;

        for (const [sectionId, sectionSlots] of slotsBySection.entries()) {
          const progress = 10 + Math.round((completedSections / totalSections) * 40);
          sendEvent({ stage: 'generating', progress, message: 'Generating candidates for ' + sectionSlots[0].sectionTitle + '...' });
          
          const batchCandidates = await generateBatch(sectionSlots);
          candidates.push(...batchCandidates);
          completedSections++;
          
          await new Promise(r => setTimeout(r, 1000));
        }

        sendEvent({ stage: 'generating', progress: 55, message: 'Generated ' + candidates.length + ' total candidates.' });
        sendEvent({ stage: 'validating', progress: 60, message: 'Running LLM quality validation on candidates...' });
        
        const validationResults = await validateBatch(candidates, 15);

        sendEvent({ stage: 'novelty', progress: 75, message: 'Running embedding & lexical novelty checks against 820 PYQs...' });
        const noveltyResults = await runNoveltyFilter(candidates);

        sendEvent({ stage: 'assembling', progress: 85, message: 'Selecting best 120 questions and ordering paper...' });
        const assembly = assembleFinal(candidates, validationResults, noveltyResults);

        if (assembly.questions.length < 120) {
          console.warn('Warning: Assembled paper has less than 120 questions', assembly.warnings);
        }

        sendEvent({ stage: 'saving', progress: 95, message: 'Saving mock paper to database...' });
        
        const mockCount = await prisma.pYQ.count({ where: { examStage: 'AI Mock' } });
        const paperName = 'AI Full Mock #' + (Math.floor(mockCount / 120) + 1);
        
        await prisma.$transaction(
          assembly.questions.map(q => {
            const optionsArray = q.optionsJson || [];
            return prisma.pYQ.create({
              data: {
                year: 2026,
                examStage: 'AI Mock',
                paper: paperName,
                questionNumber: q.mockNumber,
                questionText: q.questionText,
                optionsJson: JSON.stringify(optionsArray),
                correctAnswer: q.correctAnswer,
                explanation: null,
                difficulty: q.difficulty,
                questionType: q.archetype,
                subjectArea: q.subjectArea,
                sourceFile: 'AI_GENERATOR',
                passageText: q.passageText,
                contentJson: null,
              }
            });
          })
        );

        sendEvent({ 
          stage: 'complete', 
          progress: 100, 
          message: 'Mock paper generated successfully!', 
          mockId: paperName,
          warnings: assembly.warnings 
        });

        controller.close();
      } catch (error: any) {
        console.error('Generation pipeline failed:', error);
        sendEvent({ stage: 'error', progress: 100, message: error.message || 'Generation failed' });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

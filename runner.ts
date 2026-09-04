import { mapChaptersToTopics, mapPYQsToTopics, mapPYQsToChapters } from './src/lib/import/intelligence-pipeline';

async function run() {
  console.log('Starting Phase 7 AI Pipeline...');
  
  console.log('\n--- Step 1: Mapping Chapters ---');
  const chRes = await mapChaptersToTopics();
  console.log('Chapters result:', chRes);
  
  console.log('\n--- Step 2: Mapping PYQs ---');
  const pyqRes = await mapPYQsToTopics();
  console.log('PYQs result:', pyqRes);
  
  console.log('\n--- Step 3: Linking Chapters to PYQs ---');
  const linkRes = await mapPYQsToChapters();
  console.log('Links result:', linkRes);
  
  console.log('\nPipeline Complete!');
}

run().catch(console.error);

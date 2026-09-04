import { importTimetable } from './src/lib/import/timetable-importer';

async function run() {
  console.log('Starting timetable import...');
  const result = await importTimetable();
  console.log('Result:', result);
}
run();

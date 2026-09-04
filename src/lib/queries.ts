import prisma from './db';

export async function getBookCount() {
  return prisma.book.count();
}

export async function getChapterCount() {
  return prisma.chapter.count();
}

export async function getPyqCount() {
  return prisma.pYQ.count();
}

export async function getSyllabusTopicCount() {
  return prisma.syllabusTopic.count();
}

export async function getDueRevisionCount() {
  return prisma.revisionItem.count({ where: { status: 'pending' } });
}

export async function getPendingTaskCount() {
  return prisma.studyTask.count({ where: { status: 'not_started' } });
}

export async function getOptionalStats(subjectName: 'Anthropology' | 'Sociology') {
  const totalCount = await prisma.pYQ.count({ where: { examStage: subjectName } });
  
  const yearData = await prisma.pYQ.groupBy({
    by: ['year'],
    where: { examStage: subjectName },
    orderBy: { year: 'asc' }
  });
  
  const years = yearData.map(y => y.year);
  
  return {
    totalCount,
    yearsAvailable: years.length,
    yearRange: years.length > 0 ? `${years[0]}–${years[years.length - 1]}` : 'N/A'
  };
}

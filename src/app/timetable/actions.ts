'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function toggleTaskStatus(taskId: number, currentStatus: string) {
  const newStatus = currentStatus === 'completed' ? 'not_started' : 'completed';
  
  await prisma.studyTask.update({
    where: { id: taskId },
    data: { status: newStatus }
  });
  
  revalidatePath('/timetable');
}

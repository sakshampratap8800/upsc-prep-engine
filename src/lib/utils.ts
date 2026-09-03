import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getRelevanceColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200';
    case 'important': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'low': return 'bg-gray-100 text-gray-600 border-gray-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'not_started': return 'bg-gray-100 text-gray-600';
    case 'needs_revision': return 'bg-amber-100 text-amber-800';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export const EXAM_STAGES = ['Prelims', 'Mains', 'Essay', 'Anthropology', 'Sociology'] as const;
export const GS_PAPERS = ['GS-I', 'GS-II', 'GS-III', 'GS-IV'] as const;
export const SUBJECTS = ['History', 'Geography', 'Economics', 'Politics'] as const;
export const RELEVANCE_LEVELS = ['HIGH PRIORITY', 'IMPORTANT', 'MEDIUM', 'LOW PRIORITY'] as const;
export const ERROR_TYPES = [
  'did_not_know', 'forgot', 'misread', 'confused_concepts',
  'silly_mistake', 'elimination_failure', 'time_issue', 'weak_understanding'
] as const;

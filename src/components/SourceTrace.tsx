import { BookOpen, FileText, Sparkles } from 'lucide-react';

interface SourceTraceProps {
  type: 'ncert' | 'pyq' | 'ai';
  book?: string;
  chapter?: string;
  page?: number;
  exam?: string;
  year?: number;
  paper?: string;
  questionNumber?: number;
}

export function SourceTrace({ type, book, chapter, page, exam, year, paper, questionNumber }: SourceTraceProps) {
  if (type === 'ncert') {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
        <BookOpen className="h-3 w-3" />
        <span>
          {book && <span className="font-medium">{book}</span>}
          {chapter && <span> • {chapter}</span>}
          {page && <span> • p.{page}</span>}
        </span>
      </div>
    );
  }

  if (type === 'pyq') {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
        <FileText className="h-3 w-3" />
        <span>
          {exam && <span className="font-medium">{exam}</span>}
          {year && <span> {year}</span>}
          {paper && <span> • {paper}</span>}
          {questionNumber && <span> • Q.{questionNumber}</span>}
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2.5 py-1 text-xs text-purple-700">
      <Sparkles className="h-3 w-3" />
      <span className="font-medium">AI Synthesis</span>
    </div>
  );
}

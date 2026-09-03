'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Database, BookOpen, FileQuestion, GraduationCap, Calendar, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface ImportResult {
  success: boolean;
  [key: string]: unknown;
}

export default function ImportPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ImportResult>>({});

  const runImport = async (type: string) => {
    setLoading(type);
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      setResults((prev) => ({ ...prev, [type]: data }));
    } catch (error) {
      setResults((prev) => ({ ...prev, [type]: { success: false, error: String(error) } }));
    }
    setLoading(null);
  };

  const importItems = [
    { type: 'ncert', label: 'Import NCERTs', desc: '23 NCERT PDFs from economics, geography, history, politics', icon: BookOpen },
    { type: 'pyq', label: 'Import PYQs', desc: '121 PYQ PDFs (Prelims, Mains, Essay, Anthropology, Sociology) 2016-2026', icon: FileQuestion },
    { type: 'syllabus', label: 'Import Syllabus', desc: 'UPSC CSE official syllabus PDF', icon: GraduationCap },
    { type: 'timetable', label: 'Import Timetable', desc: '18-month study timetable', icon: Calendar },
    { type: 'all', label: 'Import Everything', desc: 'Run all imports in sequence', icon: Database },
  ];

  return (
    <div>
      <PageHeader
        title="Import Data"
        description="Import your study materials into the database. Source files are read from your local folders."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {importItems.map((item) => {
          const Icon = item.icon;
          const result = results[item.type];
          const isLoading = loading === item.type;

          return (
            <div key={item.type} className="rounded-xl border border-stone-200 bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-stone-100 p-2.5">
                  <Icon className="h-5 w-5 text-stone-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-stone-900">{item.label}</h3>
                  <p className="mt-1 text-xs text-stone-500">{item.desc}</p>

                  <button
                    onClick={() => runImport(item.type)}
                    disabled={loading !== null}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Importing...</>
                    ) : (
                      'Start Import'
                    )}
                  </button>

                  {result && (
                    <div className={`mt-4 rounded-lg p-3 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                          {result.success ? 'Import completed' : 'Import had errors'}
                        </span>
                      </div>
                      <pre className="mt-2 max-h-40 overflow-auto text-xs text-stone-600">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

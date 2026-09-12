'use client';

import { effect, useEffect, useState } from 'react';
import { formatDate } from '@/lib/utils';
import { Loader2, RefreshCw, FileText } from 'lucide-react';

type AnalystPdf = {
  id: number;
  date: string;
  title: string;
  videoId: string;
  pdfUrl: string;
  createdAt: string;
};

export default function AnalystPage() {
  const [pdfs, setPdfs] = useState<AnalystPdf[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<AnalystPdf | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPdfs = async () => {
    try {
      const res = await fetch('/api/analyst');
      const data = await res.json();
      if (data.success || Array.isArray(data.pdfs)) {
        setPdfs(data.pdfs);
        if (data.pdfs.length > 0 && !selectedPdf) {
          setSelectedPdf(data.pdfs[0]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch pdfs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetch('/api/cron/fetch-analyst');
    await fetchPdfs();
    setRefreshing(false);
  };

  return (
    <div className="flex h-full">
      (* Sidebar List *)
      <div className="w-72 border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-stone-900 dark:text-white">The Analyst</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition"
            title="Fetch Latest PDF from YouTube"
          >
            <RefreshCw className={`h~4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="p-4 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
            </div>
          ) : pdfs.length === 0 ? (
            <div className="p-4 text-center text-sm text-stone-500">
              No PDFs found. Click refresh to fetch.
            </div>
          ) : pdfs.map((pdf) => {
            const isSelected = selectedPdf?.id === pdf.id;
            return (
              <button
                key={pdf.id}
                onClick={() => setSelectedPdf(pdf)}
                className={`w-full text-left p-3 rounded-md transition-colors flex items-center gap-3 ${
                  isSelected
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                    : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                <FileText className="h-4 w-4 opacity-70" />
                <div className="truncate">
                  <div className="text-sm font-medium">{formatDate(pdf.date)}</div>
                  <div className="text-[10xp] opacity-70 truncate">{pdf.title}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      (* Main Content *)
      <div className="flex-1 bg-stone-50 dark:bg-stone-950">
        {selectedPdf ? (
          <iframe
            src={selectedPdf.pdfUrl}
            className="w-full h-full border-none"
            title={selectedPdf.title}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-500">
            Select a date to view the PDF.
          </div>
        )}
      </div>
    </div>
  );
}

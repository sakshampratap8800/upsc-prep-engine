'use client';

import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/utils';
import { Loader2, RefreshCw, FileText, ExternalLink } from 'lucide-react';

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
    <div 
      className="flex flex-col md:flex-row bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden" 
      style={{ height: 'calc(100vh - 120px)', minHeight: '600px' }}
    >
      {/* Sidebar List */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-stone-200 dark:border-stone-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <h1 className="text-lg font-bold text-stone-900 dark:text-white">The Analyst</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition-colors"
            title="Fetch Latest PDF from YouTube"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
            </div>
          ) : pdfs.length === 0 ? (
            <div className="py-8 text-center text-sm text-stone-500">
              No PDFs found. Click refresh to fetch.
            </div>
          ) : pdfs.map((pdf) => {
            const isSelected = selectedPdf?.id === pdf.id;
            return (
              <button
                key={pdf.id}
                onClick={() => setSelectedPdf(pdf)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold'
                    : 'hover:bg-stone-50 dark:hover:bg-stone-800/50 text-stone-700 dark:text-stone-300 font-medium'
                }`}
              >
                <FileText className={`h-4 w-4 shrink-0 ${isSelected ? 'text-blue-500' : 'opacity-50'}`} />
                <span className="text-sm truncate">
                  {formatDate(pdf.date)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Viewer */}
      <div className="flex-1 bg-stone-100 dark:bg-stone-950 flex flex-col relative">
        {selectedPdf ? (
          <>
            <div className="absolute top-0 right-0 z-10 p-2 opacity-50 hover:opacity-100 transition-opacity">
              <a
                href={selectedPdf.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-stone-800/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-stone-900 transition"
                title="Open Native PDF"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Pop-out Tab
              </a>
            </div>
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedPdf.pdfUrl)}&embedded=true`}
              className="absolute inset-0 w-full h-full border-none bg-stone-100 dark:bg-stone-950"
              title={selectedPdf.title}
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-stone-500 text-sm">
            Select a date to view the PDF.
          </div>
        )}
      </div>
    </div>
  );
}

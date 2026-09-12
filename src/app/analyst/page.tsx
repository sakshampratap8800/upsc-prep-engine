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
      className="flex flex-col bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden w-full" 
      style={{ height: 'calc(100vh - 120px)', minHeight: '600px' }}
    >
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between p-3.5 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shrink-0">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h1 className="text-base font-bold text-stone-900 dark:text-white tracking-tight">
            The Analyst
          </h1>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-stone-400 ml-2" />}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition-colors"
            title="Fetch Latest PDF from YouTube"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          
          {pdfs.length > 0 && (
            <select
              value={selectedPdf?.id || ''}
              onChange={(e) => {
                const pdf = pdfs.find(p => p.id === parseInt(e.target.value));
                if (pdf) setSelectedPdf(pdf);
              }}
              className="bg-stone-100 dark:bg-stone-800 border-none rounded-lg px-3 py-1.5 text-sm font-medium text-stone-800 dark:text-stone-200 cursor-pointer focus:ring-2 focus:ring-blue-500/50 appearance-none min-w-[140px]"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1em 1em',
                paddingRight: '2rem'
              }}
            >
              {pdfs.map((pdf) => (
                <option key={pdf.id} value={pdf.id}>
                  {formatDate(pdf.date)}
                </option>
              ))}
            </select>
          )}

          {selectedPdf && (
            <a
              href={selectedPdf.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition-colors"
              title="Pop-out Tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      {/* Main Content Viewer */}
      <div className="flex-1 bg-stone-100 dark:bg-stone-950 relative">
        {selectedPdf ? (
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedPdf.pdfUrl)}&embedded=true`}
            className="absolute inset-0 w-full h-full border-none"
            title={selectedPdf.title}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-500 text-sm">
            {pdfs.length === 0 && !loading 
              ? "No PDFs found. Click the refresh button to fetch." 
              : "Select a date to view the PDF."}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useEditMode } from '@/context/EditModeContext';
import { Map, Upload, X, PenTool, Eraser, Loader2, Save, RotateCcw, Maximize } from 'lucide-react';

interface MapImage {
  url: string;
  title: string;
  uploadedAt: string;
}

interface Props {
  chapterId: number;
  initialImagesJson: string | null;
}

const ScratchPadImage = ({ image }: { image: MapImage }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<'pen' | 'eraser' | 'view'>('view');
  const [isExpanded, setIsExpanded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      // Ensure canvas matches container dimensions without clearing content if possible,
      // but resizing canvas clears it natively. So we just set initial size.
      if (canvas.width === 0) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    
    // Initial size
    setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (mode === 'view') return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode === 'view') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x = 0;
    let y = 0;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineWidth = mode === 'eraser' ? 20 : 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = mode === 'eraser' ? 'rgba(0,0,0,1)' : 'rgba(255,0,0,0.8)';
    
    if (mode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-2">
        <h4 className="font-medium text-stone-800 dark:text-stone-200">{image.title}</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(mode === 'pen' ? 'view' : 'pen')}
            className={`p-2 rounded-lg transition ${mode === 'pen' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500'}`}
            title="Pen Tool (Red)"
          >
            <PenTool className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMode(mode === 'eraser' ? 'view' : 'eraser')}
            className={`p-2 rounded-lg transition ${mode === 'eraser' ? 'bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-200' : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500'}`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>
          <button
            onClick={clearCanvas}
            className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition"
            title="Clear All Drawings"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition"
            title="Expand Image"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4" 
          onClick={() => setIsExpanded(false)}
        >
          <button 
            className="absolute top-4 right-4 z-50 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition"
            onClick={() => setIsExpanded(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="w-full h-full overflow-auto flex items-center justify-center">
            <img 
              src={image.url} 
              alt={image.title} 
              className="max-w-[150vw] max-h-[150vh] sm:max-w-none sm:max-h-none object-contain cursor-zoom-out" 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
            />
          </div>
        </div>
      )}

      <div 
        ref={containerRef} 
        className={`relative w-full rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-900 shadow-sm ${mode === 'view' ? 'cursor-zoom-in' : ''}`}
        onClick={() => {
          if (mode === 'view') setIsExpanded(true);
        }}
      >
        <img 
          src={image.url} 
          alt={image.title} 
          className="w-full h-auto object-contain block pointer-events-none select-none" 
          onLoad={() => {
            if (canvasRef.current && containerRef.current) {
              canvasRef.current.width = containerRef.current.clientWidth;
              canvasRef.current.height = containerRef.current.clientHeight;
            }
          }}
        />
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className={`absolute top-0 left-0 w-full h-full ${mode !== 'view' ? 'cursor-crosshair touch-none' : 'pointer-events-none'}`}
        />
      </div>
    </div>
  );
};

export const ChapterMapGallery = ({ chapterId, initialImagesJson }: Props) => {
  const { isEditMode, authToken } = useEditMode();
  const safeJSONParse = <T,>(jsonStr: string | null, fallback: T): T => {
    if (!jsonStr) return fallback;
    try {
      return JSON.parse(jsonStr) as T;
    } catch (e) {
      console.error('Failed to parse initialImagesJson:', e);
      return fallback;
    }
  };
  const [images, setImages] = useState<MapImage[]>(safeJSONParse<MapImage[]>(initialImagesJson, []));
  const [isUploading, setIsUploading] = useState(false);
  const [filenamePrefix, setFilenamePrefix] = useState('Map');
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('file', files[i]);
    }
    formData.append('chapterId', chapterId.toString());
    formData.append('filenamePrefix', filenamePrefix);

    try {
      const res = await fetch('/api/chapter/upload-map', {
        method: 'POST',
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        // Refresh images list (naive append for UI, but realistically we should just reload or append)
        const newImages = [...images];
        data.urls.forEach((url: string, idx: number) => {
          newImages.push({
            url,
            title: filenamePrefix + (files.length > 1 ? ` ${idx+1}` : ''),
            uploadedAt: new Date().toISOString()
          });
        });
        setImages(newImages);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      alert('Upload failed. Check console.');
      console.error(err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  if (!isEditMode && images.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Map className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          Chapter Maps & Diagrams
        </h3>
      </div>

      {isEditMode && (
        <div className="bg-stone-50 dark:bg-stone-900/50 p-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 space-y-3">
          <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300">Upload New Maps</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              placeholder="Map Name (e.g., Physical Features)"
              value={filenamePrefix}
              onChange={e => setFilenamePrefix(e.target.value)}
              className="flex-1 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleUpload}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <button disabled={isUploading} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 dark:hover:bg-white transition disabled:opacity-50">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload Files
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 mt-4">
        {images.map((img, idx) => (
          <ScratchPadImage key={idx} image={img} />
        ))}
      </div>
    </div>
  );
};

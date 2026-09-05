'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Loader2, 
  HelpCircle, 
  AlertTriangle, 
  Lightbulb, 
  BookOpen, 
  Upload,
  Image as ImageIcon,
  Trash2,
  Edit2,
  Save,
  X,
  Plus,
  Maximize2,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useEditMode } from '@/context/EditModeContext';

interface PYQInteractiveSolverProps {
  pyq: {
    id: number;
    year: number;
    examStage: string;
    paper: string;
    questionNumber: number | null;
    questionText: string;
    options: string[];
    correctAnswer: string | null;
    explanation: string | null;
    subjectArea: string | null;
    difficulty: string | null;
    directiveWord: string | null;
    questionType: string | null;
    imageUrl?: string | null;
    passageText?: string | null;
  };
}

export function PYQInteractiveSolver({ pyq: initialPyq }: PYQInteractiveSolverProps) {
  const [pyq, setPyq] = useState(initialPyq);
  const { isEditMode } = useEditMode();
  const [passageCollapsed, setPassageCollapsed] = useState(false);

  // Answer & Evaluation States
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [result, setResult] = useState<{
    correctAnswer: string | null;
    isCorrect: boolean | null;
    explanation: string | null;
    optionBreakdown: Record<string, string>;
    subjectArea?: string | null;
    difficulty?: string | null;
    eliminationTrick?: string | null;
    attemptId?: number | null;
  } | null>(null);

  const [aiBreakdownLoading, setAiBreakdownLoading] = useState(false);
  const [aiBreakdown, setAiBreakdown] = useState<{
    explanation: string | null;
    optionBreakdown: Record<string, string>;
    eliminationTrick?: string | null;
  } | null>(null);

  const [loggingError, setLoggingError] = useState(false);
  const [errorLogged, setErrorLogged] = useState(false);
  const [selectedErrorType, setSelectedErrorType] = useState<string>('confused_concepts');

  // Edit Form States
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedText, setEditedText] = useState(pyq.questionText);
  const [editedPassage, setEditedPassage] = useState(pyq.passageText || '');
  const [applyToRange, setApplyToRange] = useState(false);
  const [rangeStart, setRangeStart] = useState<number>(pyq.questionNumber || 1);
  const [rangeEnd, setRangeEnd] = useState<number>(pyq.questionNumber || 1);
  const [editedOptions, setEditedOptions] = useState<string[]>(pyq.options || []);
  const [editedCorrectAnswer, setEditedCorrectAnswer] = useState(pyq.correctAnswer || '');
  const [savingChanges, setSavingChanges] = useState(false);

  // Image Upload States
  const [uploadingImage, setUploadingImage] = useState(false);
  const [applyImageToRange, setApplyImageToRange] = useState(false);
  const [imageRangeStart, setImageRangeStart] = useState<number>(pyq.questionNumber || 1);
  const [imageRangeEnd, setImageRangeEnd] = useState<number>(pyq.questionNumber || 1);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isMCQ = pyq.options && pyq.options.length > 0;

  // Sync state whenever the current question changes (e.g. Next / Prev navigation)
  useEffect(() => {
    setEditedText(pyq.questionText);
    setEditedPassage(pyq.passageText || '');
    setEditedOptions(pyq.options || []);
    setEditedCorrectAnswer(pyq.correctAnswer || '');
    setRangeStart(pyq.questionNumber || 1);
    setRangeEnd(pyq.questionNumber || 1);
    setImageRangeStart(pyq.questionNumber || 1);
    setImageRangeEnd(pyq.questionNumber || 1);
    setSelectedOption(null);
    setTextAnswer('');
    setResult(null);
    setAiBreakdown(null);
    setIsEditingText(false);
  }, [pyq.id, pyq.questionNumber, pyq.questionText, pyq.options, pyq.correctAnswer, pyq.passageText]);

  // Handle direct Ctrl+V clipboard paste anywhere on the page when in edit mode
  useEffect(() => {
    if (!isEditMode) return;

    const handlePaste = async (e: ClipboardEvent) => {
      // Don't intercept if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && target.getAttribute('type') !== 'file') {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            await uploadImageFile(blob);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [isEditMode, pyq.id, applyImageToRange, imageRangeStart, imageRangeEnd]);

  const [gdriveInputUrl, setGdriveInputUrl] = useState('');
  const [savingGdriveUrl, setSavingGdriveUrl] = useState(false);

  // Helper to convert Google Drive sharing link to direct view image URL
  const formatGoogleDriveUrl = (url: string): string => {
    const trimmed = url.trim();
    // Matches file/d/<FILE_ID>/ or id=<FILE_ID>
    const idMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
    }
    return trimmed;
  };

  const handleSaveGdriveUrl = async () => {
    if (!gdriveInputUrl.trim()) return;
    setSavingGdriveUrl(true);
    const directUrl = formatGoogleDriveUrl(gdriveInputUrl);
    try {
      const res = await fetch('/api/pyq/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: pyq.id, 
          imageUrl: directUrl,
          applyImageToRange: applyImageToRange ? { startQ: imageRangeStart, endQ: imageRangeEnd } : undefined
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPyq((prev) => ({ ...prev, imageUrl: directUrl }));
        setGdriveInputUrl('');
        alert(applyImageToRange ? `Saved and linked diagram to Questions ${imageRangeStart} to ${imageRangeEnd}!` : 'Saved diagram URL!');
      } else {
        alert('Failed to save link: ' + (data.error || 'Unknown error'));
      }
    } catch (e: any) {
      console.error('Failed to save Google Drive link:', e);
      alert('Error: ' + e.message);
    }
    setSavingGdriveUrl(false);
  };

  const uploadImageFile = async (file: File | Blob) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      // Ensure a filename is provided for clipboard blobs
      const fileName = (file instanceof File && file.name) ? file.name : `screenshot_${Date.now()}.png`;
      formData.append('file', file, fileName);
      formData.append('pyqId', String(pyq.id));

      if (applyImageToRange) {
        formData.append('rangeStart', String(imageRangeStart));
        formData.append('rangeEnd', String(imageRangeEnd));
      }

      console.log('Uploading diagram for PYQ ID:', pyq.id, 'File:', fileName, 'Type:', file.type, 'Range:', applyImageToRange ? `${imageRangeStart}-${imageRangeEnd}` : 'Single');

      const res = await fetch('/api/pyq/upload-image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      console.log('Upload response:', data);

      if (data.success && data.imageUrl) {
        setPyq((prev) => ({ ...prev, imageUrl: data.imageUrl }));
        if (applyImageToRange) {
          alert(`Diagram successfully uploaded and linked to Questions ${imageRangeStart} to ${imageRangeEnd}!`);
        }
      } else {
        const msg = data.error || data.message || JSON.stringify(data);
        console.error('Upload failed with message:', msg);
        alert(`Upload failed: ${msg}`);
      }
    } catch (e: any) {
      console.error('Image upload failed exception:', e);
      alert(`Upload failed: ${e.message || e}`);
    }
    setUploadingImage(false);
  };

  const handleRemoveImage = async () => {
    if (!confirm('Remove this diagram from the question?')) return;
    try {
      const res = await fetch('/api/pyq/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pyq.id, imageUrl: null }),
      });
      const data = await res.json();
      if (data.success) {
        setPyq((prev) => ({ ...prev, imageUrl: null }));
      }
    } catch (e) {
      console.error('Failed to remove image:', e);
    }
  };

  const handleSaveTextEdits = async () => {
    setSavingChanges(true);
    try {
      const res = await fetch('/api/pyq/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pyq.id,
          questionText: editedText,
          options: editedOptions,
          correctAnswer: editedCorrectAnswer,
          passageText: editedPassage,
          applyPassageToRange: applyToRange ? { startQ: rangeStart, endQ: rangeEnd } : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPyq((prev) => ({
          ...prev,
          questionText: editedText,
          options: editedOptions,
          correctAnswer: editedCorrectAnswer,
          passageText: editedPassage,
        }));
        setIsEditingText(false);
      } else {
        alert('Save failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e: any) {
      console.error('Save edits failed:', e);
      alert('Save failed: ' + e.message);
    }
    setSavingChanges(false);
  };

  // Instant official key check (0 tokens / 0 latency)
  const handleSelectOption = (optionLetter: string) => {
    setSelectedOption(optionLetter);
    const officialKey = (pyq.correctAnswer || '').trim().toUpperCase();
    const cleanChoice = optionLetter.trim().toUpperCase();
    
    // Support multi-option keys e.g. "B, D" or "A, C"
    const isCorrect = officialKey ? (officialKey.includes(cleanChoice) || cleanChoice.includes(officialKey)) : null;

    setResult({
      correctAnswer: pyq.correctAnswer,
      isCorrect,
      explanation: pyq.explanation,
      optionBreakdown: {},
      subjectArea: pyq.subjectArea,
      difficulty: pyq.difficulty,
    });
  };

  // On-demand AI evaluation triggered ONLY when clicking "Evaluate with AI"
  const handleRequestAiBreakdown = async () => {
    const ans = selectedOption || textAnswer;
    setAiBreakdownLoading(true);
    try {
      const res = await fetch('/api/evaluate-pyq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pyqId: pyq.id,
          userAnswer: ans,
          timeTakenSeconds: 30,
          generateAiBreakdown: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiBreakdown({
          explanation: data.explanation,
          optionBreakdown: data.optionBreakdown || {},
          eliminationTrick: data.eliminationTrick,
        });
      }
    } catch (e) {
      console.error('AI evaluation failed:', e);
    }
    setAiBreakdownLoading(false);
  };

  const handleLogError = async () => {
    if (!result) return;
    setLoggingError(true);
    try {
      const res = await fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: result.attemptId || pyq.id,
          errorType: selectedErrorType,
          description: `Mistake on ${pyq.examStage} ${pyq.year} ${pyq.paper} Q.${pyq.questionNumber || pyq.id}`,
        }),
      });
      if (res.ok) {
        setErrorLogged(true);
      }
    } catch (e) {
      console.error('Error logging failed:', e);
    }
    setLoggingError(false);
  };

  return (
    <div ref={cardRef} tabIndex={0} className="space-y-6 outline-none">
      {/* Question Card */}
      <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 md:p-8 shadow-xs transition-colors">
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            {pyq.examStage} • {pyq.paper} • {pyq.year} {pyq.questionNumber ? `• Q.${pyq.questionNumber}` : ''}
          </span>
          <div className="flex items-center gap-2">
            {pyq.subjectArea && (
              <span className="rounded-md bg-stone-100 dark:bg-stone-800 px-2.5 py-1 text-xs font-semibold text-stone-700 dark:text-stone-300">
                {pyq.subjectArea}
              </span>
            )}
            {pyq.difficulty && (
              <span className="rounded-md bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                {pyq.difficulty}
              </span>
            )}

            {/* Edit Button when Master Edit Mode is active */}
            {isEditMode && (
              <button
                onClick={() => setIsEditingText(!isEditingText)}
                className="flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-black px-2.5 py-1 text-xs font-bold transition cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>{isEditingText ? 'Cancel' : 'Edit'}</span>
              </button>
            )}
          </div>
        </div>

        {/* INLINE QUESTION TEXT & OPTIONS EDITOR (Edit Mode) */}
        {isEditingText ? (
          <div className="space-y-4 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-amber-50/50 dark:bg-amber-950/20 p-4 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Edit Question Text, Passage & Options
            </h3>

            {/* Reading Passage Editor */}
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-stone-850 p-3 space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                <FileText className="h-3.5 w-3.5" />
                Reading Passage / Context (Optional - for CSAT / Case Studies):
              </label>
              <textarea
                value={editedPassage}
                onChange={(e) => setEditedPassage(e.target.value)}
                placeholder="Paste the shared passage text here (e.g. Directions for following items...)..."
                rows={4}
                className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 p-2.5 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none"
              />

              {/* Range Apply Checkbox */}
              <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800 dark:text-stone-200">
                  <input
                    type="checkbox"
                    checked={applyToRange}
                    onChange={(e) => setApplyToRange(e.target.checked)}
                    className="h-4 w-4 rounded accent-amber-600"
                  />
                  <span>Apply this passage to multiple questions in this same paper?</span>
                </label>

                {applyToRange && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-stone-600 dark:text-stone-400 font-medium">From Q.</span>
                    <input
                      type="number"
                      min={1}
                      max={150}
                      value={rangeStart}
                      onChange={(e) => setRangeStart(parseInt(e.target.value, 10) || 1)}
                      className="w-14 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-2 py-1 font-bold text-stone-900 dark:text-stone-100"
                    />
                    <span className="text-stone-600 dark:text-stone-400 font-medium">to Q.</span>
                    <input
                      type="number"
                      min={1}
                      max={150}
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(parseInt(e.target.value, 10) || 1)}
                      className="w-14 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-2 py-1 font-bold text-stone-900 dark:text-stone-100"
                    />
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                      ({pyq.year} {pyq.examStage} {pyq.paper} only)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Question Text:
              </label>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 p-3 text-sm text-stone-900 dark:text-stone-100 focus:outline-none"
              />
            </div>

            {/* Editable Options */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Options ({editedOptions.length} total):
                </label>
                <button
                  type="button"
                  onClick={() => setEditedOptions([...editedOptions, ''])}
                  className="flex items-center gap-1 rounded-md bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 px-2.5 py-1 text-[11px] font-bold text-stone-800 dark:text-stone-200 transition cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Option</span>
                </button>
              </div>

              {editedOptions.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-200 dark:bg-stone-800 text-xs font-bold text-stone-800 dark:text-stone-200">
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  <input
                    type="text"
                    value={opt}
                    placeholder={`Option ${String.fromCharCode(65 + oIdx)} text...`}
                    onChange={(e) => {
                      const newOpts = [...editedOptions];
                      newOpts[oIdx] = e.target.value;
                      setEditedOptions(newOpts);
                    }}
                    className="flex-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 text-xs sm:text-sm text-stone-900 dark:text-stone-100"
                  />
                  {editedOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newOpts = editedOptions.filter((_, idx) => idx !== oIdx);
                        setEditedOptions(newOpts);
                      }}
                      title="Remove this option"
                      className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Correct Answer (e.g. A, B, C, D):
                </label>
                <input
                  type="text"
                  value={editedCorrectAnswer}
                  onChange={(e) => setEditedCorrectAnswer(e.target.value.toUpperCase())}
                  className="w-24 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="flex items-end gap-2 flex-1 justify-end">
                <button
                  onClick={() => setIsEditingText(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTextEdits}
                  disabled={savingChanges}
                  className="flex items-center gap-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-4 py-1.5 text-xs font-bold shadow-xs hover:bg-stone-800 dark:hover:bg-white"
                >
                  {savingChanges ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* PASSAGE / CONTEXT DISPLAY (When available) */}
            {pyq.passageText && (
              <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 p-5 shadow-xs transition-all">
                <div className="flex items-center justify-between gap-3 border-b border-blue-200/60 dark:border-blue-900/40 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-white text-[10px] font-bold">
                      <FileText className="h-3 w-3" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                      Reading Comprehension Passage / Context
                    </span>
                  </div>
                  <button
                    onClick={() => setPassageCollapsed(!passageCollapsed)}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 cursor-pointer"
                  >
                    <span>{passageCollapsed ? 'Show Passage' : 'Hide'}</span>
                    {passageCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {!passageCollapsed && (
                  <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap font-serif italic bg-white/60 dark:bg-stone-900/60 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40">
                    {pyq.passageText}
                  </p>
                )}
              </div>
            )}

            <h2 className="text-base md:text-lg font-semibold text-stone-900 dark:text-stone-100 leading-relaxed whitespace-pre-wrap">
              {pyq.questionText}
            </h2>
          </div>
        )}

        {/* QUESTION DIAGRAM / IMAGE DISPLAY */}
        {pyq.imageUrl && (
          <div className="my-5 flex flex-col items-center rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-4 relative group">
            <img
              src={pyq.imageUrl}
              alt={`Diagram for Question ${pyq.questionNumber || pyq.id}`}
              className="max-h-80 w-auto object-contain rounded-xl shadow-xs cursor-zoom-in"
              onClick={() => setZoomedImage(pyq.imageUrl || null)}
            />
            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition bg-black/60 backdrop-blur rounded-lg p-1">
              <button
                onClick={() => setZoomedImage(pyq.imageUrl || null)}
                title="Zoom image"
                className="p-1.5 text-white hover:text-amber-300"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              {isEditMode && (
                <button
                  onClick={handleRemoveImage}
                  title="Remove image"
                  className="p-1.5 text-white hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* UPLOAD / PASTE DIAGRAM ZONE (Visible when Edit Mode is ON) */}
        {isEditMode && (
          <div className="my-5 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700/80 bg-amber-50/40 dark:bg-amber-950/20 p-5 space-y-3 text-center">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImageFile(file);
              }}
            />
            
            <div className="flex flex-col items-center justify-center gap-2">
              <ImageIcon className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  {pyq.imageUrl ? 'Replace Question Diagram' : 'Upload Question Diagram'}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Click below to choose file or press <kbd className="rounded bg-stone-200 dark:bg-stone-800 px-1 font-mono">Ctrl + V</kbd> to paste screenshot.
                </p>
              </div>

              {/* Range apply checkbox for shared diagrams */}
              <div className="mt-1 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 max-w-lg w-full flex flex-col items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800 dark:text-stone-200">
                  <input
                    type="checkbox"
                    checked={applyImageToRange}
                    onChange={(e) => setApplyImageToRange(e.target.checked)}
                    className="h-4 w-4 rounded accent-amber-600"
                  />
                  <span>Apply this diagram to multiple questions in this same paper?</span>
                </label>

                {applyImageToRange && (
                  <div className="flex items-center gap-2 text-xs flex-wrap justify-center">
                    <span className="text-stone-600 dark:text-stone-400 font-medium">From Q.</span>
                    <input
                      type="number"
                      min={1}
                      max={150}
                      value={imageRangeStart}
                      onChange={(e) => setImageRangeStart(parseInt(e.target.value, 10) || 1)}
                      className="w-14 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-2 py-1 font-bold text-stone-900 dark:text-stone-100 text-center"
                    />
                    <span className="text-stone-600 dark:text-stone-400 font-medium">to Q.</span>
                    <input
                      type="number"
                      min={1}
                      max={150}
                      value={imageRangeEnd}
                      onChange={(e) => setImageRangeEnd(parseInt(e.target.value, 10) || 1)}
                      className="w-14 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-2 py-1 font-bold text-stone-900 dark:text-stone-100 text-center"
                    />
                    <span className="text-[11px] text-amber-800 dark:text-amber-400 font-medium">
                      ({pyq.year} {pyq.examStage} {pyq.paper} only)
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 text-xs font-bold transition cursor-pointer shadow-xs"
              >
                {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span>{uploadingImage ? 'Uploading & Linking...' : 'Upload Image'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Options for MCQ */}
        {isMCQ ? (
          <div className="mt-6 space-y-3">
            {pyq.options.map((opt, idx) => {
              const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D
              const isSelected = selectedOption === optionLetter || selectedOption === opt;
              
              let cardStyle = 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/50 hover:bg-stone-100 dark:hover:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-700 text-stone-800 dark:text-stone-200';
              let badgeStyle = 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300';

              if (result) {
                const isCorrectOption = 
                  result.correctAnswer?.toUpperCase().includes(optionLetter) ||
                  result.correctAnswer?.toLowerCase() === opt.toLowerCase();
                
                if (isCorrectOption) {
                  cardStyle = 'border-emerald-500 dark:border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-medium ring-1 ring-emerald-500';
                  badgeStyle = 'bg-emerald-600 text-white';
                } else if (isSelected && !result.isCorrect) {
                  cardStyle = 'border-rose-400 dark:border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 ring-1 ring-rose-400';
                  badgeStyle = 'bg-rose-600 text-white';
                }
              } else if (isSelected) {
                cardStyle = 'border-stone-900 dark:border-stone-100 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs';
                badgeStyle = 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white';
              }

              return (
                <button
                  key={idx}
                  onClick={() => {
                    handleSelectOption(optionLetter);
                  }}
                  className={`w-full text-left flex items-start gap-3.5 rounded-xl border p-4 transition cursor-pointer ${cardStyle}`}
                >
                  <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${badgeStyle}`}>
                    {optionLetter}
                  </span>
                  <span className="text-sm leading-relaxed flex-1">{opt}</span>
                  {result && (
                    result.correctAnswer?.toUpperCase().includes(optionLetter) ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : isSelected ? (
                      <XCircle className="h-5 w-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                    ) : null
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Descriptive / Mains answer input */
          <div className="mt-6 space-y-3">
            <textarea
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Draft your main points or framework here..."
              rows={4}
              className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 text-sm text-stone-900 dark:text-stone-100 focus:outline-none"
            />
          </div>
        )}

        {/* Evaluate with AI button (On-demand to save tokens) */}
        {(selectedOption || textAnswer) && !aiBreakdown && (
          <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Need deep explanation of why other options are traps?
            </p>
            <button
              onClick={handleRequestAiBreakdown}
              disabled={aiBreakdownLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-stone-900 dark:bg-stone-100 px-5 py-2.5 text-xs font-bold text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white disabled:opacity-50 transition cursor-pointer shadow-xs"
            >
              {aiBreakdownLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Evaluating with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300 dark:text-amber-500" />
                  <span>Evaluate with AI (Option Breakdown)</span>
                </>
              )}
            </button>
          </div>
        )}
      </section>

      {/* Result & Detailed Explanation Section */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Status Banner */}
          <div className={`rounded-2xl border p-5 flex items-start gap-4 ${
            result.isCorrect 
              ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200' 
              : 'border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200'
          }`}>
            {result.isCorrect ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="text-base font-bold">
                {result.isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}
              </h3>
              <p className="text-sm mt-1">
                Official / Verified Answer is Option <strong className="font-bold underline">{result.correctAnswer}</strong>.
              </p>
            </div>
          </div>

          {/* Option-by-Option Breakdown (Generated only on demand) */}
          {aiBreakdown?.optionBreakdown && Object.keys(aiBreakdown.optionBreakdown).length > 0 && (
            <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Option-by-Option Breakdown
              </h3>
              <div className="grid gap-3">
                {Object.entries(aiBreakdown.optionBreakdown).map(([optKey, explanationText]) => {
                  const isCorrectOpt = result.correctAnswer?.toUpperCase().includes(optKey);
                  return (
                    <div 
                      key={optKey} 
                      className={`rounded-xl border p-4 text-sm leading-relaxed ${
                        isCorrectOpt 
                          ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30' 
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-xs ${
                          isCorrectOpt ? 'bg-emerald-600 text-white' : 'bg-stone-300 dark:bg-stone-700 text-stone-800 dark:text-stone-200'
                        }`}>
                          {optKey}
                        </span>
                        <span className={isCorrectOpt ? 'text-emerald-900 dark:text-emerald-300' : 'text-stone-700 dark:text-stone-300'}>
                          {isCorrectOpt ? 'Correct Option Explanation' : 'Why this is incorrect / trap'}
                        </span>
                      </div>
                      <p className="text-stone-700 dark:text-stone-300 text-xs md:text-sm pl-7">{explanationText}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Conceptual Explanation */}
          {(aiBreakdown?.explanation || result.explanation) && (
            <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                <BookOpen className="h-4 w-4 text-stone-700 dark:text-stone-400" /> UPSC Conceptual Synthesis
              </h3>
              <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed bg-stone-50 dark:bg-stone-800 p-4 rounded-xl border border-stone-200 dark:border-stone-700">
                {aiBreakdown?.explanation || result.explanation}
              </p>
            </section>
          )}

          {/* Elimination Strategy */}
          {aiBreakdown?.eliminationTrick && (
            <section className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/30 p-5 space-y-2">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Elimination Tip / Exam Strategy
              </h4>
              <p className="text-sm text-amber-950 dark:text-amber-200 leading-relaxed font-medium">
                {aiBreakdown.eliminationTrick}
              </p>
            </section>
          )}

          {/* Mistake Logging Prompt if Incorrect */}
          {!result.isCorrect && (
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Log this mistake to your Error Log?
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Track your patterns to ensure you don't repeat this in Prelims.
                </p>
              </div>

              {errorLogged ? (
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  ✓ Logged to Error Log
                </span>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedErrorType}
                    onChange={(e) => setSelectedErrorType(e.target.value)}
                    className="rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-2.5 py-1.5 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
                  >
                    <option value="confused_concepts">Confused Concepts</option>
                    <option value="silly_mistake">Silly Mistake</option>
                    <option value="did_not_know">Did Not Know</option>
                    <option value="misread">Misread Question</option>
                    <option value="elimination_failure">Elimination Failure</option>
                    <option value="forgot">Forgot Revision</option>
                  </select>
                  <button
                    onClick={handleLogError}
                    disabled={loggingError}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer shadow-xs"
                  >
                    {loggingError ? 'Logging...' : 'Save Error'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FULL RESOLUTION IMAGE ZOOM MODAL */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={zoomedImage}
              alt="Zoomed Diagram"
              className="max-h-[85vh] w-auto rounded-xl object-contain shadow-2xl border border-stone-700"
            />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-3 -right-3 rounded-full bg-white dark:bg-stone-800 p-1.5 text-stone-900 dark:text-stone-100 shadow-lg hover:scale-110 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

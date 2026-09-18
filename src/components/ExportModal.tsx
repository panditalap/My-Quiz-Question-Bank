import React, { useState } from 'react';
import { X, Download, Copy, Check, FileSpreadsheet, FileCode, FileText, CheckCircle2 } from 'lucide-react';
import { Question, ExportFormat } from '../types';
import { generateExportContent, triggerFileDownload } from '../services/storage';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  isSelective: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  questions,
  isSelective,
}) => {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const exportResult = generateExportContent(questions, format, {
    includeAnswers,
    includeExplanations,
  });

  const handleDownload = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `quiz-question-bank_${questions.length}q_${timestamp}.${exportResult.extension}`;
    triggerFileDownload(exportResult.content, filename, exportResult.mimeType);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportResult.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="export-modal"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-fadeIn"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Download className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="font-bold text-base sm:text-lg">
                Export {isSelective ? 'Selected Questions' : 'All Questions'}
              </h2>
              <p className="text-xs text-slate-300">
                Exporting {questions.length} question{questions.length === 1 ? '' : 's'} in your preferred format.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Format Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Choose Export Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition-all cursor-pointer ${
                  format === 'csv'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-xs">CSV</span>
                <span className="text-[10px] text-slate-500">Excel, Sheets</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition-all cursor-pointer ${
                  format === 'json'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileCode className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-xs">JSON</span>
                <span className="text-[10px] text-slate-500">API, Web apps</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('gift')}
                className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition-all cursor-pointer ${
                  format === 'gift'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-5 h-5 text-purple-600" />
                <span className="font-bold text-xs">GIFT Format</span>
                <span className="text-[10px] text-slate-500">Moodle, Canvas</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('text')}
                className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition-all cursor-pointer ${
                  format === 'text'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-xs">Printable Sheet</span>
                <span className="text-[10px] text-slate-500">Classroom, PDF</span>
              </button>
            </div>
          </div>

          {/* Options: Include answers, explanations */}
          <div className="flex flex-wrap items-center gap-5 pt-1 text-xs text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeAnswers}
                onChange={e => setIncludeAnswers(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="font-medium">Include Correct Answer Key</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeExplanations}
                onChange={e => setIncludeExplanations(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="font-medium">Include References & Explanations</span>
            </label>
          </div>

          {/* Preview Box */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
              <span>Output Preview ({format.toUpperCase()})</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {exportResult.content.length} characters
              </span>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs max-h-48 overflow-y-auto overflow-x-auto select-all leading-relaxed custom-scrollbar">
              {exportResult.content.slice(0, 1800)}
              {exportResult.content.length > 1800 ? '\n... (remaining truncated in preview)' : ''}
            </pre>
          </div>

          {/* Action buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-medium transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                id="export-download-btn"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

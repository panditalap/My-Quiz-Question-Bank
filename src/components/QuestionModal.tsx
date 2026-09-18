import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, HelpCircle, Tag, BookOpen, Layers } from 'lucide-react';
import { Question, CorrectOption, Difficulty } from '../types';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    text: string;
    options: { A: string; B: string; C: string; D: string };
    correctOption: CorrectOption;
    subject: string;
    difficulty: Difficulty;
    tags: string[];
    referenceExplanation: string;
  }) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  initialQuestion?: Question | null;
  existingSubjects: string[];
}

const COMMON_SUBJECTS = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'World History',
  'Literature',
  'Geography',
  'General Knowledge',
];

export const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialQuestion,
  existingSubjects,
}) => {
  const [text, setText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState<CorrectOption>('A');
  const [subject, setSubject] = useState('Computer Science');
  const [customSubject, setCustomSubject] = useState('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [tagsInput, setTagsInput] = useState('');
  const [referenceExplanation, setReferenceExplanation] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Merge subjects
  const subjectList = Array.from(new Set([...COMMON_SUBJECTS, ...existingSubjects]));

  useEffect(() => {
    if (initialQuestion) {
      setText(initialQuestion.text);
      setOptionA(initialQuestion.options.A);
      setOptionB(initialQuestion.options.B);
      setOptionC(initialQuestion.options.C);
      setOptionD(initialQuestion.options.D);
      setCorrectOption(initialQuestion.correctOption);
      if (subjectList.includes(initialQuestion.subject)) {
        setSubject(initialQuestion.subject);
        setIsCustomSubject(false);
      } else {
        setIsCustomSubject(true);
        setCustomSubject(initialQuestion.subject);
      }
      setDifficulty(initialQuestion.difficulty);
      setTagsInput(initialQuestion.tags.join(', '));
      setReferenceExplanation(initialQuestion.referenceExplanation || '');
    } else {
      // Reset defaults
      setText('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setCorrectOption('A');
      setSubject(subjectList[0] || 'Computer Science');
      setCustomSubject('');
      setIsCustomSubject(false);
      setDifficulty('Medium');
      setTagsInput('');
      setReferenceExplanation('');
    }
    setError(null);
  }, [initialQuestion, isOpen]);

  if (!isOpen) return null;

  const parsedTags = tagsInput
    .split(',')
    .map(t => t.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''))
    .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalSubject = isCustomSubject ? customSubject.trim() : subject.trim();

    // Validation
    if (!text.trim()) {
      setError('Please provide the question prompt.');
      return;
    }
    if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      setError('All 4 options (A, B, C, D) are required.');
      return;
    }
    if (!finalSubject) {
      setError('Please specify a subject for this question.');
      return;
    }

    const res = await onSave({
      id: initialQuestion?.id,
      text: text.trim(),
      options: {
        A: optionA.trim(),
        B: optionB.trim(),
        C: optionC.trim(),
        D: optionD.trim(),
      },
      correctOption,
      subject: finalSubject,
      difficulty,
      tags: parsedTags,
      referenceExplanation: referenceExplanation.trim(),
    });

    if (res.error) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="question-modal"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-fadeIn"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="font-bold text-base sm:text-lg">
                {initialQuestion ? 'Edit Question' : 'Contribute New Question'}
              </h2>
              <p className="text-xs text-slate-300">
                Provide the question statement, 4 distinct options, answer key, and explanation.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Subject & Difficulty row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Subject / Discipline *
              </label>
              {!isCustomSubject ? (
                <div className="space-y-1.5">
                  <select
                    value={subject}
                    onChange={e => {
                      if (e.target.value === '__OTHER__') {
                        setIsCustomSubject(true);
                      } else {
                        setSubject(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {subjectList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="__OTHER__">+ Add Custom Subject...</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter custom subject..."
                    value={customSubject}
                    onChange={e => setCustomSubject(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomSubject(false)}
                    className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    List
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Difficulty Level *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Easy', 'Medium', 'Hard'] as const).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      difficulty === lvl
                        ? lvl === 'Easy'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : lvl === 'Medium'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label htmlFor="question-text-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Question Statement *
            </label>
            <textarea
              id="question-text-input"
              rows={3}
              placeholder="Type your question clearly here..."
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          {/* 4 Options & Correct Answer Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                4 Options & Answer Key *
              </label>
              <span className="text-[11px] text-slate-500">
                Click the letter circle to mark the correct option
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                { key: 'A' as const, val: optionA, set: setOptionA, placeholder: 'Option A description...' },
                { key: 'B' as const, val: optionB, set: setOptionB, placeholder: 'Option B description...' },
                { key: 'C' as const, val: optionC, set: setOptionC, placeholder: 'Option C description...' },
                { key: 'D' as const, val: optionD, set: setOptionD, placeholder: 'Option D description...' },
              ].map(({ key, val, set, placeholder }) => {
                const isCorrect = correctOption === key;
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                      isCorrect
                        ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/30'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setCorrectOption(key)}
                      className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        isCorrect
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-600 hover:border-slate-400'
                      }`}
                      title={`Mark ${key} as correct answer`}
                    >
                      {key}
                    </button>

                    <input
                      type="text"
                      placeholder={placeholder}
                      value={val}
                      onChange={e => set(e.target.value)}
                      className="flex-1 bg-transparent border-0 text-sm text-slate-900 focus:outline-none placeholder-slate-400"
                      required
                    />

                    {isCorrect && (
                      <span className="text-[11px] font-semibold text-emerald-700 px-2 py-0.5 rounded bg-emerald-100/70 shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Correct Key
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reference / Short Explanation */}
          <div>
            <label htmlFor="question-reference-input" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Reference or Short Explanation / Info (Recommended)</span>
              <span className="text-[11px] text-slate-400 font-normal">Explains why the correct answer is right</span>
            </label>
            <textarea
              id="question-reference-input"
              rows={2}
              placeholder="e.g. According to Newton's Second Law, force equals mass times acceleration (F = ma)..."
              value={referenceExplanation}
              onChange={e => setReferenceExplanation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Question Tags (comma separated) */}
          <div>
            <label htmlFor="question-tags-input" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                Question Tags (comma separated)
              </span>
              <span className="text-[11px] text-slate-400 font-normal">e.g. algorithms, trees, complexity</span>
            </label>
            <input
              id="question-tags-input"
              type="text"
              placeholder="e.g. calculus, mechanics, world-war-2, database"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {parsedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {parsedTags.map(t => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-mono"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-question-btn"
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-xs hover:shadow-sm"
            >
              {initialQuestion ? 'Update Question' : 'Save Question to Bank'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

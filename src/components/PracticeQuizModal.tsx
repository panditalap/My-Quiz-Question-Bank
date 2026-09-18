import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Award,
  Info,
  Layers
} from 'lucide-react';
import { Question } from '../types';

interface PracticeQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
}

export const PracticeQuizModal: React.FC<PracticeQuizModalProps> = ({
  isOpen,
  onClose,
  questions,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  // Available subjects
  const subjects = useMemo(() => {
    return ['All', ...Array.from(new Set(questions.map(q => q.subject))).sort()];
  }, [questions]);

  // Filtered pool
  const quizPool = useMemo(() => {
    if (selectedSubject === 'All') return questions;
    return questions.filter(q => q.subject === selectedSubject);
  }, [questions, selectedSubject]);

  if (!isOpen) return null;

  const currentQ = quizPool[currentIndex] || quizPool[0];
  const selectedOption = currentQ ? userAnswers[currentQ.id] : undefined;
  const isAnswered = selectedOption !== undefined;

  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswered) return;
    setUserAnswers(prev => ({ ...prev, [currentQ.id]: opt }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex < quizPool.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsQuizCompleted(true);
    }
  };

  const handlePrev = () => {
    setShowExplanation(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setUserAnswers({});
    setCurrentIndex(0);
    setShowExplanation(false);
    setIsQuizCompleted(false);
  };

  // Score calculations
  const calculateScore = () => {
    let score = 0;
    quizPool.forEach(q => {
      if (userAnswers[q.id] === q.correctOption) {
        score++;
      }
    });
    return score;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div 
        id="practice-quiz-modal"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-fadeIn"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-bold text-base sm:text-lg">Practice Quiz Mode</h2>
              <p className="text-xs text-slate-300">
                Test your knowledge on questions submitted to the bank
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

        {/* Subject Filter Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Discipline:</span>
            <select
              value={selectedSubject}
              onChange={e => {
                setSelectedSubject(e.target.value);
                handleRestart();
              }}
              className="py-1 px-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {subjects.map(s => (
                <option key={s} value={s}>{s} ({s === 'All' ? questions.length : questions.filter(q => q.subject === s).length})</option>
              ))}
            </select>
          </div>

          <span className="text-slate-500 font-mono">
            Question {currentIndex + 1} of {quizPool.length}
          </span>
        </div>

        {/* Content */}
        <div className="p-6">
          {isQuizCompleted ? (
            /* Quiz Completed View */
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Quiz Completed!</h3>
              <p className="text-sm text-slate-600">
                You scored <strong className="text-blue-600 text-lg font-bold">{calculateScore()}</strong> out of{' '}
                <strong className="text-slate-900 text-lg font-bold">{quizPool.length}</strong> questions (
                {Math.round((calculateScore() / quizPool.length) * 100)}%)
              </p>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake Quiz</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors"
                >
                  Back to Question Bank
                </button>
              </div>
            </div>
          ) : currentQ ? (
            /* Active Question View */
            <div className="space-y-5">
              {/* Question Metadata */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {currentQ.subject}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {currentQ.difficulty}
                </span>
                <span className="text-[11px] text-slate-400 ml-auto">
                  By {currentQ.contributorName}
                </span>
              </div>

              {/* Question Text */}
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {currentQ.text}
              </h3>

              {/* 4 Interactive Option Buttons */}
              <div className="space-y-2.5">
                {(['A', 'B', 'C', 'D'] as const).map(optKey => {
                  const isChosen = selectedOption === optKey;
                  const isCorrect = currentQ.correctOption === optKey;

                  let optStyle = 'bg-slate-50 border-slate-200/90 text-slate-700 hover:bg-slate-100 hover:border-slate-300';
                  if (isAnswered) {
                    if (isCorrect) {
                      optStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium ring-1 ring-emerald-400/40';
                    } else if (isChosen) {
                      optStyle = 'bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-400/40';
                    } else {
                      optStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={optKey}
                      onClick={() => handleSelectOption(optKey)}
                      disabled={isAnswered}
                      className={`w-full p-3.5 rounded-xl border text-left text-sm flex items-start gap-3 transition-all cursor-pointer disabled:cursor-default ${optStyle}`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                          isAnswered && isCorrect
                            ? 'bg-emerald-600 text-white'
                            : isAnswered && isChosen
                            ? 'bg-rose-600 text-white'
                            : 'bg-white border border-slate-300 text-slate-700'
                        }`}
                      >
                        {optKey}
                      </span>
                      <span className="flex-1 pt-0.5 leading-relaxed">
                        {currentQ.options[optKey]}
                      </span>
                      {isAnswered && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      {isAnswered && isChosen && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Reference */}
              {isAnswered && currentQ.referenceExplanation && (
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1 animate-fadeIn">
                  <div className="font-semibold flex items-center gap-1.5 text-blue-900">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>Explanation & Reference</span>
                  </div>
                  <p className="leading-relaxed pl-5">
                    {currentQ.referenceExplanation}
                  </p>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all"
                >
                  <span>{currentIndex === quizPool.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-slate-500 py-8">No questions available in this category.</p>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Tag, 
  Info, 
  Edit3, 
  Trash2, 
  User, 
  Calendar, 
  CheckSquare, 
  Square,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';
import { Question } from '../types';
import { canEditQuestion, canDeleteQuestion } from '../services/storage';
import { useAuth } from '../context/AuthContext';

interface QuestionCardProps {
  question: Question;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (question: Question) => void;
  onDelete: (id: string) => void;
  showContributorInfo?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  showContributorInfo = true,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [copied, setCopied] = useState(false);

  const canEdit = canEditQuestion(currentUser, question);
  const canDelete = canDeleteQuestion(currentUser, question);

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Hard':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleCopy = () => {
    const text = `${question.text}\nA) ${question.options.A}\nB) ${question.options.B}\nC) ${question.options.C}\nD) ${question.options.D}\nAnswer: ${question.correctOption} (${question.options[question.correctOption]})\nExplanation: ${question.referenceExplanation}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div 
      id={`question-card-${question.id}`}
      className={`relative rounded-2xl border transition-all duration-150 p-5 sm:p-6 ${
        isSelected
          ? 'bg-blue-50/40 border-blue-400 shadow-sm ring-1 ring-blue-400/40'
          : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* Top Header: Select Checkbox, Badges, Actions */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center flex-wrap gap-2">
          {/* Multi-select checkbox */}
          <button
            onClick={() => onToggleSelect(question.id)}
            className="p-1 -ml-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
            aria-label={isSelected ? 'Deselect question' : 'Select question'}
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-blue-600 fill-blue-50" />
            ) : (
              <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
            )}
          </button>

          {/* Subject Badge */}
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/80">
            {question.subject}
          </span>

          {/* Difficulty Badge */}
          <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${getDifficultyBadge(question.difficulty)}`}>
            {question.difficulty}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Reveal / Hide Answer Toggle */}
          <button
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={showAnswerKey ? 'Hide answer key' : 'Show answer key'}
          >
            {showAnswerKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-blue-600" />}
          </button>

          {/* Copy to clipboard */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Copy question text"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Edit Button */}
          {canEdit && (
            <button
              onClick={() => onEdit(question)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title={isAdmin && question.contributorUid !== currentUser?.uid ? "Edit Question (Admin Override)" : "Edit Question"}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}

          {/* Delete Button */}
          {canDelete && (
            <button
              onClick={() => onDelete(question.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title={isAdmin && question.contributorUid !== currentUser?.uid ? "Delete Question (Admin Override)" : "Delete Question"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Question Body */}
      <div className="pt-3.5 pb-2">
        <h3 className="text-base font-semibold text-slate-900 leading-snug">
          {question.text}
        </h3>
      </div>

      {/* 4 Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3.5">
        {(['A', 'B', 'C', 'D'] as const).map(optKey => {
          const isCorrect = question.correctOption === optKey;
          const showAsCorrect = showAnswerKey && isCorrect;

          return (
            <div
              key={optKey}
              className={`p-3 rounded-xl border text-sm flex items-start gap-2.5 transition-colors ${
                showAsCorrect
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                  : 'bg-slate-50/70 border-slate-200/80 text-slate-700'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                  showAsCorrect
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700'
                }`}
              >
                {optKey}
              </span>
              <span className="flex-1 pt-0.5 leading-relaxed break-words">
                {question.options[optKey]}
              </span>
              {showAsCorrect && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Explanation & Reference (if available and revealed) */}
      {showAnswerKey && question.referenceExplanation && (
        <div className="my-3 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-blue-950">Explanation / Reference: </span>
            {question.referenceExplanation}
          </div>
        </div>
      )}

      {/* Footer: Tags & Contributor Info */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-500">
        {/* Tags */}
        <div className="flex items-center flex-wrap gap-1.5">
          <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {question.tags.length > 0 ? (
            question.tags.map(t => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px]"
              >
                #{t}
              </span>
            ))
          ) : (
            <span className="text-slate-400 italic text-[11px]">No tags</span>
          )}
        </div>

        {/* Contributor Details */}
        {showContributorInfo && (
          <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium text-slate-700" title={`Contributor: ${question.contributorEmail}`}>
              <User className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[140px]">{question.contributorName}</span>
              {question.contributorEmail.toLowerCase() === 'pandit.alap@gmail.com' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">Admin</span>
              )}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar className="w-3 h-3" />
              {new Date(question.createdAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Layers, Sparkles, Download, BookOpen } from 'lucide-react';
import { Question, QuestionFilters } from '../types';
import { QuestionCard } from './QuestionCard';
import { QuestionFiltersBar } from './QuestionFiltersBar';

interface QuestionBankExplorerProps {
  questions: Question[];
  onOpenAddQuestion: () => void;
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onOpenExportModal: (selective: boolean) => void;
  onOpenPracticeQuiz: () => void;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export const QuestionBankExplorer: React.FC<QuestionBankExplorerProps> = ({
  questions,
  onOpenAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onOpenExportModal,
  onOpenPracticeQuiz,
  selectedIds,
  setSelectedIds,
}) => {
  // Filters state
  const [filters, setFilters] = useState<QuestionFilters>({
    searchQuery: '',
    subject: '',
    difficulty: '',
    tag: '',
    contributorUid: '',
    sortBy: 'newest',
  });

  // Unique subjects, tags, contributors
  const availableSubjects = useMemo(() => {
    return Array.from(new Set(questions.map(q => q.subject))).sort();
  }, [questions]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    questions.forEach(q => q.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [questions]);

  const availableContributors = useMemo(() => {
    const map = new Map<string, { uid: string; name: string; email: string }>();
    questions.forEach(q => {
      if (!map.has(q.contributorUid)) {
        map.set(q.contributorUid, {
          uid: q.contributorUid,
          name: q.contributorName,
          email: q.contributorEmail,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [questions]);

  // Filtered and sorted questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesText = q.text.toLowerCase().includes(query);
        const matchesSubject = q.subject.toLowerCase().includes(query);
        const matchesTags = q.tags.some(t => t.toLowerCase().includes(query));
        const matchesOptions = Object.values(q.options).some(opt => opt.toLowerCase().includes(query));
        const matchesContributor = q.contributorName.toLowerCase().includes(query) || q.contributorEmail.toLowerCase().includes(query);
        const matchesRef = q.referenceExplanation.toLowerCase().includes(query);
        if (!matchesText && !matchesSubject && !matchesTags && !matchesOptions && !matchesContributor && !matchesRef) {
          return false;
        }
      }
      if (filters.subject && q.subject !== filters.subject) return false;
      if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
      if (filters.tag && !q.tags.includes(filters.tag)) return false;
      if (filters.contributorUid && q.contributorUid !== filters.contributorUid) return false;
      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (filters.sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (filters.sortBy === 'subject') {
        return a.subject.localeCompare(b.subject);
      }
      if (filters.sortBy === 'difficulty') {
        const diffRank = { Easy: 1, Medium: 2, Hard: 3 };
        return diffRank[a.difficulty] - diffRank[b.difficulty];
      }
      return 0;
    });
  }, [questions, filters]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = filteredQuestions.map(q => q.id);
    setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleDeselectAll = () => {
    const visibleIds = new Set(filteredQuestions.map(q => q.id));
    setSelectedIds(prev => prev.filter(id => !visibleIds.has(id)));
  };

  const isAllVisibleSelected =
    filteredQuestions.length > 0 &&
    filteredQuestions.every(q => selectedIds.includes(q.id));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Public Repository
            </span>
            <span className="text-xs text-slate-400">
              {questions.length} Questions Contributed
            </span>
          </div>
          <h2 className="text-xl font-bold mt-1 tracking-tight">
            Question Bank Repository
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            Search, filter, practice, and export peer-reviewed multiple-choice questions contributed across mathematics, sciences, humanities, and technology.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={onOpenPracticeQuiz}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>Practice Quiz Mode</span>
          </button>
          <button
            onClick={() => onOpenExportModal(selectedIds.length > 0)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs sm:text-sm border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{selectedIds.length > 0 ? `Export (${selectedIds.length})` : 'Export All'}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <QuestionFiltersBar
        filters={filters}
        setFilters={setFilters}
        availableSubjects={availableSubjects}
        availableTags={availableTags}
        availableContributors={availableContributors}
        showContributorFilter={true}
        totalFiltered={filteredQuestions.length}
        totalQuestions={questions.length}
        selectedCount={selectedIds.length}
        onSelectAllVisible={handleSelectAllVisible}
        onDeselectAll={handleDeselectAll}
        isAllVisibleSelected={isAllVisibleSelected}
        onOpenExport={() => onOpenExportModal(selectedIds.length > 0)}
        onResetFilters={() =>
          setFilters({
            searchQuery: '',
            subject: '',
            difficulty: '',
            tag: '',
            contributorUid: '',
            sortBy: 'newest',
          })
        }
      />

      {/* Questions list */}
      {filteredQuestions.length > 0 ? (
        <div className="space-y-4">
          {filteredQuestions.map(question => (
            <QuestionCard
              key={question.id}
              question={question}
              isSelected={selectedIds.includes(question.id)}
              onToggleSelect={handleToggleSelect}
              onEdit={onEditQuestion}
              onDelete={onDeleteQuestion}
              showContributorInfo={true}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No questions match your search filters.</p>
          <button
            onClick={() =>
              setFilters({
                searchQuery: '',
                subject: '',
                difficulty: '',
                tag: '',
                contributorUid: '',
                sortBy: 'newest',
              })
            }
            className="mt-3 text-xs text-blue-600 hover:underline font-semibold"
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
};

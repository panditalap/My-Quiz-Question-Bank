import React, { useState, useMemo } from 'react';
import { 
  PlusCircle, 
  BookOpen, 
  Sparkles, 
  Download, 
  FolderPlus, 
  Layers, 
  Award, 
  LogOut,
  HelpCircle,
  Tag
} from 'lucide-react';
import { Question, QuestionFilters } from '../types';
import { QuestionCard } from './QuestionCard';
import { QuestionFiltersBar } from './QuestionFiltersBar';
import { useAuth } from '../context/AuthContext';

interface UserDashboardProps {
  questions: Question[];
  onOpenAddQuestion: () => void;
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onOpenExportModal: (selective: boolean) => void;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  questions,
  onOpenAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onOpenExportModal,
  selectedIds,
  setSelectedIds,
}) => {
  const { currentUser, signOut, isAdmin } = useAuth();

  // Filter to questions provided by current user
  const userQuestions = useMemo(() => {
    if (!currentUser) return [];
    return questions.filter(
      q => q.contributorUid === currentUser.uid || q.contributorEmail.toLowerCase() === currentUser.email.toLowerCase()
    );
  }, [questions, currentUser]);

  // Filters state
  const [filters, setFilters] = useState<QuestionFilters>({
    searchQuery: '',
    subject: '',
    difficulty: '',
    tag: '',
    contributorUid: '',
    sortBy: 'newest',
  });

  // Unique subjects and tags for current user's questions
  const availableSubjects = useMemo(() => {
    return Array.from(new Set(userQuestions.map(q => q.subject))).sort();
  }, [userQuestions]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    userQuestions.forEach(q => q.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [userQuestions]);

  // Filtered and sorted questions
  const filteredQuestions = useMemo(() => {
    return userQuestions.filter(q => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesText = q.text.toLowerCase().includes(query);
        const matchesSubject = q.subject.toLowerCase().includes(query);
        const matchesTags = q.tags.some(t => t.toLowerCase().includes(query));
        const matchesOptions = Object.values(q.options).some(opt => opt.toLowerCase().includes(query));
        const matchesRef = q.referenceExplanation.toLowerCase().includes(query);
        if (!matchesText && !matchesSubject && !matchesTags && !matchesOptions && !matchesRef) {
          return false;
        }
      }
      if (filters.subject && q.subject !== filters.subject) return false;
      if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
      if (filters.tag && !q.tags.includes(filters.tag)) return false;
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
  }, [userQuestions, filters]);

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
      {/* Contributor Profile Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">
                {currentUser?.name || 'Contributor'}
              </h2>
              {isAdmin ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  ADMINISTRATOR
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  Contributor
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {currentUser?.email}
            </p>
            {currentUser?.subjectSpecialty && (
              <p className="text-xs text-blue-600 font-medium mt-1">
                Subject Focus: {currentUser.subjectSpecialty}
              </p>
            )}
          </div>
        </div>

        {/* Quick Action buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            id="user-dashboard-add-btn"
            onClick={onOpenAddQuestion}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-xs hover:shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Question</span>
          </button>

          <button
            onClick={() => onOpenExportModal(selectedIds.length > 0)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>
              {selectedIds.length > 0 ? `Export (${selectedIds.length})` : 'Export All'}
            </span>
          </button>

          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-medium border border-rose-200 transition-colors"
            title="Sign out of your account"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            My Questions
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {userQuestions.length}
          </span>
          <span className="text-[11px] text-slate-400">Total submitted</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Subjects Covered
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {availableSubjects.length}
          </span>
          <span className="text-[11px] text-slate-400">Distinct categories</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Selected for Export
          </span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">
            {selectedIds.filter(id => userQuestions.some(q => q.id === id)).length}
          </span>
          <span className="text-[11px] text-slate-400">Ready to download</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Topic Tags
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {availableTags.length}
          </span>
          <span className="text-[11px] text-slate-400">Sub-topic identifiers</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <QuestionFiltersBar
        filters={filters}
        setFilters={setFilters}
        availableSubjects={availableSubjects}
        availableTags={availableTags}
        showContributorFilter={false}
        totalFiltered={filteredQuestions.length}
        totalQuestions={userQuestions.length}
        selectedCount={selectedIds.filter(id => userQuestions.some(q => q.id === id)).length}
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

      {/* Questions List */}
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
              showContributorInfo={false}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {userQuestions.length === 0 ? 'No questions contributed yet' : 'No matching questions found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
            {userQuestions.length === 0
              ? 'Share your subject expertise! Add your first multiple-choice question with 4 options, answer key, and explanation.'
              : 'Try clearing your search query or adjusting the subject/difficulty filters.'}
          </p>
          <button
            onClick={onOpenAddQuestion}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Question Now</span>
          </button>
        </div>
      )}
    </div>
  );
};

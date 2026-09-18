import React from 'react';
import { Search, X, Filter, CheckSquare, Square, Download, RefreshCw } from 'lucide-react';
import { QuestionFilters, Difficulty } from '../types';

interface QuestionFiltersBarProps {
  filters: QuestionFilters;
  setFilters: React.Dispatch<React.SetStateAction<QuestionFilters>>;
  availableSubjects: string[];
  availableTags: string[];
  availableContributors?: { uid: string; name: string; email: string }[];
  showContributorFilter?: boolean;
  totalFiltered: number;
  totalQuestions: number;
  selectedCount: number;
  onSelectAllVisible: () => void;
  onDeselectAll: () => void;
  isAllVisibleSelected: boolean;
  onOpenExport: () => void;
  onResetFilters: () => void;
}

export const QuestionFiltersBar: React.FC<QuestionFiltersBarProps> = ({
  filters,
  setFilters,
  availableSubjects,
  availableTags,
  availableContributors = [],
  showContributorFilter = false,
  totalFiltered,
  totalQuestions,
  selectedCount,
  onSelectAllVisible,
  onDeselectAll,
  isAllVisibleSelected,
  onOpenExport,
  onResetFilters,
}) => {
  const hasActiveFilters = 
    Boolean(filters.searchQuery) || 
    Boolean(filters.subject) || 
    Boolean(filters.difficulty) || 
    Boolean(filters.tag) || 
    Boolean(filters.contributorUid);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 mb-6 space-y-4">
      {/* Top row: Search input + Quick Actions */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            id="question-search-input"
            type="text"
            placeholder="Search questions by keyword, question text, or answer..."
            value={filters.searchQuery}
            onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-by-select" className="text-xs font-medium text-slate-500 shrink-0">
            Sort:
          </label>
          <select
            id="sort-by-select"
            value={filters.sortBy}
            onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
            className="py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="subject">By Subject (A-Z)</option>
            <option value="difficulty">By Difficulty</option>
          </select>
        </div>
      </div>

      {/* Filter Dropdowns Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
        {/* Subject Filter */}
        <div>
          <label htmlFor="subject-filter" className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
            Subject
          </label>
          <select
            id="subject-filter"
            value={filters.subject}
            onChange={e => setFilters(prev => ({ ...prev, subject: e.target.value }))}
            className="w-full py-2 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">All Subjects</option>
            {availableSubjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label htmlFor="difficulty-filter" className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
            Difficulty
          </label>
          <select
            id="difficulty-filter"
            value={filters.difficulty}
            onChange={e => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
            className="w-full py-2 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        {/* Tags Filter */}
        <div>
          <label htmlFor="tag-filter" className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
            Topic Tag
          </label>
          <select
            id="tag-filter"
            value={filters.tag}
            onChange={e => setFilters(prev => ({ ...prev, tag: e.target.value }))}
            className="w-full py-2 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">All Tags</option>
            {availableTags.map(t => (
              <option key={t} value={t}>#{t}</option>
            ))}
          </select>
        </div>

        {/* Contributor Filter (for Admin / General) */}
        {showContributorFilter && (
          <div>
            <label htmlFor="contributor-filter" className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
              Contributor
            </label>
            <select
              id="contributor-filter"
              value={filters.contributorUid}
              onChange={e => setFilters(prev => ({ ...prev, contributorUid: e.target.value }))}
              className="w-full py-2 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">All Contributors</option>
              {availableContributors.map(c => (
                <option key={c.uid} value={c.uid}>{c.name} ({c.email})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bottom Bar: Selection Toggles, Counts, and Reset */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        {/* Selection & Count */}
        <div className="flex items-center gap-3">
          <button
            onClick={isAllVisibleSelected ? onDeselectAll : onSelectAllVisible}
            className="flex items-center gap-1.5 font-medium text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
          >
            {isAllVisibleSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {isAllVisibleSelected ? 'Deselect Visible' : 'Select Visible'}
            </span>
          </button>

          <span className="text-slate-300">|</span>

          <span>
            Showing <strong className="text-slate-900">{totalFiltered}</strong> of{' '}
            <strong className="text-slate-900">{totalQuestions}</strong> questions
          </span>

          {selectedCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold">
              {selectedCount} selected
            </span>
          )}
        </div>

        {/* Export & Reset Actions */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}

          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {selectedCount > 0 ? `Export Selected (${selectedCount})` : `Export All (${totalFiltered})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

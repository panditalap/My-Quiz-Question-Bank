import React from 'react';
import { Menu, ShieldCheck, Download, Plus, CheckSquare, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  onOpenMobileMenu: () => void;
  onOpenAddQuestion: () => void;
  onOpenExportModal: () => void;
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenMobileMenu,
  onOpenAddQuestion,
  onOpenExportModal,
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
}) => {
  const { currentUser, isAdmin } = useAuth();

  const getPageTitle = () => {
    switch (currentTab) {
      case 'my-questions':
        return { title: 'My Contributed Questions', subtitle: 'Manage your submissions, add new questions, and export' };
      case 'explore-bank':
        return { title: 'Question Bank Explorer', subtitle: 'Browse, filter, and practice questions contributed across all subjects' };
      case 'practice-quiz':
        return { title: 'Interactive Quiz Practice', subtitle: 'Test your knowledge using real questions from the bank' };
      case 'admin-all-questions':
        return { title: 'All Questions Oversight (Admin)', subtitle: 'Full administrative access to inspect, edit, and export any question in the bank' };
      case 'admin-users':
        return { title: 'Contributors & User Registry', subtitle: 'Overview of all contributors, their contribution metrics, and subjects' };
      case 'admin-settings':
        return { title: 'Admin Settings & Deployment', subtitle: 'Configure admin UIDs, manage authentication parameters, and export for GitHub' };
      default:
        return { title: 'Quiz Question Bank', subtitle: 'Collaborative Question Repository' };
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 transition-all">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          id="mobile-menu-toggle"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {title}
            </h2>
            {isAdmin && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <ShieldCheck className="w-3 h-3 text-amber-600" />
                Admin
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 hidden md:block truncate">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Selection Active Bar */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs text-blue-800 animate-fadeIn">
            <CheckSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-semibold">{selectedCount}</span>
            <span className="hidden sm:inline">selected</span>
            <button
              onClick={onClearSelection}
              className="text-blue-600 hover:text-blue-900 underline font-medium ml-1"
            >
              Clear
            </button>
            <button
              onClick={onOpenExportModal}
              className="ml-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1 transition-colors shadow-xs"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
          </div>
        )}

        {/* New Question Button in Navbar */}
        <button
          id="nav-new-question-btn"
          onClick={onOpenAddQuestion}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium transition-all shadow-xs hover:shadow-sm active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Question</span>
          <span className="sm:hidden">Add</span>
        </button>

        {/* Quick Export Button if nothing selected */}
        {selectedCount === 0 && (
          <button
            id="nav-export-all-btn"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium border border-slate-200 transition-colors shadow-2xs"
            title="Export questions"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Export</span>
          </button>
        )}
      </div>
    </header>
  );
};

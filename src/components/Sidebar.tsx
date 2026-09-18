import React from 'react';
import { 
  BookOpen, 
  PlusCircle, 
  Layers, 
  Users, 
  ShieldCheck, 
  LogOut, 
  Sparkles, 
  HelpCircle,
  Database,
  ChevronRight,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAddQuestion: () => void;
  onOpenSignIn: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  questionCount: number;
  myQuestionCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAddQuestion,
  onOpenSignIn,
  isMobileOpen,
  setIsMobileOpen,
  questionCount,
  myQuestionCount,
}) => {
  const { currentUser, isAdmin, signOut } = useAuth();

  const handleNav = (tab: string) => {
    setCurrentTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Dark Navy Sidebar */}
      <aside 
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-950 text-slate-100 flex flex-col border-r border-slate-800/80 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-700 flex items-center justify-center text-white shadow-md shadow-indigo-950/50">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
                Quiz Question Bank
              </h1>
              <p className="text-xs text-slate-400 font-medium">Collaborative Portal</p>
            </div>
          </div>

          {/* Admin Indicator Banner */}
          {isAdmin && (
            <div className="mt-3.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
              <span className="flex items-center gap-1.5 font-semibold tracking-wide uppercase text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Admin Privileges
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200 font-mono">
                Full Access
              </span>
            </div>
          )}
        </div>

        {/* Action Button: Add New Question */}
        <div className="px-4 pt-4 pb-2">
          <button
            id="sidebar-add-question-btn"
            onClick={() => {
              onOpenAddQuestion();
              setIsMobileOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-sm shadow-blue-900/40 hover:shadow-md cursor-pointer active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Question</span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-2 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Contributor Space */}
          <div>
            <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Contributor Space
            </div>
            <nav className="space-y-1">
              <button
                id="nav-my-questions"
                onClick={() => handleNav('my-questions')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'my-questions'
                    ? 'bg-slate-800/90 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>My Questions</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {myQuestionCount}
                </span>
              </button>

              <button
                id="nav-explore-bank"
                onClick={() => handleNav('explore-bank')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'explore-bank'
                    ? 'bg-slate-800/90 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Question Bank</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {questionCount}
                </span>
              </button>

              <button
                id="nav-practice-quiz"
                onClick={() => handleNav('practice-quiz')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'practice-quiz'
                    ? 'bg-slate-800/90 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Practice Quiz</span>
                </span>
                <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                  Test
                </span>
              </button>
            </nav>
          </div>

          {/* Admin Space */}
          {isAdmin && (
            <div>
              <div className="px-3 pb-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Admin Dashboard</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Admin Active" />
              </div>
              <nav className="space-y-1">
                <button
                  id="nav-admin-all-questions"
                  onClick={() => handleNav('admin-all-questions')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'admin-all-questions'
                      ? 'bg-slate-800/90 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>All Questions (Admin)</span>
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {questionCount}
                  </span>
                </button>

                <button
                  id="nav-admin-users"
                  onClick={() => handleNav('admin-users')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'admin-users'
                      ? 'bg-slate-800/90 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>All Users & Contributions</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  id="nav-admin-settings"
                  onClick={() => handleNav('admin-settings')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'admin-settings'
                      ? 'bg-slate-800/90 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span>Admin Config & Hosting</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </nav>
            </div>
          )}

          {/* Firebase Connection Status Banner */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-200 font-medium mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Firebase Cloud Connected</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Real-time Firestore sync & Authentication enabled for all contributors.
            </p>
          </div>
        </div>

        {/* User Account / Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          {currentUser ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 border border-blue-500 flex items-center justify-center font-bold text-sm text-white shrink-0">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate" title={currentUser.email}>
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-500/30">
                    ADMIN
                  </span>
                )}
              </div>

              {/* Prominent Sign Out Button - Switch Account removed as requested */}
              <button
                id="sidebar-signout-btn"
                onClick={signOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 text-xs font-medium border border-slate-800 hover:border-rose-900/50 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="text-center">
              <button
                id="sidebar-signin-btn"
                onClick={onOpenSignIn}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

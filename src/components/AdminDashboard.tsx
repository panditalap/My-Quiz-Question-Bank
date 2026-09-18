import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Users, 
  BookOpen, 
  Search, 
  Filter, 
  Download, 
  Edit3, 
  Trash2, 
  Key, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  RefreshCw,
  Calendar,
  Layers,
  Database,
  UserCheck
} from 'lucide-react';
import { Question, User, QuestionFilters } from '../types';
import { QuestionCard } from './QuestionCard';
import { QuestionFiltersBar } from './QuestionFiltersBar';
import { getUserStats, getAdminConfig, saveAdminConfig, resetDatabaseToDefault } from '../services/storage';
import { ADMIN_EMAIL } from '../services/seedData';
import { useAuth } from '../context/AuthContext';

interface AdminDashboardProps {
  questions: Question[];
  onOpenAddQuestion: () => void;
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onOpenExportModal: (selective: boolean) => void;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  initialSubTab?: 'questions' | 'users' | 'settings';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  questions,
  onOpenAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onOpenExportModal,
  selectedIds,
  setSelectedIds,
  initialSubTab = 'questions',
}) => {
  const { currentUser, allUsers } = useAuth();
  const [subTab, setSubTab] = useState<'questions' | 'users' | 'settings'>(initialSubTab);

  // Admin Config state
  const [adminConfig, setAdminConfig] = useState(getAdminConfig());
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminUid, setNewAdminUid] = useState('');
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string | null>(null);

  // Registered users taken directly from live Firestore database
  const registeredUsers = useMemo(() => {
    const list = [...allUsers];
    if (currentUser && !list.some(u => u.uid === currentUser.uid || (u.email && u.email.toLowerCase() === currentUser.email.toLowerCase()))) {
      list.unshift(currentUser);
    }
    return list;
  }, [allUsers, currentUser]);

  // User stats matrix based strictly on actual registered database users
  const userStats = useMemo(() => getUserStats(questions, registeredUsers), [questions, registeredUsers]);

  // Filters state for admin
  const [filters, setFilters] = useState<QuestionFilters>({
    searchQuery: '',
    subject: '',
    difficulty: '',
    tag: '',
    contributorUid: '',
    sortBy: 'newest',
  });

  // Unique subjects, tags, and contributors
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

  // Filtered questions
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

  // Admin config updater
  const handleAddAdminEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) return;
    const updated = {
      ...adminConfig,
      adminEmails: Array.from(new Set([...adminConfig.adminEmails, newAdminEmail.trim().toLowerCase()])),
    };
    saveAdminConfig(updated);
    setAdminConfig(updated);
    setNewAdminEmail('');
    setConfigSuccessMsg('Admin email registered successfully.');
    setTimeout(() => setConfigSuccessMsg(null), 3000);
  };

  const handleAddAdminUid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUid.trim()) return;
    const updated = {
      ...adminConfig,
      adminUids: Array.from(new Set([...adminConfig.adminUids, newAdminUid.trim()])),
    };
    saveAdminConfig(updated);
    setAdminConfig(updated);
    setNewAdminUid('');
    setConfigSuccessMsg('Admin UID registered successfully.');
    setTimeout(() => setConfigSuccessMsg(null), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset database to clean sample questions and original seed users?')) {
      resetDatabaseToDefault();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Prominent Admin Badge Banner */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center justify-center shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight">
                Admin Control Center
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                ADMIN BADGE ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
              <span>Authorized as:</span>
              <strong className="text-white font-mono bg-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-700">
                {ADMIN_EMAIL}
              </strong>
              <span className="text-slate-400">UID: {currentUser?.uid || 'usr_admin_alap'}</span>
            </p>
          </div>
        </div>

        {/* Top Tab Bar */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 shrink-0 text-xs font-semibold">
          <button
            id="admin-subtab-questions"
            onClick={() => setSubTab('questions')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              subTab === 'questions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            All Questions ({questions.length})
          </button>
          <button
            id="admin-subtab-users"
            onClick={() => setSubTab('users')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              subTab === 'users'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            All Users ({allUsers.length})
          </button>
          <button
            id="admin-subtab-settings"
            onClick={() => setSubTab('settings')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              subTab === 'settings'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Admin UID & Config
          </button>
        </div>
      </div>

      {/* SUBTAB 1: ALL QUESTIONS */}
      {subTab === 'questions' && (
        <div className="space-y-5">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Questions in Bank
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {questions.length}
              </span>
              <span className="text-[11px] text-slate-400">From all contributors</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Active Subjects
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {availableSubjects.length}
              </span>
              <span className="text-[11px] text-slate-400">Curated disciplines</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Registered Contributors
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {allUsers.length}
              </span>
              <span className="text-[11px] text-slate-400">With verified contributions</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Selected for Export
              </span>
              <span className="text-2xl font-black text-blue-600 mt-1 block">
                {selectedIds.length}
              </span>
              <span className="text-[11px] text-slate-400">CSV, JSON, GIFT ready</span>
            </div>
          </div>

          {/* Search and Filters Bar with Contributor Filter */}
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

          {/* Questions Stream */}
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
              <p className="text-sm font-semibold text-slate-700">No questions match the current filters.</p>
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
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: ALL USERS & CONTRIBUTIONS */}
      {subTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Registered Contributors & Activity Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Track individual contribution totals, subject specialties, and last active dates.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                {userStats.length} Total Users
              </span>
            </div>

            {userStats.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Users className="w-9 h-9 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-800 text-sm">No registered contributors in database yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Only accounts created in the live database are shown here. As new contributors register or sign in, their profile and contribution metrics will update live.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 uppercase font-semibold text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Contributor</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Questions</th>
                      <th className="py-3 px-4">Subjects Contributed</th>
                      <th className="py-3 px-4">Joined</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userStats.map(({ user, totalCount, subjects, isAdmin: isUserAdminFlag }) => (
                      <tr key={user.uid} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center shrink-0">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 text-sm">
                                {user.name}
                              </div>
                              <div className="text-slate-400 font-mono text-[11px]">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {isUserAdminFlag ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              ADMIN
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                              Contributor
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-sm text-slate-900">
                            {totalCount}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {subjects.length > 0 ? (
                              subjects.map(s => (
                                <span
                                  key={s}
                                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100"
                                >
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">No questions yet</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setFilters(prev => ({ ...prev, contributorUid: user.uid }));
                              setSubTab('questions');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs transition-colors"
                          >
                            View Questions →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: ADMIN SETTINGS & UID MANAGEMENT */}
      {subTab === 'settings' && (
        <div className="space-y-6">
          {configSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{configSuccessMsg}</span>
            </div>
          )}

          {/* UID & Admin Management */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" />
                <span>Admin Authentication & UID Configuration</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                As requested, <strong>{ADMIN_EMAIL}</strong> is configured as primary administrator. You can also add specific user UIDs or supplementary admin emails below.
              </p>
            </div>

            {/* List of Active Admin Identifiers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Admin Emails */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Authorized Admin Emails
                </label>
                <div className="space-y-2">
                  {adminConfig.adminEmails.map(email => (
                    <div
                      key={email}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono"
                    >
                      <span>{email}</span>
                      {email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Primary</span>
                      ) : (
                        <button
                          onClick={() => {
                            const updated = {
                              ...adminConfig,
                              adminEmails: adminConfig.adminEmails.filter(e => e !== email),
                            };
                            saveAdminConfig(updated);
                            setAdminConfig(updated);
                          }}
                          className="text-rose-600 hover:text-rose-800 text-[11px]"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddAdminEmail} className="flex gap-2 pt-1">
                  <input
                    type="email"
                    placeholder="add-admin@example.com"
                    value={newAdminEmail}
                    onChange={e => setNewAdminEmail(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                  >
                    Add Email
                  </button>
                </form>
              </div>

              {/* Admin UIDs */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Authorized Admin UIDs (for direct auth / Firebase UID mapping)
                </label>
                <div className="space-y-2">
                  {adminConfig.adminUids.map(uid => (
                    <div
                      key={uid}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono"
                    >
                      <span>{uid}</span>
                      <button
                        onClick={() => {
                          const updated = {
                            ...adminConfig,
                            adminUids: adminConfig.adminUids.filter(u => u !== uid),
                          };
                          saveAdminConfig(updated);
                          setAdminConfig(updated);
                        }}
                        className="text-rose-600 hover:text-rose-800 text-[11px]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddAdminUid} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Enter user UID (e.g. usr_admin_alap)"
                    value={newAdminUid}
                    onChange={e => setNewAdminUid(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                  >
                    Add UID
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* GitHub Hosting & Exporting Guide */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>GitHub Hosting & Deployment Helper</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This application was developed with standard HTML, JavaScript, and React components, compiling cleanly to static files in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">dist/</code>.
            </p>
            <div className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs space-y-2">
              <p className="text-slate-400"># Deploying to GitHub Pages:</p>
              <p>1. npm run build</p>
              <p>2. Push the repository to GitHub</p>
              <p>3. In GitHub repo Settings &gt; Pages &gt; Build from "dist" or GitHub Actions</p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Database to Default Questions</span>
              </button>

              <button
                onClick={() => onOpenExportModal(false)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Full Bank Backup (JSON)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

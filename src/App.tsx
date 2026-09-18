import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { QuestionBankExplorer } from './components/QuestionBankExplorer';
import { QuestionModal } from './components/QuestionModal';
import { ExportModal } from './components/ExportModal';
import { PracticeQuizModal } from './components/PracticeQuizModal';
import { LoginPage } from './components/LoginPage';
import { 
  getStoredQuestions, 
  addOrUpdateQuestion, 
  deleteQuestionById,
  subscribeToQuestions
} from './services/storage';
import { Question, CorrectOption, Difficulty } from './types';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

function MainApp() {
  const { currentUser, isAdmin, loading } = useAuth();

  const [questions, setQuestions] = useState<Question[]>(() => getStoredQuestions());
  const [currentTab, setCurrentTab] = useState<string>('my-questions');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Modals
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSelectiveExport, setIsSelectiveExport] = useState(false);
  const [isPracticeQuizOpen, setIsPracticeQuizOpen] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Route to the appropriate dashboard immediately after login
  useEffect(() => {
    if (currentUser) {
      if (isAdmin) {
        setCurrentTab('admin-all-questions');
      } else {
        setCurrentTab('my-questions');
      }
    }
  }, [currentUser?.uid, isAdmin]);

  // Subscribe to real-time Firestore updates
  useEffect(() => {
    const unsubscribe = subscribeToQuestions((updatedQuestions) => {
      setQuestions(updatedQuestions);
    });
    return () => unsubscribe();
  }, []);

  // Filtered counts
  const myQuestions = useMemo(() => {
    if (!currentUser) return [];
    return questions.filter(
      q => q.contributorUid === currentUser.uid || (!!q.contributorEmail && q.contributorEmail.toLowerCase() === currentUser.email.toLowerCase())
    );
  }, [questions, currentUser]);

  const existingSubjects = useMemo(() => {
    return Array.from(new Set(questions.map(q => q.subject))).sort();
  }, [questions]);

  // Handle Save (Add or Edit)
  const handleSaveQuestion = async (data: {
    id?: string;
    text: string;
    options: { A: string; B: string; C: string; D: string };
    correctOption: CorrectOption;
    subject: string;
    difficulty: Difficulty;
    tags: string[];
    referenceExplanation: string;
  }) => {
    if (!currentUser) {
      return { success: false, error: 'Please sign in to save questions.' };
    }

    const res = await addOrUpdateQuestion(data, currentUser);
    if (res.error) {
      showToast(res.error, 'error');
      return { success: false, error: res.error };
    }

    showToast(data.id ? 'Question updated successfully!' : 'New question added to bank!');
    return { success: true };
  };

  // Handle Delete
  const handleDeleteQuestion = async (id: string) => {
    if (!currentUser) return;
    if (window.confirm('Are you sure you want to delete this question?')) {
      const res = await deleteQuestionById(id, currentUser);
      if (res.success) {
        setSelectedIds(prev => prev.filter(i => i !== id));
        showToast('Question deleted successfully.');
      } else {
        showToast(res.error || 'Failed to delete question', 'error');
      }
    }
  };

  // Trigger Edit
  const handleStartEdit = (question: Question) => {
    setEditingQuestion(question);
    setIsQuestionModalOpen(true);
  };

  // Trigger Add
  const handleStartAdd = () => {
    if (!currentUser) return;
    setEditingQuestion(null);
    setIsQuestionModalOpen(true);
  };

  // Trigger Export
  const handleOpenExport = (selective: boolean = false) => {
    setIsSelectiveExport(selective && selectedIds.length > 0);
    setIsExportModalOpen(true);
  };

  // Questions to export
  const exportTargetQuestions = useMemo(() => {
    if (isSelectiveExport && selectedIds.length > 0) {
      return questions.filter(q => selectedIds.includes(q.id));
    }
    if (currentTab === 'my-questions') {
      return myQuestions;
    }
    return questions;
  }, [questions, myQuestions, isSelectiveExport, selectedIds, currentTab]);

  // If Firebase Auth session is loading, show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-3 text-slate-600">
        <Loader2 className="w-9 h-9 animate-spin text-blue-600" />
        <p className="text-sm font-semibold tracking-wide">Connecting to Quiz Question Bank...</p>
      </div>
    );
  }

  // If not logged in, show the Login Page directly
  if (!currentUser) {
    return <LoginPage />;
  }

  // Once authenticated, show the Admin Dashboard or User Dashboard
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white shadow-emerald-900/20'
                : 'bg-rose-600 text-white shadow-rose-900/20'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Dark Navy Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAddQuestion={handleStartAdd}
        onOpenSignIn={() => {}}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        questionCount={questions.length}
        myQuestionCount={myQuestions.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all">
        {/* Sticky Top Navbar */}
        <Navbar
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onOpenAddQuestion={handleStartAdd}
          onOpenExportModal={() => handleOpenExport(selectedIds.length > 0)}
          selectedCount={selectedIds.length}
          totalCount={questions.length}
          onClearSelection={() => setSelectedIds([])}
          onSelectAll={() => setSelectedIds(questions.map(q => q.id))}
        />

        {/* Main Canvas with Dashboard View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'my-questions' && (
            <UserDashboard
              questions={questions}
              onOpenAddQuestion={handleStartAdd}
              onEditQuestion={handleStartEdit}
              onDeleteQuestion={handleDeleteQuestion}
              onOpenExportModal={handleOpenExport}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
            />
          )}

          {currentTab === 'explore-bank' && (
            <QuestionBankExplorer
              questions={questions}
              onOpenAddQuestion={handleStartAdd}
              onEditQuestion={handleStartEdit}
              onDeleteQuestion={handleDeleteQuestion}
              onOpenExportModal={handleOpenExport}
              onOpenPracticeQuiz={() => setIsPracticeQuizOpen(true)}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
            />
          )}

          {currentTab === 'practice-quiz' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs text-center space-y-4">
                <h2 className="text-xl font-bold text-slate-900">
                  Practice Quiz Mode
                </h2>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Review and test-drive the {questions.length} questions submitted across all disciplines with interactive answer validation and explanations.
                </p>
                <button
                  onClick={() => setIsPracticeQuizOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
                >
                  <span>Launch Interactive Quiz</span>
                </button>
              </div>
            </div>
          )}

          {currentTab === 'admin-all-questions' && (
            <AdminDashboard
              questions={questions}
              onOpenAddQuestion={handleStartAdd}
              onEditQuestion={handleStartEdit}
              onDeleteQuestion={handleDeleteQuestion}
              onOpenExportModal={handleOpenExport}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              initialSubTab="questions"
            />
          )}

          {currentTab === 'admin-users' && (
            <AdminDashboard
              questions={questions}
              onOpenAddQuestion={handleStartAdd}
              onEditQuestion={handleStartEdit}
              onDeleteQuestion={handleDeleteQuestion}
              onOpenExportModal={handleOpenExport}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              initialSubTab="users"
            />
          )}

          {currentTab === 'admin-settings' && (
            <AdminDashboard
              questions={questions}
              onOpenAddQuestion={handleStartAdd}
              onEditQuestion={handleStartEdit}
              onDeleteQuestion={handleDeleteQuestion}
              onOpenExportModal={handleOpenExport}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              initialSubTab="settings"
            />
          )}
        </main>
      </div>

      {/* Question Add/Edit Modal */}
      <QuestionModal
        isOpen={isQuestionModalOpen}
        onClose={() => {
          setIsQuestionModalOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveQuestion}
        initialQuestion={editingQuestion}
        existingSubjects={existingSubjects}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        questions={exportTargetQuestions}
        isSelective={isSelectiveExport}
      />

      {/* Interactive Practice Quiz Modal */}
      <PracticeQuizModal
        isOpen={isPracticeQuizOpen}
        onClose={() => setIsPracticeQuizOpen(false)}
        questions={questions}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

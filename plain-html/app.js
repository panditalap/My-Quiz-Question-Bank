/**
 * QuizMaster Question Bank - Standalone Vanilla JavaScript Edition
 * 
 * Uses standard browser ES Modules and official Google Firebase CDN.
 * No build tools, no bundler, and no npm required!
 * You can edit this file directly in any text editor.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  projectId: "gen-lang-client-0316223119",
  appId: "1:185193631807:web:697f6242a041b67631a88a",
  apiKey: "AIzaSyCHtReEo20SctX1QvZa6DYnD62p73n6o_0",
  authDomain: "gen-lang-client-0316223119.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-quizquestionbank-d42cce1c-aedf-41e8-9d19-2b4dd720a5ff",
  storageBucket: "gen-lang-client-0316223119.firebasestorage.app",
  messagingSenderId: "185193631807"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const ADMIN_EMAIL = 'pandit.alap@gmail.com';

// ==========================================
// 2. APPLICATION STATE
// ==========================================
let currentUser = null;
let isAdmin = false;
let questions = [];
let allUsers = [];
let selectedIds = new Set();
let currentTab = 'explore'; // 'explore' | 'my' | 'admin'
let authMode = 'signin'; // 'signin' | 'signup'

const filters = {
  searchQuery: '',
  subject: '',
  difficulty: '',
  sortBy: 'newest'
};

// ==========================================
// 3. UI HELPERS & TOAST
// ==========================================
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');
  if (!toast || !toastText) return;
  toastText.textContent = message;
  toast.classList.remove('translate-y-12', 'opacity-0', 'pointer-events-none');
  setTimeout(() => {
    toast.classList.add('translate-y-12', 'opacity-0', 'pointer-events-none');
  }, 3500);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ==========================================
// 4. AUTHENTICATION & USER SYNC
// ==========================================
function updateAuthUI() {
  const authContainer = document.getElementById('auth-container');
  const adminTabBtn = document.getElementById('tab-btn-admin');
  const mobAdminTabBtn = document.getElementById('mob-tab-admin');
  const myCountBadge = document.getElementById('my-count-badge');

  const myCount = currentUser 
    ? questions.filter(q => q.contributorUid === currentUser.uid || (q.contributorEmail && q.contributorEmail.toLowerCase() === currentUser.email.toLowerCase())).length 
    : 0;
  if (myCountBadge) myCountBadge.textContent = myCount;

  if (currentUser) {
    if (isAdmin) {
      if (adminTabBtn) adminTabBtn.classList.remove('hidden');
      if (mobAdminTabBtn) mobAdminTabBtn.classList.remove('hidden');
    } else {
      if (adminTabBtn) adminTabBtn.classList.add('hidden');
      if (mobAdminTabBtn) mobAdminTabBtn.classList.add('hidden');
    }

    authContainer.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
          <div class="w-6 h-6 rounded-full ${isAdmin ? 'bg-amber-500' : 'bg-blue-600'} text-white font-bold flex items-center justify-center text-[11px]">
            ${(currentUser.name || currentUser.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div class="hidden sm:block text-left leading-tight">
            <div class="font-bold text-slate-200 text-[11px] truncate max-w-[120px]">${currentUser.name || currentUser.email}</div>
            <div class="text-[9px] ${isAdmin ? 'text-amber-400 font-bold' : 'text-slate-400'}">${isAdmin ? 'ADMINISTRATOR' : 'CONTRIBUTOR'}</div>
          </div>
        </div>
        <button id="btn-signout" class="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all cursor-pointer" title="Sign Out">
          <i data-lucide="log-out" class="w-4 h-4"></i>
        </button>
      </div>
    `;

    document.getElementById('btn-signout')?.addEventListener('click', async () => {
      await signOut(auth);
      showToast('Signed out successfully.');
    });
  } else {
    if (adminTabBtn) adminTabBtn.classList.add('hidden');
    if (mobAdminTabBtn) mobAdminTabBtn.classList.add('hidden');

    authContainer.innerHTML = `
      <button id="btn-open-signin" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5">
        <i data-lucide="log-in" class="w-3.5 h-3.5 text-blue-400"></i>
        <span>Sign In</span>
      </button>
    `;
    document.getElementById('btn-open-signin')?.addEventListener('click', () => openModal('modal-auth'));
  }

  refreshIcons();
}

// Listen to Firebase Auth state
onAuthStateChanged(auth, async (fbUser) => {
  if (fbUser) {
    const emailLower = (fbUser.email || '').toLowerCase();
    isAdmin = emailLower === ADMIN_EMAIL.toLowerCase();

    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        currentUser = snap.data();
      } else {
        const now = new Date().toISOString();
        currentUser = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Contributor',
          role: isAdmin ? 'admin' : 'contributor',
          createdAt: now,
          lastLoginAt: now,
        };
        await setDoc(userDocRef, currentUser);
      }
    } catch (e) {
      console.warn('Auth user document note:', e);
      currentUser = {
        uid: fbUser.uid,
        email: fbUser.email || '',
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Contributor',
        role: isAdmin ? 'admin' : 'contributor',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
    }

    // Subscribe to live users if authenticated
    loadLiveUsers();
  } else {
    currentUser = null;
    isAdmin = false;
    allUsers = [];
    if (currentTab === 'admin' || currentTab === 'my') {
      switchTab('explore');
    }
  }

  updateAuthUI();
  renderQuestions();
  renderMyQuestions();
  renderAdminTable();
  updateMetrics();
});

// Load registered users directly from Firestore
let usersUnsubscribe = null;
async function loadLiveUsers() {
  if (usersUnsubscribe) usersUnsubscribe();

  try {
    const snap = await getDocs(collection(db, 'users'));
    const list = [];
    snap.forEach(d => {
      const u = d.data();
      const emailLower = (u.email || '').toLowerCase();
      if (
        emailLower !== 'sarah.chen@university.edu' &&
        emailLower !== 'marcus.vance@history.org' &&
        emailLower !== 'priya.sharma@tech.io'
      ) {
        list.push(u);
      }
    });
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    allUsers = list;
    renderAdminTable();
  } catch (err) {
    console.warn('Initial users fetch error:', err);
  }

  usersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
    const list = [];
    snapshot.forEach(d => {
      const u = d.data();
      const emailLower = (u.email || '').toLowerCase();
      if (
        emailLower !== 'sarah.chen@university.edu' &&
        emailLower !== 'marcus.vance@history.org' &&
        emailLower !== 'priya.sharma@tech.io'
      ) {
        list.push(u);
      }
    });
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    allUsers = list;
    renderAdminTable();
  }, (err) => console.warn('Users listener notice:', err));
}

// ==========================================
// 5. FIRESTORE REAL-TIME QUESTIONS
// ==========================================
onSnapshot(collection(db, 'questions'), (snapshot) => {
  const list = [];
  snapshot.forEach(docSnap => {
    list.push(docSnap.data());
  });

  list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  questions = list;

  updateSubjectDropdown();
  renderQuestions();
  renderMyQuestions();
  renderAdminTable();
  updateMetrics();
}, (err) => {
  console.warn('Questions listener notice:', err);
});

// Update Subject filter dropdown options
function updateSubjectDropdown() {
  const subjectSelect = document.getElementById('filter-subject');
  if (!subjectSelect) return;
  const currentVal = subjectSelect.value;
  const subjects = Array.from(new Set(questions.map(q => q.subject).filter(Boolean))).sort();

  subjectSelect.innerHTML = '<option value="">All Subjects</option>' + 
    subjects.map(s => `<option value="${s}" ${s === currentVal ? 'selected' : ''}>${s}</option>`).join('');
}

// Update top metric counters
function updateMetrics() {
  const totalQ = document.getElementById('metric-total-questions');
  const totalS = document.getElementById('metric-total-subjects');
  const myQ = document.getElementById('metric-my-questions');
  const myCountBadge = document.getElementById('my-count-badge');

  if (totalQ) totalQ.textContent = questions.length;
  if (totalS) totalS.textContent = new Set(questions.map(q => q.subject)).size;

  const myCount = currentUser 
    ? questions.filter(q => q.contributorUid === currentUser.uid || (q.contributorEmail && q.contributorEmail.toLowerCase() === currentUser.email.toLowerCase())).length 
    : 0;
  if (myQ) myQ.textContent = myCount;
  if (myCountBadge) myCountBadge.textContent = myCount;
}

// ==========================================
// 6. RENDER QUESTIONS (MAIN EXPLORER)
// ==========================================
function getFilteredQuestions() {
  return questions.filter(q => {
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchText = (q.text || '').toLowerCase().includes(query);
      const matchSub = (q.subject || '').toLowerCase().includes(query);
      const matchOpts = Object.values(q.options || {}).some(opt => opt.toLowerCase().includes(query));
      const matchContrib = (q.contributorName || '').toLowerCase().includes(query);
      if (!matchText && !matchSub && !matchOpts && !matchContrib) return false;
    }
    if (filters.subject && q.subject !== filters.subject) return false;
    if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
    return true;
  }).sort((a, b) => {
    if (filters.sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    if (filters.sortBy === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    if (filters.sortBy === 'subject') return (a.subject || '').localeCompare(b.subject || '');
    if (filters.sortBy === 'difficulty') {
      const diff = { Easy: 1, Medium: 2, Hard: 3 };
      return (diff[a.difficulty] || 2) - (diff[b.difficulty] || 2);
    }
    return 0;
  });
}

function renderQuestions() {
  const container = document.getElementById('questions-list');
  if (!container) return;

  const list = getFilteredQuestions();

  if (list.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
        <i data-lucide="help-circle" class="w-10 h-10 text-slate-300 mx-auto mb-2"></i>
        <p class="font-semibold text-slate-700">No questions found</p>
        <p class="text-xs text-slate-400 mt-1">Try adjusting your search criteria or add a new question.</p>
      </div>
    `;
    refreshIcons();
    return;
  }

  container.innerHTML = list.map(q => createQuestionCardHTML(q)).join('');
  attachCardActionListeners();
  refreshIcons();
}

function renderMyQuestions() {
  const container = document.getElementById('my-questions-list');
  if (!container) return;

  if (!currentUser) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
        <i data-lucide="log-in" class="w-10 h-10 text-slate-300 mx-auto mb-2"></i>
        <p class="font-semibold text-slate-700">Sign in to view your questions</p>
        <button onclick="document.getElementById('btn-open-signin')?.click()" class="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold">Sign In</button>
      </div>
    `;
    refreshIcons();
    return;
  }

  const myList = questions.filter(q => q.contributorUid === currentUser.uid || (q.contributorEmail && q.contributorEmail.toLowerCase() === currentUser.email.toLowerCase()));

  if (myList.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
        <i data-lucide="plus-circle" class="w-10 h-10 text-slate-300 mx-auto mb-2"></i>
        <p class="font-semibold text-slate-700">You haven't added any questions yet</p>
        <p class="text-xs text-slate-400 mt-1">Contribute your first question to the shared bank.</p>
        <button id="btn-create-first" class="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold">Create Question</button>
      </div>
    `;
    document.getElementById('btn-create-first')?.addEventListener('click', openAddQuestionModal);
    refreshIcons();
    return;
  }

  container.innerHTML = myList.map(q => createQuestionCardHTML(q)).join('');
  attachCardActionListeners();
  refreshIcons();
}

function createQuestionCardHTML(q) {
  const isSelected = selectedIds.has(q.id);
  const canEdit = currentUser && (isAdmin || q.contributorUid === currentUser.uid || (q.contributorEmail && q.contributorEmail.toLowerCase() === currentUser.email.toLowerCase()));

  const diffColors = {
    Easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Hard: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return `
    <div class="bg-white rounded-2xl border ${isSelected ? 'border-blue-500 shadow-sm ring-1 ring-blue-500/20' : 'border-slate-200/90'} p-5 transition-all space-y-4" data-id="${q.id}">
      
      <!-- Card Top: Select + Subject + Difficulty + Actions -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-2.5 flex-wrap">
          <input type="checkbox" class="card-select-box w-4 h-4 text-blue-600 rounded cursor-pointer" data-id="${q.id}" ${isSelected ? 'checked' : ''}>
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">${q.subject}</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${diffColors[q.difficulty] || diffColors.Medium}">${q.difficulty}</span>
        </div>

        ${canEdit ? `
          <div class="flex items-center gap-1">
            <button class="btn-card-edit p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-colors" data-id="${q.id}" title="Edit Question">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button class="btn-card-delete p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition-colors" data-id="${q.id}" title="Delete Question">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        ` : ''}
      </div>

      <!-- Question Text -->
      <p class="text-sm sm:text-base font-semibold text-slate-900 leading-snug">${escapeHTML(q.text)}</p>

      <!-- Options 2x2 Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
        ${['A', 'B', 'C', 'D'].map(key => {
          const isCorrect = q.correctOption === key;
          return `
            <div class="p-2.5 rounded-xl border flex items-center justify-between gap-2 ${isCorrect ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium' : 'bg-slate-50 border-slate-200/80 text-slate-700'}">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}">${key}</span>
                <span>${escapeHTML(q.options[key] || '')}</span>
              </div>
              ${isCorrect ? '<i data-lucide="check" class="w-4 h-4 text-emerald-600 shrink-0"></i>' : ''}
            </div>
          `;
        }).join('')}
      </div>

      <!-- Explanation & Contributor Footer -->
      <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <div>
          ${q.referenceExplanation ? `
            <details class="cursor-pointer">
              <summary class="font-semibold text-blue-600 hover:underline">Reference Explanation</summary>
              <p class="mt-1 text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">${escapeHTML(q.referenceExplanation)}</p>
            </details>
          ` : '<span class="text-slate-400">No reference explanation provided</span>'}
        </div>
        <div class="flex items-center gap-1.5 text-slate-400">
          <span>By:</span>
          <strong class="text-slate-700">${escapeHTML(q.contributorName || 'Contributor')}</strong>
        </div>
      </div>

    </div>
  `;
}

function attachCardActionListeners() {
  document.querySelectorAll('.card-select-box').forEach(box => {
    box.addEventListener('change', (e) => {
      const id = e.target.getAttribute('data-id');
      if (e.target.checked) selectedIds.add(id);
      else selectedIds.delete(id);
      updateSelectionCounter();
    });
  });

  document.querySelectorAll('.btn-card-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      const question = questions.find(q => q.id === id);
      if (question) openEditQuestionModal(question);
    });
  });

  document.querySelectorAll('.btn-card-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this question?')) {
        try {
          await deleteDoc(doc(db, 'questions', id));
          selectedIds.delete(id);
          updateSelectionCounter();
          showToast('Question deleted successfully.');
        } catch (err) {
          alert('Delete error: ' + err.message);
        }
      }
    });
  });
}

function updateSelectionCounter() {
  const counter = document.getElementById('selection-counter');
  if (counter) counter.textContent = `${selectedIds.size} selected`;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

// ==========================================
// 7. ADMIN DASHBOARD
// ==========================================
function renderAdminTable() {
  const tbody = document.getElementById('admin-users-table-body');
  const countBadge = document.getElementById('admin-user-count');
  if (!tbody) return;

  const usersList = [...allUsers];
  if (currentUser && !usersList.some(u => u.uid === currentUser.uid)) {
    usersList.unshift(currentUser);
  }

  if (countBadge) countBadge.textContent = `${usersList.length} Users`;

  if (usersList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-slate-400">No registered users in database yet</td></tr>`;
    return;
  }

  tbody.innerHTML = usersList.map(u => {
    const userQuestions = questions.filter(q => q.contributorUid === u.uid || (q.contributorEmail && q.contributorEmail.toLowerCase() === u.email.toLowerCase()));
    const subjects = Array.from(new Set(userQuestions.map(q => q.subject).filter(Boolean)));
    const isUserAdmin = u.role === 'admin' || u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-4">
          <div class="font-semibold text-slate-900">${escapeHTML(u.name || 'User')}</div>
          <div class="text-[11px] text-slate-400 font-mono">${escapeHTML(u.email)}</div>
        </td>
        <td class="py-3 px-4">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isUserAdmin ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700'}">
            ${isUserAdmin ? 'ADMIN' : 'Contributor'}
          </span>
        </td>
        <td class="py-3 px-4 font-bold text-slate-900">${userQuestions.length}</td>
        <td class="py-3 px-4">
          <div class="flex flex-wrap gap-1">
            ${subjects.length > 0 ? subjects.map(s => `<span class="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px]">${s}</span>`).join('') : '<span class="text-slate-400 italic">None yet</span>'}
          </div>
        </td>
        <td class="py-3 px-4 text-slate-500">${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// 8. MODAL HANDLERS
// ==========================================
function openModal(modalId) {
  document.getElementById(modalId)?.classList.remove('hidden');
}

function closeModal(modalId) {
  document.getElementById(modalId)?.classList.add('hidden');
}

// Add/Edit Question Modal
function openAddQuestionModal() {
  if (!currentUser) {
    openModal('modal-auth');
    return;
  }
  document.getElementById('modal-question-title').textContent = 'Add New Question';
  document.getElementById('q-id').value = '';
  document.getElementById('form-question').reset();
  openModal('modal-question');
}

function openEditQuestionModal(q) {
  document.getElementById('modal-question-title').textContent = 'Edit Question';
  document.getElementById('q-id').value = q.id;
  document.getElementById('q-text').value = q.text;
  document.getElementById('q-subject').value = q.subject;
  document.getElementById('q-difficulty').value = q.difficulty;
  document.getElementById('q-opt-a').value = q.options.A || '';
  document.getElementById('q-opt-b').value = q.options.B || '';
  document.getElementById('q-opt-c').value = q.options.C || '';
  document.getElementById('q-opt-d').value = q.options.D || '';
  document.getElementById('q-ref').value = q.referenceExplanation || '';
  document.getElementById('q-tags').value = (q.tags || []).join(', ');

  const radio = document.querySelector(`input[name="q-correct"][value="${q.correctOption}"]`);
  if (radio) radio.checked = true;

  openModal('modal-question');
}

// Question Form Submission
document.getElementById('form-question')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const id = document.getElementById('q-id').value || `q_${Date.now()}`;
  const now = new Date().toISOString();

  const correctRadio = document.querySelector('input[name="q-correct"]:checked');
  const correctOption = correctRadio ? correctRadio.value : 'A';

  const tags = document.getElementById('q-tags').value
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  const questionData = {
    id,
    text: document.getElementById('q-text').value.trim(),
    subject: document.getElementById('q-subject').value.trim(),
    difficulty: document.getElementById('q-difficulty').value,
    options: {
      A: document.getElementById('q-opt-a').value.trim(),
      B: document.getElementById('q-opt-b').value.trim(),
      C: document.getElementById('q-opt-c').value.trim(),
      D: document.getElementById('q-opt-d').value.trim(),
    },
    correctOption,
    referenceExplanation: document.getElementById('q-ref').value.trim(),
    tags,
    contributorUid: currentUser.uid,
    contributorName: currentUser.name || currentUser.email.split('@')[0],
    contributorEmail: currentUser.email,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'questions', id), questionData);
    closeModal('modal-question');
    showToast(document.getElementById('q-id').value ? 'Question updated!' : 'Question added to bank!');
  } catch (err) {
    alert('Error saving question: ' + err.message);
  }
});

// Authentication Modal Logic
document.getElementById('btn-google-signin')?.addEventListener('click', async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    closeModal('modal-auth');
    showToast('Signed in with Google!');
  } catch (err) {
    alert('Google sign-in error: ' + err.message);
  }
});

document.getElementById('btn-toggle-auth-mode')?.addEventListener('click', () => {
  authMode = authMode === 'signin' ? 'signup' : 'signin';
  const signupFields = document.getElementById('auth-signup-fields');
  const title = document.getElementById('modal-auth-title');
  const submitBtn = document.getElementById('btn-auth-submit');
  const toggleBtn = document.getElementById('btn-toggle-auth-mode');

  if (authMode === 'signup') {
    signupFields.classList.remove('hidden');
    title.textContent = 'Create New Account';
    submitBtn.textContent = 'Sign Up';
    toggleBtn.textContent = 'Already have an account? Sign in';
  } else {
    signupFields.classList.add('hidden');
    title.textContent = 'Sign in to QuizMaster';
    submitBtn.textContent = 'Sign In';
    toggleBtn.textContent = "Don't have an account? Sign up";
  }
});

document.getElementById('form-auth')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const errorEl = document.getElementById('auth-error-msg');
  errorEl.classList.add('hidden');

  try {
    if (authMode === 'signin') {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      const name = document.getElementById('auth-name').value.trim() || email.split('@')[0];
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
    }
    closeModal('modal-auth');
    showToast('Signed in successfully!');
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
});

// Practice Quiz Modal Logic
let quizQuestions = [];
let quizIndex = 0;
let userAnswers = {};

function startQuiz() {
  const filtered = getFilteredQuestions();
  quizQuestions = filtered.length > 0 ? filtered : questions;
  if (quizQuestions.length === 0) {
    alert('No questions available to practice.');
    return;
  }
  quizIndex = 0;
  userAnswers = {};
  renderQuizStep();
  openModal('modal-quiz');
}

function renderQuizStep() {
  const container = document.getElementById('quiz-container');
  if (!container) return;

  if (quizIndex >= quizQuestions.length) {
    // Show results
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctOption) score++;
    });
    const pct = Math.round((score / quizQuestions.length) * 100);

    container.innerHTML = `
      <div class="text-center py-6 space-y-4">
        <div class="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-2xl font-black">
          ${pct}%
        </div>
        <h4 class="text-lg font-bold text-slate-900">Quiz Completed!</h4>
        <p class="text-slate-500 text-xs">You scored ${score} out of ${quizQuestions.length} correct.</p>
        <button id="btn-restart-quiz" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer">
          Try Again
        </button>
      </div>
    `;
    document.getElementById('btn-restart-quiz')?.addEventListener('click', startQuiz);
    return;
  }

  const q = quizQuestions[quizIndex];
  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between text-xs text-slate-500 border-b pb-2">
        <span>Question ${quizIndex + 1} of ${quizQuestions.length}</span>
        <span class="font-bold text-blue-600">${q.subject}</span>
      </div>

      <p class="text-base font-semibold text-slate-900">${escapeHTML(q.text)}</p>

      <div class="space-y-2">
        ${['A', 'B', 'C', 'D'].map(key => `
          <button class="quiz-opt-btn w-full p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left flex items-center gap-3 transition-all cursor-pointer ${userAnswers[quizIndex] === key ? 'border-blue-600 bg-blue-50' : ''}" data-key="${key}">
            <span class="w-6 h-6 rounded-md bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs">${key}</span>
            <span class="text-xs sm:text-sm font-medium text-slate-800">${escapeHTML(q.options[key] || '')}</span>
          </button>
        `).join('')}
      </div>

      <div class="pt-4 flex justify-between">
        <button id="btn-quiz-prev" class="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold ${quizIndex === 0 ? 'opacity-40 pointer-events-none' : ''}">Previous</button>
        <button id="btn-quiz-next" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer">
          ${quizIndex === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
        </button>
      </div>
    </div>
  `;

  document.querySelectorAll('.quiz-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      userAnswers[quizIndex] = btn.getAttribute('data-key');
      renderQuizStep();
    });
  });

  document.getElementById('btn-quiz-prev')?.addEventListener('click', () => {
    if (quizIndex > 0) {
      quizIndex--;
      renderQuizStep();
    }
  });

  document.getElementById('btn-quiz-next')?.addEventListener('click', () => {
    quizIndex++;
    renderQuizStep();
  });
}

// Export Formats Download
function downloadExport(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  closeModal('modal-export');
  showToast(`Downloaded ${filename}`);
}

function getExportQuestions() {
  if (selectedIds.size > 0) {
    return questions.filter(q => selectedIds.has(q.id));
  }
  return getFilteredQuestions();
}

// ==========================================
// 9. EVENT LISTENERS SETUP
// ==========================================
function switchTab(tab) {
  currentTab = tab;
  document.getElementById('view-explore').classList.add('hidden');
  document.getElementById('view-my-questions').classList.add('hidden');
  document.getElementById('view-admin').classList.add('hidden');

  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('bg-blue-600', 'text-white');
    b.classList.add('text-slate-300');
  });

  if (tab === 'explore') {
    document.getElementById('view-explore').classList.remove('hidden');
    document.getElementById('tab-btn-explore')?.classList.add('bg-blue-600', 'text-white');
    renderQuestions();
  } else if (tab === 'my') {
    document.getElementById('view-my-questions').classList.remove('hidden');
    document.getElementById('tab-btn-my')?.classList.add('bg-blue-600', 'text-white');
    renderMyQuestions();
  } else if (tab === 'admin') {
    document.getElementById('view-admin').classList.remove('hidden');
    document.getElementById('tab-btn-admin')?.classList.add('bg-blue-600', 'text-white');
    renderAdminTable();
  }
}

// Brand click -> home
document.getElementById('nav-brand')?.addEventListener('click', () => switchTab('explore'));

// Tab Buttons
document.getElementById('tab-btn-explore')?.addEventListener('click', () => switchTab('explore'));
document.getElementById('tab-btn-my')?.addEventListener('click', () => switchTab('my'));
document.getElementById('tab-btn-admin')?.addEventListener('click', () => switchTab('admin'));

// Mobile Tabs
document.getElementById('mob-tab-explore')?.addEventListener('click', () => switchTab('explore'));
document.getElementById('mob-tab-my')?.addEventListener('click', () => switchTab('my'));
document.getElementById('mob-tab-admin')?.addEventListener('click', () => switchTab('admin'));
document.getElementById('mob-btn-quiz')?.addEventListener('click', startQuiz);

// Toolbar Buttons
document.getElementById('btn-add-question')?.addEventListener('click', openAddQuestionModal);
document.getElementById('btn-my-add-question')?.addEventListener('click', openAddQuestionModal);
document.getElementById('btn-practice-quiz')?.addEventListener('click', startQuiz);
document.getElementById('btn-admin-refresh')?.addEventListener('click', loadLiveUsers);

// Modal Close buttons
document.getElementById('modal-question-close')?.addEventListener('click', () => closeModal('modal-question'));
document.getElementById('modal-question-cancel')?.addEventListener('click', () => closeModal('modal-question'));
document.getElementById('modal-auth-close')?.addEventListener('click', () => closeModal('modal-auth'));
document.getElementById('modal-quiz-close')?.addEventListener('click', () => closeModal('modal-quiz'));
document.getElementById('modal-export-close')?.addEventListener('click', () => closeModal('modal-export'));
document.getElementById('btn-open-export')?.addEventListener('click', () => openModal('modal-export'));

// Filter Toolbar
document.getElementById('filter-search')?.addEventListener('input', (e) => {
  filters.searchQuery = e.target.value;
  renderQuestions();
});

document.getElementById('filter-subject')?.addEventListener('change', (e) => {
  filters.subject = e.target.value;
  renderQuestions();
});

document.getElementById('filter-difficulty')?.addEventListener('change', (e) => {
  filters.difficulty = e.target.value;
  renderQuestions();
});

document.getElementById('filter-sort')?.addEventListener('change', (e) => {
  filters.sortBy = e.target.value;
  renderQuestions();
});

document.getElementById('btn-select-all')?.addEventListener('click', () => {
  const visible = getFilteredQuestions();
  visible.forEach(q => selectedIds.add(q.id));
  updateSelectionCounter();
  renderQuestions();
});

document.getElementById('btn-deselect-all')?.addEventListener('click', () => {
  selectedIds.clear();
  updateSelectionCounter();
  renderQuestions();
});

// Export triggers
document.getElementById('btn-export-json')?.addEventListener('click', () => {
  const data = getExportQuestions();
  downloadExport(JSON.stringify(data, null, 2), 'quizmaster_questions.json', 'application/json');
});

document.getElementById('btn-export-csv')?.addEventListener('click', () => {
  const data = getExportQuestions();
  const headers = ['ID', 'Subject', 'Difficulty', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Option', 'Reference Explanation', 'Contributor'];
  const rows = data.map(q => [
    q.id,
    q.subject,
    q.difficulty,
    `"${(q.text || '').replace(/"/g, '""')}"`,
    `"${(q.options?.A || '').replace(/"/g, '""')}"`,
    `"${(q.options?.B || '').replace(/"/g, '""')}"`,
    `"${(q.options?.C || '').replace(/"/g, '""')}"`,
    `"${(q.options?.D || '').replace(/"/g, '""')}"`,
    q.correctOption,
    `"${(q.referenceExplanation || '').replace(/"/g, '""')}"`,
    q.contributorName
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadExport(csv, 'quizmaster_questions.csv', 'text/csv');
});

document.getElementById('btn-export-gift')?.addEventListener('click', () => {
  const data = getExportQuestions();
  const gift = data.map(q => {
    return `// Question: ${q.id}\n::${q.subject} - ${q.difficulty}:: ${q.text} {\n` +
      `  ${q.correctOption === 'A' ? '=' : '~'}${q.options.A}\n` +
      `  ${q.correctOption === 'B' ? '=' : '~'}${q.options.B}\n` +
      `  ${q.correctOption === 'C' ? '=' : '~'}${q.options.C}\n` +
      `  ${q.correctOption === 'D' ? '=' : '~'}${q.options.D}\n` +
      (q.referenceExplanation ? `  #### ${q.referenceExplanation}\n` : '') +
      `}\n`;
  }).join('\n');
  downloadExport(gift, 'quizmaster_questions.gift.txt', 'text/plain');
});

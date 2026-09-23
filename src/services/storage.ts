import { Question, User, ExportFormat, CorrectOption, Difficulty } from '../types';
import { INITIAL_QUESTIONS, INITIAL_USERS, ADMIN_EMAIL } from './seedData';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs
} from 'firebase/firestore';

const STORAGE_KEYS = {
  QUESTIONS: 'quiz_qb_questions_v1',
  USERS: 'quiz_qb_users_v1',
  ADMIN_CONFIG: 'quiz_qb_admin_config_v1',
};

export interface AdminConfig {
  adminEmails: string[];
  adminUids: string[];
}

export function getAdminConfig(): AdminConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse admin config', e);
  }
  return {
    adminEmails: [ADMIN_EMAIL.toLowerCase(), 'pandit.alap@gmail.com'],
    adminUids: ['usr_admin_alap'],
  };
}

export function saveAdminConfig(config: AdminConfig): void {
  localStorage.setItem(STORAGE_KEYS.ADMIN_CONFIG, JSON.stringify(config));
}

export function isUserAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const emailLower = (user.email || '').toLowerCase();
  if (emailLower === 'pandit.alap@gmail.com' || emailLower === ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  const config = getAdminConfig();
  if (config.adminEmails.some(e => e.toLowerCase() === emailLower)) {
    return true;
  }
  if (config.adminUids.includes(user.uid)) {
    return true;
  }
  return false;
}

export function canEditQuestion(user: User | null | undefined, question: Question): boolean {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  return question.contributorUid === user.uid || (!!question.contributorEmail && question.contributorEmail.toLowerCase() === user.email.toLowerCase());
}

export function canDeleteQuestion(user: User | null | undefined, question: Question): boolean {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  return question.contributorUid === user.uid || (!!question.contributorEmail && question.contributorEmail.toLowerCase() === user.email.toLowerCase());
}

export function getStoredQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading questions from local storage', e);
  }
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
  return INITIAL_QUESTIONS;
}

export function saveAllQuestions(questions: Question[]): void {
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
}

// Clear legacy mock users cache if present
try {
  localStorage.removeItem(STORAGE_KEYS.USERS);
} catch (e) {
  // ignore
}

export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((u: User) => {
          const emailLower = (u.email || '').toLowerCase();
          return (
            emailLower !== 'sarah.chen@university.edu' &&
            emailLower !== 'marcus.vance@history.org' &&
            emailLower !== 'priya.sharma@tech.io' &&
            u.uid !== 'usr_sarah_chen' &&
            u.uid !== 'usr_marcus_vance' &&
            u.uid !== 'usr_priya_sharma'
          );
        });
      }
    }
  } catch (e) {
    console.error('Error loading users', e);
  }
  return [];
}

export function saveAllUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export interface QuestionInput {
  id?: string;
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correctOption: CorrectOption;
  subject: string;
  difficulty: Difficulty;
  tags: string[];
  referenceExplanation: string;
}

/**
 * Direct async fetch of questions from Firestore with fallback to cached questions
 */
export async function fetchQuestionsFromFirestore(): Promise<Question[]> {
  try {
    const qCol = collection(db, 'questions');
    const snapshot = await getDocs(qCol);
    if (!snapshot.empty) {
      const list: Question[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Question);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      saveAllQuestions(list);
      return list;
    }
  } catch (err) {
    console.warn('Direct questions fetch notice:', err);
  }
  return getStoredQuestions();
}

/**
 * Real-time Firestore subscription with local cache fallback
 */
export function subscribeToQuestions(
  onUpdate: (questions: Question[]) => void,
  onError?: (error: Error) => void
): () => void {
  const qCol = collection(db, 'questions');
  let hasSeeded = false;

  const unsubscribe = onSnapshot(qCol, async (snapshot) => {
    if (snapshot.empty && !hasSeeded) {
      hasSeeded = true;
      const initial = getStoredQuestions();
      if (auth.currentUser) {
        try {
          const batch = writeBatch(db);
          initial.forEach(q => {
            batch.set(doc(db, 'questions', q.id), q);
          });
          await batch.commit();
        } catch (e) {
          console.warn('Initial questions Firestore seeding notice:', e);
        }
      }
      onUpdate(initial);
      return;
    }

    const list: Question[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as Question);
    });

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    saveAllQuestions(list);
    onUpdate(list);
  }, (err) => {
    console.error('Questions snapshot error:', err);
    try {
      handleFirestoreError(err, OperationType.GET, 'questions');
    } catch (e) {
      if (onError && e instanceof Error) {
        onError(e);
      }
    }
    // Fallback to locally cached questions
    onUpdate(getStoredQuestions());
  });

  return unsubscribe;
}

export async function addOrUpdateQuestion(
  data: QuestionInput,
  currentUser: User
): Promise<{ question: Question; error?: string }> {
  const all = getStoredQuestions();
  const now = new Date().toISOString();

  if (data.id) {
    // Edit existing
    const idx = all.findIndex(q => q.id === data.id);
    if (idx === -1) {
      return { question: {} as Question, error: 'Question not found' };
    }
    const existing = all[idx];
    if (!canEditQuestion(currentUser, existing)) {
      return { question: {} as Question, error: 'Security violation: You do not have permission to edit this question' };
    }

    const updated: Question = {
      ...existing,
      text: data.text.trim(),
      options: {
        A: data.options.A.trim(),
        B: data.options.B.trim(),
        C: data.options.C.trim(),
        D: data.options.D.trim(),
      },
      correctOption: data.correctOption,
      subject: data.subject.trim(),
      difficulty: data.difficulty,
      tags: data.tags.map(t => t.trim().toLowerCase()).filter(Boolean),
      referenceExplanation: data.referenceExplanation.trim(),
      updatedAt: now,
    };

    all[idx] = updated;
    saveAllQuestions(all);

    // Save to Firestore
    try {
      await setDoc(doc(db, 'questions', updated.id), updated);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, `questions/${updated.id}`);
      } catch (e: any) {
        console.warn('Firestore update sync error:', e.message);
      }
    }

    return { question: updated };
  } else {
    // Create new
    const newId = 'q_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const newQuestion: Question = {
      id: newId,
      text: data.text.trim(),
      options: {
        A: data.options.A.trim(),
        B: data.options.B.trim(),
        C: data.options.C.trim(),
        D: data.options.D.trim(),
      },
      correctOption: data.correctOption,
      subject: data.subject.trim(),
      difficulty: data.difficulty,
      tags: data.tags.map(t => t.trim().toLowerCase()).filter(Boolean),
      referenceExplanation: data.referenceExplanation.trim(),
      contributorUid: currentUser.uid,
      contributorName: currentUser.name || currentUser.email.split('@')[0],
      contributorEmail: currentUser.email,
      createdAt: now,
      updatedAt: now,
    };

    all.unshift(newQuestion);
    saveAllQuestions(all);

    // Save to Firestore
    try {
      await setDoc(doc(db, 'questions', newQuestion.id), newQuestion);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, `questions/${newQuestion.id}`);
      } catch (e: any) {
        console.warn('Firestore create sync error:', e.message);
      }
    }

    return { question: newQuestion };
  }
}

export async function deleteQuestionById(id: string, currentUser: User): Promise<{ success: boolean; error?: string }> {
  const all = getStoredQuestions();
  const target = all.find(q => q.id === id);
  if (!target) {
    return { success: false, error: 'Question not found' };
  }
  if (!canDeleteQuestion(currentUser, target)) {
    return { success: false, error: 'Security policy: You can only delete your own questions unless you are an administrator' };
  }

  const filtered = all.filter(q => q.id !== id);
  saveAllQuestions(filtered);

  // Delete from Firestore
  try {
    await deleteDoc(doc(db, 'questions', id));
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.DELETE, `questions/${id}`);
    } catch (e: any) {
      console.warn('Firestore delete sync error:', e.message);
    }
  }

  return { success: true };
}

export function getUserStats(allQuestions: Question[] = getStoredQuestions(), usersList: User[] = getStoredUsers()) {
  const filteredUsers = (usersList || []).filter(u => {
    const emailLower = (u.email || '').toLowerCase();
    return (
      emailLower !== 'sarah.chen@university.edu' &&
      emailLower !== 'marcus.vance@history.org' &&
      emailLower !== 'priya.sharma@tech.io' &&
      u.uid !== 'usr_sarah_chen' &&
      u.uid !== 'usr_marcus_vance' &&
      u.uid !== 'usr_priya_sharma'
    );
  });

  return filteredUsers.map(user => {
    const userQuestions = allQuestions.filter(
      q => q.contributorUid === user.uid || (!!q.contributorEmail && q.contributorEmail.toLowerCase() === user.email.toLowerCase())
    );
    const subjects = Array.from(new Set(userQuestions.map(q => q.subject)));
    const sorted = [...userQuestions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const lastContribution = sorted.length > 0 ? sorted[0].createdAt : user.createdAt;

    return {
      user,
      totalCount: userQuestions.length,
      subjects,
      lastContribution,
      isAdmin: isUserAdmin(user),
    };
  });
}

export function resetDatabaseToDefault(): void {
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
  localStorage.removeItem(STORAGE_KEYS.USERS);
  localStorage.setItem(
    STORAGE_KEYS.ADMIN_CONFIG,
    JSON.stringify({
      adminEmails: [ADMIN_EMAIL.toLowerCase(), 'pandit.alap@gmail.com'],
      adminUids: ['usr_admin_alap'],
    })
  );
}

// Exporting utilities
export function generateExportContent(
  questions: Question[],
  format: ExportFormat,
  options: { includeAnswers?: boolean; includeExplanations?: boolean } = { includeAnswers: true, includeExplanations: true }
): { content: string; mimeType: string; extension: string } {
  if (format === 'json') {
    const dataToExport = questions.map(q => {
      const base: Record<string, any> = {
        id: q.id,
        subject: q.subject,
        difficulty: q.difficulty,
        tags: q.tags,
        question: q.text,
        options: q.options,
        contributor: {
          name: q.contributorName,
          email: q.contributorEmail,
        },
        createdAt: q.createdAt,
      };
      if (options.includeAnswers) {
        base.correctOption = q.correctOption;
        base.correctAnswerText = q.options[q.correctOption];
      }
      if (options.includeExplanations) {
        base.referenceExplanation = q.referenceExplanation;
      }
      return base;
    });
    return {
      content: JSON.stringify(dataToExport, null, 2),
      mimeType: 'application/json',
      extension: 'json',
    };
  }

  if (format === 'csv') {
    const headers = [
      'ID',
      'Subject',
      'Difficulty',
      'Question',
      'Option A',
      'Option B',
      'Option C',
      'Option D',
      ...(options.includeAnswers ? ['Correct Option Key', 'Correct Answer Text'] : []),
      ...(options.includeExplanations ? ['Explanation / Reference'] : []),
      'Tags',
      'Contributor Name',
      'Contributor Email',
      'Date Created',
    ];

    const escapeCsv = (str: string) => {
      if (!str) return '""';
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const rows = questions.map(q => {
      const row = [
        escapeCsv(q.id),
        escapeCsv(q.subject),
        escapeCsv(q.difficulty),
        escapeCsv(q.text),
        escapeCsv(q.options.A),
        escapeCsv(q.options.B),
        escapeCsv(q.options.C),
        escapeCsv(q.options.D),
      ];
      if (options.includeAnswers) {
        row.push(escapeCsv(q.correctOption));
        row.push(escapeCsv(q.options[q.correctOption]));
      }
      if (options.includeExplanations) {
        row.push(escapeCsv(q.referenceExplanation || ''));
      }
      row.push(escapeCsv(q.tags.join(', ')));
      row.push(escapeCsv(q.contributorName));
      row.push(escapeCsv(q.contributorEmail));
      row.push(escapeCsv(q.createdAt.split('T')[0]));
      return row.join(',');
    });

    return {
      content: [headers.join(','), ...rows].join('\n'),
      mimeType: 'text/csv;charset=utf-8;',
      extension: 'csv',
    };
  }

  if (format === 'gift') {
    const lines = questions.map(q => {
      const opts = (['A', 'B', 'C', 'D'] as const).map(key => {
        const isCorrect = options.includeAnswers && key === q.correctOption;
        const prefix = isCorrect ? '=' : '~';
        return `${prefix}${q.options[key].replace(/([=~#{}])/g, '\\$1')}`;
      });

      const feedback = options.includeExplanations && q.referenceExplanation
        ? ` #### ${q.referenceExplanation.replace(/([=~#{}])/g, '\\$1')}`
        : '';

      return `// [${q.subject}] [${q.difficulty}] - Contributed by ${q.contributorName}\n::${q.subject} - ${q.id}:: ${q.text.replace(/([=~#{}])/g, '\\$1')} {\n  ${opts.join('\n  ')}${feedback}\n}\n`;
    });

    return {
      content: lines.join('\n'),
      mimeType: 'text/plain;charset=utf-8;',
      extension: 'gift.txt',
    };
  }

  const sheet = questions.map((q, idx) => {
    let block = `${idx + 1}. [${q.subject} | ${q.difficulty}] ${q.text}\n`;
    block += `   A) ${q.options.A}\n`;
    block += `   B) ${q.options.B}\n`;
    block += `   C) ${q.options.C}\n`;
    block += `   D) ${q.options.D}\n`;
    if (options.includeAnswers) {
      block += `   ★ Correct Answer: Option ${q.correctOption} (${q.options[q.correctOption]})\n`;
    }
    if (options.includeExplanations && q.referenceExplanation) {
      block += `   ℹ Reference/Explanation: ${q.referenceExplanation}\n`;
    }
    block += `   • Tags: ${q.tags.join(', ')} | Contributor: ${q.contributorName} (${q.contributorEmail})\n`;
    return block;
  });

  return {
    content: sheet.join('\n\n'),
    mimeType: 'text/plain;charset=utf-8;',
    extension: 'txt',
  };
}

export function triggerFileDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

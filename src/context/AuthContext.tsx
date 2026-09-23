import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, deleteDoc, getDocs } from 'firebase/firestore';
import { isUserAdmin } from '../services/storage';
import { ADMIN_EMAIL } from '../services/seedData';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: { email: string; name: string; password: string; subjectSpecialty?: string }) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  allUsers: User[];
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Synchronize registered users from Firestore whenever authenticated
  useEffect(() => {
    if (!currentUser) {
      setAllUsers([]);
      return;
    }

    let isMounted = true;

    // 1. Fetch immediately to ensure instant availability without requiring page reload
    const loadUsers = async () => {
      try {
        const usersCol = collection(db, 'users');
        const snap = await getDocs(usersCol);
        if (!isMounted) return;
        const list: User[] = [];
        snap.forEach(docSnap => {
          const u = docSnap.data() as User;
          const emailLower = (u.email || '').toLowerCase();
          if (
            emailLower === 'sarah.chen@university.edu' ||
            emailLower === 'marcus.vance@history.org' ||
            emailLower === 'priya.sharma@tech.io' ||
            u.uid === 'usr_sarah_chen' ||
            u.uid === 'usr_marcus_vance' ||
            u.uid === 'usr_priya_sharma'
          ) {
            deleteDoc(doc(db, 'users', docSnap.id)).catch(() => {});
            return;
          }
          list.push(u);
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setAllUsers(list);
      } catch (err: any) {
        console.warn('Initial users fetch notice:', err?.message || err);
      }
    };

    loadUsers();

    // 2. Maintain a live snapshot listener for real-time changes
    const path = 'users';
    const usersCol = collection(db, path);
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      if (!isMounted) return;
      const list: User[] = [];
      snapshot.forEach(docSnap => {
        const u = docSnap.data() as User;
        const emailLower = (u.email || '').toLowerCase();
        if (
          emailLower === 'sarah.chen@university.edu' ||
          emailLower === 'marcus.vance@history.org' ||
          emailLower === 'priya.sharma@tech.io' ||
          u.uid === 'usr_sarah_chen' ||
          u.uid === 'usr_marcus_vance' ||
          u.uid === 'usr_priya_sharma'
        ) {
          deleteDoc(doc(db, 'users', docSnap.id)).catch(() => {});
          return;
        }
        list.push(u);
      });
      
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setAllUsers(list);
    }, (error) => {
      console.warn('Notice listening to users collection:', error.message);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const emailLower = (fbUser.email || '').toLowerCase();
        const isAdminUser = emailLower === 'pandit.alap@gmail.com' || emailLower === ADMIN_EMAIL.toLowerCase();
        const path = `users/${fbUser.uid}`;

        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);

          if (snap.exists()) {
            const data = snap.data() as User;
            const updatedUser: User = {
              ...data,
              role: isAdminUser ? 'admin' : (data.role || 'contributor'),
              email: fbUser.email || data.email,
              name: fbUser.displayName || data.name || fbUser.email?.split('@')[0] || 'User',
            };
            setCurrentUser(updatedUser);
          } else {
            const now = new Date().toISOString();
            const newUser: User = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Contributor',
              role: isAdminUser ? 'admin' : 'contributor',
              createdAt: now,
              lastLoginAt: now,
            };
            await setDoc(userDocRef, newUser);
            setCurrentUser(newUser);
          }

          // If admin, ensure admins collection record exists
          if (isAdminUser) {
            try {
              await setDoc(doc(db, 'admins', fbUser.uid), {
                uid: fbUser.uid,
                email: fbUser.email,
                updatedAt: new Date().toISOString(),
              }, { merge: true });
            } catch (adminErr) {
              console.warn('Admin record sync notice:', adminErr);
            }
          }
        } catch (err) {
          console.error('Error fetching user document:', err);
          // Graceful fallback to Firebase Auth user profile
          const fallbackUser: User = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Contributor',
            role: isAdminUser ? 'admin' : 'contributor',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };
          setCurrentUser(fallbackUser);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: User[] = [];
      snap.forEach(docSnap => {
        const u = docSnap.data() as User;
        const emailLower = (u.email || '').toLowerCase();
        if (
          emailLower !== 'sarah.chen@university.edu' &&
          emailLower !== 'marcus.vance@history.org' &&
          emailLower !== 'priya.sharma@tech.io' &&
          u.uid !== 'usr_sarah_chen' &&
          u.uid !== 'usr_marcus_vance' &&
          u.uid !== 'usr_priya_sharma'
        ) {
          list.push(u);
        }
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setAllUsers(list);
    } catch (err) {
      console.warn('Manual refresh users note:', err);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return { success: false, error: 'Please enter your email address' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password' };
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      const emailLower = (cred.user.email || trimmedEmail).toLowerCase();
      const isAdminUser = emailLower === 'pandit.alap@gmail.com' || emailLower === ADMIN_EMAIL.toLowerCase();
      const userRef = doc(db, 'users', cred.user.uid);
      const now = new Date().toISOString();

      try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          await updateDoc(userRef, {
            lastLoginAt: now,
            ...(isAdminUser ? { role: 'admin' } : {}),
          });
        } else {
          const newUser: User = {
            uid: cred.user.uid,
            email: trimmedEmail,
            name: cred.user.displayName || trimmedEmail.split('@')[0],
            role: isAdminUser ? 'admin' : 'contributor',
            createdAt: now,
            lastLoginAt: now,
          };
          await setDoc(userRef, newUser);
        }
      } catch (dbErr) {
        console.warn('User profile sync notice:', dbErr);
      }

      return { success: true };
    } catch (err: any) {
      let message = 'Failed to sign in. Please check your credentials.';
      const code = err?.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        message = 'Invalid email or password. Please verify your credentials or create a new account.';
      } else if (code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (code === 'auth/user-disabled') {
        message = 'This user account has been disabled.';
      } else if (code === 'auth/too-many-requests') {
        message = 'Too many failed login attempts. Please wait a moment and try again.';
      } else if (code === 'auth/operation-not-allowed') {
        message = 'Email/Password sign-in is disabled in Firebase Authentication. Please enable Email/Password provider in the Firebase Console under Authentication > Sign-in method, or sign in with Google.';
      } else if (err?.message) {
        message = err.message;
      }
      return { success: false, error: message };
    }
  };

  const signUp = async (data: { 
    email: string; 
    name: string; 
    password: string; 
    subjectSpecialty?: string 
  }): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = data.email.trim();
    const trimmedName = data.name.trim();

    if (!trimmedEmail) {
      return { success: false, error: 'Please enter your email address' };
    }
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      return { success: false, error: 'Please enter a valid email address' };
    }
    if (!trimmedName) {
      return { success: false, error: 'Please enter your full name' };
    }
    if (!data.password || data.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long' };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, data.password);
      
      // Update Auth Profile Display Name
      await updateProfile(cred.user, { displayName: trimmedName });

      const emailLower = trimmedEmail.toLowerCase();
      const isAdminUser = emailLower === 'pandit.alap@gmail.com' || emailLower === ADMIN_EMAIL.toLowerCase();
      const now = new Date().toISOString();

      const newUser: User = {
        uid: cred.user.uid,
        email: trimmedEmail,
        name: trimmedName,
        role: isAdminUser ? 'admin' : 'contributor',
        subjectSpecialty: data.subjectSpecialty?.trim() || '',
        createdAt: now,
        lastLoginAt: now,
      };

      const userRef = doc(db, 'users', cred.user.uid);
      await setDoc(userRef, newUser);

      if (isAdminUser) {
        try {
          await setDoc(doc(db, 'admins', cred.user.uid), {
            uid: cred.user.uid,
            email: trimmedEmail,
            createdAt: now,
          });
        } catch (adminErr) {
          console.warn('Admin record creation notice:', adminErr);
        }
      }

      setCurrentUser(newUser);
      return { success: true };
    } catch (err: any) {
      let message = 'Failed to create account. Please try again.';
      const code = err?.code;
      if (code === 'auth/email-already-in-use') {
        message = 'An account with this email address already exists. Please sign in instead.';
      } else if (code === 'auth/invalid-email') {
        message = 'Please provide a valid email format.';
      } else if (code === 'auth/weak-password') {
        message = 'Password is too weak. Please use at least 6 characters with a combination of letters and numbers.';
      } else if (code === 'auth/operation-not-allowed') {
        message = 'Email/Password sign-up is not yet enabled in your Firebase project. Please enable Email/Password in the Firebase Console (Authentication > Sign-in method), or use Google Sign-in.';
      } else if (err?.message) {
        message = err.message;
      }
      return { success: false, error: message };
    }
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const emailLower = (cred.user.email || '').toLowerCase();
      const isAdminUser = emailLower === 'pandit.alap@gmail.com' || emailLower === ADMIN_EMAIL.toLowerCase();
      const now = new Date().toISOString();

      const userRef = doc(db, 'users', cred.user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        await updateDoc(userRef, {
          lastLoginAt: now,
          ...(isAdminUser ? { role: 'admin' } : {}),
        });
      } else {
        const newUser: User = {
          uid: cred.user.uid,
          email: cred.user.email || '',
          name: cred.user.displayName || cred.user.email?.split('@')[0] || 'Contributor',
          role: isAdminUser ? 'admin' : 'contributor',
          createdAt: now,
          lastLoginAt: now,
        };
        await setDoc(userRef, newUser);
      }

      if (isAdminUser) {
        try {
          await setDoc(doc(db, 'admins', cred.user.uid), {
            uid: cred.user.uid,
            email: cred.user.email,
            createdAt: now,
          }, { merge: true });
        } catch (e) {
          console.warn('Admin record notice:', e);
        }
      }

      return { success: true };
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Sign-in popup was closed before completing.' };
      }
      return { success: false, error: err?.message || 'Failed to sign in with Google.' };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error('Error during sign out:', e);
    }
    setCurrentUser(null);
  };

  const isAdmin = isUserAdmin(currentUser);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isAdmin,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        allUsers,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId,
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
}

export function watchAuthState(onChange: (user: User | null) => void) {
  if (!auth) throw new Error('Firebase 設定不完整，請確認環境變數');
  return onAuthStateChanged(auth, onChange);
}

export async function signInWithGoogle() {
  if (!auth || !googleProvider) throw new Error('Firebase 設定不完整，請確認環境變數');
  return signInWithPopup(auth, googleProvider);
}

export async function signInWithGoogleRedirect() {
  if (!auth || !googleProvider) throw new Error('Firebase 設定不完整，請確認環境變數');
  return signInWithRedirect(auth, googleProvider);
}

export async function signOutFromGoogle() {
  if (!auth) return;
  return signOut(auth);
}

export { app, auth, db };

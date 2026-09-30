import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Google Auth Provider configured for account selection
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore with long-polling auto-detection to prevent 10s backend proxy timeouts
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true
  },
  firebaseConfig.firestoreDatabaseId || undefined
);

// Connection state listener helper
let isFirebaseConnected = false;

export const checkFirebaseStatus = () => isFirebaseConnected;

// Test connection and establish session
export async function initFirebaseSession(): Promise<User | null> {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        isFirebaseConnected = true;
        resolve(user);
      } else {
        // If not logged in, maintain anonymous session for Firestore rules until user logs in
        try {
          const credential = await signInAnonymously(auth);
          isFirebaseConnected = true;
          resolve(credential.user);
        } catch (err) {
          // Non-fatal fallback for offline or restricted mode
          resolve(null);
        }
      }
    });
  });
}

// User Sign Up with Email and Password
export async function registerFirebaseUser(
  email: string,
  pass: string,
  fullName: string
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (fullName.trim()) {
    try {
      await updateProfile(cred.user, { displayName: fullName.trim() });
    } catch (e) {
      // non-fatal
    }
  }
  isFirebaseConnected = true;
  return cred.user;
}

// User Sign In with Email and Password
export async function loginFirebaseUser(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  isFirebaseConnected = true;
  return cred.user;
}

// User Sign In with Google Popup
export async function loginWithGooglePopup(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  isFirebaseConnected = true;
  return result.user;
}

// User Sign Out
export async function logoutFirebaseUser(): Promise<void> {
  await signOut(auth);
  // Re-establish anonymous session for Firestore security rules
  try {
    await signInAnonymously(auth);
  } catch (e) {
    // non-fatal
  }
}

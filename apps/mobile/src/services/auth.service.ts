// ─── Auth Service ─────────────────────────────────────────
//
// Firebase Authentication wrapper.
// Modular SDK, async/await, strongly typed.
//

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile,
  User as FirebaseUser,
  UserCredential,
  Unsubscribe,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

// ─── Email Auth ───────────────────────────────────────────

export async function registerWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<FirebaseUser> {
  const credential: UserCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );

  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }

  return credential.user;
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<FirebaseUser> {
  const credential: UserCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  return credential.user;
}

// ─── Google Auth ──────────────────────────────────────────

export async function loginWithGoogle(
  idToken: string,
): Promise<FirebaseUser> {
  const googleCredential = GoogleAuthProvider.credential(idToken);
  const credential: UserCredential = await signInWithCredential(
    auth,
    googleCredential,
  );
  return credential.user;
}

// ─── Session ──────────────────────────────────────────────

export async function logout(): Promise<void> {
  await signOut(auth);
}

export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

export function onAuthChange(
  callback: (user: FirebaseUser | null) => void,
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

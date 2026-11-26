import {
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

export const ADMIN_EMAIL = (
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "drtim83@icloud.com"
)
  .trim()
  .toLowerCase();

/** Check whether the given Firebase user is the verified admin. */
export function isAuthorizedAdmin(user: User | null): boolean {
  return Boolean(
    user &&
      user.email?.trim().toLowerCase() === ADMIN_EMAIL &&
      user.emailVerified
  );
}

/** Check whether the given Firebase user matches ADMIN_EMAIL but still needs email verification. */
export function isSignedInAdminUnverified(user: User | null): boolean {
  return Boolean(
    user &&
      user.email?.trim().toLowerCase() === ADMIN_EMAIL &&
      !user.emailVerified
  );
}

/** Check if the currently signed-in browser session is an authorized admin. */
export function isUserAdmin(): boolean {
  return isAuthorizedAdmin(auth.currentUser);
}

/** Subscribe to Firebase Auth state changes. */
export function subscribeToAuth(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/** Sign in with Email/Password and verify admin eligibility. */
export async function signInAdmin(
  email: string,
  password: string
): Promise<{ user: User; isAdmin: boolean; needsVerification: boolean }> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  await reload(cred.user);

  if (cred.user.email?.trim().toLowerCase() !== ADMIN_EMAIL) {
    await firebaseSignOut(auth);
    throw new Error("This account is not authorized as an admin.");
  }

  if (!cred.user.emailVerified) {
    return {
      user: cred.user,
      isAdmin: false,
      needsVerification: true,
    };
  }

  await cred.user.getIdToken(true);
  return {
    user: cred.user,
    isAdmin: true,
    needsVerification: false,
  };
}

/** Send an email verification link to the currently signed-in admin account. */
export async function sendAdminVerificationEmail(): Promise<void> {
  if (!auth.currentUser || auth.currentUser.emailVerified) {
    return;
  }
  await sendEmailVerification(auth.currentUser);
}

/** Reload the current user and refresh their ID token after clicking the verification link. */
export async function refreshAdminVerification(): Promise<boolean> {
  if (!auth.currentUser) return false;
  await reload(auth.currentUser);
  await auth.currentUser.getIdToken(true);
  return isAuthorizedAdmin(auth.currentUser);
}

/** Sign out of admin mode. */
export async function lockAdmin(): Promise<void> {
  await firebaseSignOut(auth);
}

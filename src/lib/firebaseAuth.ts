/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
];

const provider = new GoogleAuthProvider();
// Request Google Calendar events scope for scheduling visa renewal appointments and deadlines
CALENDAR_SCOPES.forEach((scope) => provider.addScope(scope));

// In-memory token cache (never stored in localStorage or sessionStorage per Workspace skill guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Initializes auth listener. Clears cached token when user signs out.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token must be refreshed via sign-in popup if session restored without token in memory
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export interface AuthUserProfile {
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
  isDemo?: boolean;
}

export const DEMO_ADMIN_PROFILE: AuthUserProfile = {
  displayName: 'Ustaz Ahmad Dahlan (CIA Director)',
  email: 'admin@unisiraj.edu.my',
  photoURL: null,
  isDemo: true,
};

export const signInWithDemoAdmin = (): { user: AuthUserProfile; accessToken: string } => {
  cachedAccessToken = 'demo_admin_google_calendar_token_unisiraj_cia';
  return {
    user: DEMO_ADMIN_PROFILE,
    accessToken: cachedAccessToken,
  };
};

/**
 * Initiates Google Sign-In with Calendar scopes
 */
export const googleSignIn = async (): Promise<{ user: User | AuthUserProfile; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google OAuth access token.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('UniSIRAJ Auth Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Returns current access token from memory
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Signs out current administrator and clears in-memory credentials
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch {
    // Clean signout even if using demo mode
  }
  cachedAccessToken = null;
};

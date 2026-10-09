import {
  UserProfile,
  SyllabusTopic,
  MainsAnswerEvaluation,
  TimetableSlot,
  StudySessionLog,
  UserFullProgressData,
} from "../types";
import { publicAdminSyllabus } from "../data/upscData";
import { DEFAULT_TIMETABLE_SLOTS } from "../data/timetableData";
import {
  auth,
  firebaseConfigured,
  googleProvider,
  signInWithPopup,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  FirebaseUser,
} from "../lib/firebase";
import { getDesktopBridge } from "../lib/desktopBridge";
import {
  saveFirebaseUserProfile,
  getFirebaseUserProfile,
  saveFirebaseUserTopics,
  getFirebaseUserTopics,
  getFirebaseMainsSubmissions,
  recordFirebaseMainsSubmission,
  saveFirebaseTimetableSlots,
  getFirebaseTimetableSlots,
  getFirebaseStudySessions,
} from "./firestoreService";

const CURRENT_USER_KEY = "bolt_current_user";
const USER_PROGRESS_KEY_PREFIX = "bolt_user_progress_";
const AUTH_TOKEN_KEY = "bolt_auth_token";

/**
 * Retrieve authorization header using Firebase ID token or secure server session token
 */
export async function getAuthHeader(): Promise<Record<string, string>> {
  if (auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken();
      if (idToken) {
        return { Authorization: `Bearer ${idToken}` };
      }
    } catch {}
  }
  const sessionToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (sessionToken) {
    return { Authorization: `Bearer ${sessionToken}` };
  }
  return {};
}

/**
 * Returns pristine syllabus topics with zero mock progress for a clean user account
 */
export function getCleanSyllabus(): SyllabusTopic[] {
  return publicAdminSyllabus.map((topic) => ({
    ...topic,
    completionPercentage: 0,
    knowledgeScore: 0,
    mcqAccuracy: 0,
    mainsAverageScore: 0,
    attemptsCount: 0,
    status: "not_started" as const,
    lastStudiedDate: "",
    lastRevisedDate: "",
    subtopics: topic.subtopics.map((sub) => ({
      ...sub,
      status: "not_started" as const,
      confidence: 0,
    })),
  }));
}

/**
 * Returns pristine timetable slots with zero completed status or spent time
 */
export function getCleanTimetableSlots(): TimetableSlot[] {
  return DEFAULT_TIMETABLE_SLOTS.map((slot) => ({
    ...slot,
    isCompleted: false,
    timeSpentMinutes: 0,
  }));
}

/**
 * Retrieve the active user from localStorage if previously signed in
 */
export function getStoredCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      return JSON.parse(raw) as UserProfile;
    }
  } catch (e) {
    console.error("Error reading stored current user:", e);
  }
  return null;
}

/**
 * Save user's full progress to Firebase Firestore with strict user isolation,
 * plus local storage backup and Express server sync.
 */
export async function saveUserProgress(progress: UserFullProgressData): Promise<boolean> {
  const userId = progress.user.id || auth.currentUser?.uid || "guest";

  // 1. Immediate local cache write
  try {
    localStorage.setItem(`${USER_PROGRESS_KEY_PREFIX}${userId}`, JSON.stringify(progress));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(progress.user));
  } catch (e) {
    console.warn("Could not save to localStorage:", e);
  }

  // If user is guest or default offline template, do not attempt cloud or server persistence
  if (!userId || userId.startsWith("guest") || userId === "aspirant-default" || userId === "aspirant@bolt.ai") {
    return true;
  }

  // 2. Persist to Firebase Firestore if user is authenticated with Firebase as this user
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      await Promise.all([
        saveFirebaseUserProfile(userId, progress.user),
        saveFirebaseUserTopics(userId, progress.topics),
        saveFirebaseTimetableSlots(userId, progress.timetableSlots),
      ]);
    } catch (e) {
      console.warn("Firestore sync error (falling back to server endpoint):", e);
    }
  }

  // 3. Persist to server API as secondary backup
  if (userId && !userId.startsWith("guest") && userId !== "aspirant-default" && userId !== "aspirant@bolt.ai") {
    try {
      const authHeaders = await getAuthHeader();
      await fetch("/api/user/save-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          userId,
          user: progress.user,
          topics: progress.topics,
          evaluations: progress.evaluations,
          timetableSlots: progress.timetableSlots,
          studySessions: progress.studySessions,
          prelimsAttempts: progress.prelimsAttempts,
          bookmarks: progress.bookmarks,
        }),
      });
    } catch (e) {
      console.warn("Server endpoint save failed, data is safe in Firestore/local:", e);
    }
  }

  return true;
}

/**
 * Load user's full progress from Firebase Firestore first,
 * falling back to the Express server and local storage.
 */
export async function loadUserProgress(userId: string): Promise<UserFullProgressData | null> {
  // If user is guest or default offline template, read only from local storage
  if (!userId || userId.startsWith("guest") || userId === "aspirant-default" || userId === "aspirant@bolt.ai") {
    try {
      const raw = localStorage.getItem(`${USER_PROGRESS_KEY_PREFIX}${userId}`);
      if (raw) {
        return JSON.parse(raw) as UserFullProgressData;
      }
    } catch {}
    return null;
  }

  // 1. Try Firebase Firestore only if user is authenticated and matches userId
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      const [fireProfile, fireTopics, fireMains, fireSlots, fireSessions] = await Promise.all([
        getFirebaseUserProfile(userId),
        getFirebaseUserTopics(userId),
        getFirebaseMainsSubmissions(userId),
        getFirebaseTimetableSlots(userId),
        getFirebaseStudySessions(userId),
      ]);

      if (fireProfile || (fireTopics && fireTopics.length > 0)) {
        const fullData: UserFullProgressData = {
          user: fireProfile || {
            id: userId,
            name: auth.currentUser?.displayName || "UPSC Aspirant",
            email: auth.currentUser?.email || "",
            target: "UPSC CSE 2026",
            optionalSubject: "Public Administration",
            studyStreakDays: 1,
            totalStudyHours: 0,
            questionsAttempted: 0,
            mainsEvaluatedCount: fireMains.length,
            overallAccuracy: 0,
          },
          topics: fireTopics.length > 0 ? fireTopics : getCleanSyllabus(),
          evaluations: fireMains,
          timetableSlots: fireSlots && fireSlots.length > 0 ? fireSlots : getCleanTimetableSlots(),
          studySessions: fireSessions,
          prelimsAttempts: {},
          bookmarks: [],
          lastSavedAt: new Date().toISOString(),
        };

        try {
          localStorage.setItem(`${USER_PROGRESS_KEY_PREFIX}${userId}`, JSON.stringify(fullData));
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(fullData.user));
        } catch {}

        return fullData;
      }
      } catch (e) {
        console.warn("Could not read from Firestore, trying Express API:", e);
      }
    }

    // 2. Try Express server API
    try {
      const authHeaders = await getAuthHeader();
      const res = await fetch(`/api/user/progress?userId=${encodeURIComponent(userId)}`, {
        headers: { ...authHeaders },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.progress) {
          const p = json.progress;
          const fullData: UserFullProgressData = {
            user: p.user,
            topics: p.topics && p.topics.length > 0 ? p.topics : getCleanSyllabus(),
            evaluations: p.evaluations || [],
            timetableSlots: p.timetableSlots && p.timetableSlots.length > 0 ? p.timetableSlots : getCleanTimetableSlots(),
            studySessions: p.studySessions || [],
            prelimsAttempts: p.prelimsAttempts || {},
            bookmarks: p.bookmarks || [],
            lastSavedAt: p.updatedAt,
          };
          return fullData;
        }
      }
    } catch (e) {
      console.warn("Server API fallback failed:", e);
    }

  // 3. Fallback to local storage
  try {
    const raw = localStorage.getItem(`${USER_PROGRESS_KEY_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw) as UserFullProgressData;
    }
  } catch (e) {
    console.error("Error reading local progress:", e);
  }

  return null;
}

/**
 * Register a new user account with Firebase Authentication
 */
export async function registerAccount(params: {
  name: string;
  email: string;
  password?: string;
  target?: string;
  optionalSubject?: string;
}): Promise<{ success: boolean; message?: string; user?: UserProfile; progress?: UserFullProgressData }> {
  const cleanTopics = getCleanSyllabus();
  const cleanSlots = getCleanTimetableSlots();

  // Pure Firebase Authentication
  if (params.password) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, params.email.trim(), params.password);
      const userId = cred.user.uid;

      const newUser: UserProfile = {
        id: userId,
        name: params.name.trim(),
        email: params.email.trim(),
        target: params.target || "UPSC CSE 2026",
        optionalSubject: params.optionalSubject || "Public Administration",
        studyStreakDays: 1,
        totalStudyHours: 0,
        questionsAttempted: 0,
        mainsEvaluatedCount: 0,
        overallAccuracy: 0,
        themeMode: "dark",
        dailyStudyGoal: 6,
        dailyStudyHoursGoal: 6,
      };

      const progress: UserFullProgressData = {
        user: newUser,
        topics: cleanTopics,
        evaluations: [],
        timetableSlots: cleanSlots,
        studySessions: [],
        prelimsAttempts: {},
        bookmarks: [],
        lastSavedAt: new Date().toISOString(),
      };

      // Save to Firestore
      await saveFirebaseUserProfile(userId, newUser);
      await saveFirebaseUserTopics(userId, cleanTopics);
      await saveFirebaseTimetableSlots(userId, cleanSlots);

      // Save to local cache
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
      localStorage.setItem(`${USER_PROGRESS_KEY_PREFIX}${userId}`, JSON.stringify(progress));

      return { success: true, user: newUser, progress };
    } catch (err: any) {
      console.warn("Firebase createUser failed:", err);
      if (err.code === "auth/email-already-in-use") {
        return { success: false, message: "An account with this email already exists. Please sign in instead." };
      }
      if (err.code === "auth/weak-password") {
        return { success: false, message: "Password is too weak. Please use at least 6 characters with mixed characters." };
      }
      if (err.code === "auth/invalid-email") {
        return { success: false, message: "Please provide a valid email address." };
      }
      return { success: false, message: err.message || "Failed to create account. Please check your connection." };
    }
  }

  return { success: false, message: "Password is required for registration." };
}

/**
 * Sign in an existing user strictly with Firebase Auth
 */
export async function loginAccount(params: {
  email: string;
  password?: string;
}): Promise<{ success: boolean; message?: string; user?: UserProfile; progress?: UserFullProgressData }> {
  if (!params.password) {
    return { success: false, message: "Password is required to sign in." };
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, params.email.trim(), params.password);
    const userId = cred.user.uid;
    const progress = await loadUserProgress(userId);

    if (progress) {
      return { success: true, user: progress.user, progress };
    }

    // Default user if no progress doc yet
    const defaultUser: UserProfile = {
      id: userId,
      name: cred.user.displayName || params.email.split("@")[0],
      email: params.email,
      target: "UPSC CSE 2026",
      optionalSubject: "Public Administration",
      studyStreakDays: 1,
      totalStudyHours: 0,
      questionsAttempted: 0,
      mainsEvaluatedCount: 0,
      overallAccuracy: 0,
    };

    return {
      success: true,
      user: defaultUser,
      progress: {
        user: defaultUser,
        topics: getCleanSyllabus(),
        evaluations: [],
        timetableSlots: getCleanTimetableSlots(),
        studySessions: [],
        prelimsAttempts: {},
        bookmarks: [],
      },
    };
  } catch (err: any) {
    console.warn("Firebase signInWithEmailAndPassword failed:", err);
    if (
      err.code === "auth/invalid-credential" ||
      err.code === "auth/wrong-password" ||
      err.code === "auth/user-not-found"
    ) {
      return { success: false, message: "Invalid email or password. Please verify your credentials." };
    }
    if (err.code === "auth/too-many-requests") {
      return { success: false, message: "Access temporarily blocked due to multiple failed attempts. Please try again later or reset password." };
    }
    return { success: false, message: err.message || "Authentication failed. Please check your network connection." };
  }
}

/**
 * Completes Google sign-in inside BOLT Desktop by delegating to the system
 * browser (Google blocks OAuth popups inside embedded/Electron webviews).
 * See electron/main.ts + public/desktop-auth.html for the other half of
 * this flow.
 */
async function signInWithGoogleViaDesktopBridge(
  desktop: NonNullable<ReturnType<typeof getDesktopBridge>>
): Promise<FirebaseUser> {
  const customToken = await new Promise<string>((resolve, reject) => {
    const unsubscribe = desktop.onAuthToken((token) => {
      unsubscribe();
      resolve(token);
    });
    desktop.startGoogleAuth().catch((err) => {
      unsubscribe();
      reject(err);
    });
    setTimeout(() => {
      unsubscribe();
      reject(new Error("Sign-in timed out. Please try again."));
    }, 5 * 60 * 1000);
  });

  const cred = await signInWithCustomToken(auth, customToken);
  return cred.user;
}

/**
 * Sign in using Google OAuth with Firebase
 */
export async function signInWithGoogle(): Promise<{
  success: boolean;
  message?: string;
  user?: UserProfile;
  progress?: UserFullProgressData;
}> {
  try {
    const desktop = getDesktopBridge();
    const fbUser = desktop ? await signInWithGoogleViaDesktopBridge(desktop) : (await signInWithPopup(auth, googleProvider)).user;
    const userId = fbUser.uid;

    let progress = await loadUserProgress(userId);

    if (!progress) {
      const newUser: UserProfile = {
        id: userId,
        name: fbUser.displayName || "UPSC Aspirant",
        email: fbUser.email || "",
        avatarUrl: fbUser.photoURL || undefined,
        target: "UPSC CSE 2026",
        optionalSubject: "Public Administration",
        studyStreakDays: 1,
        totalStudyHours: 0,
        questionsAttempted: 0,
        mainsEvaluatedCount: 0,
        overallAccuracy: 0,
        themeMode: "dark",
      };

      progress = {
        user: newUser,
        topics: getCleanSyllabus(),
        evaluations: [],
        timetableSlots: getCleanTimetableSlots(),
        studySessions: [],
        prelimsAttempts: {},
        bookmarks: [],
        lastSavedAt: new Date().toISOString(),
      };

      await saveFirebaseUserProfile(userId, newUser);
      await saveFirebaseUserTopics(userId, progress.topics);
      await saveFirebaseTimetableSlots(userId, progress.timetableSlots);
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(progress.user));
    localStorage.setItem(`${USER_PROGRESS_KEY_PREFIX}${userId}`, JSON.stringify(progress));

    return { success: true, user: progress.user, progress };
  } catch (err: any) {
    console.warn("Google sign-in failed:", err);
    return { success: false, message: err.message || "Google sign-in was cancelled or failed." };
  }
}

/**
 * Sign out current user
 */
export async function logoutAccount(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn("Firebase sign-out error:", e);
  }
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
}

/**
 * Listen for persistent Firebase Auth state changes
 */
export function subscribeToAuthState(
  onUserChanged: (user: FirebaseUser | null) => void
): () => void {
  if (!firebaseConfigured) {
    onUserChanged(null);
    return () => {};
  }
  return onAuthStateChanged(auth, onUserChanged);
}

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  getDocFromServer,
  runTransaction,
  writeBatch,
  query,
  orderBy,
  limit as fsLimit,
  Firestore,
} from 'firebase/firestore';
import { getAnalytics, isSupported, logEvent as fbLogEvent, Analytics } from 'firebase/analytics';
import { SavedProject, UserProfile, AccountType } from '../types';

// 1. قراءة إعدادات Firebase من متغيرات البيئة (.env)
export const activeFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

// فحص صلاحية المفتاح قبل التهيئة لتجنب أخطاء الشبكة
const isValidApiKey = (key: string): boolean => {
  const trimmed = key.trim();
  return trimmed.length > 10 && !trimmed.includes('YOUR_') && !trimmed.includes('ضع_هنا');
};

// 2. تهيئة التطبيق والقواعد
const app: FirebaseApp = getApps().length > 0 
  ? getApp() 
  : initializeApp(activeFirebaseConfig);

export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const db: Firestore = getFirestore(app);

// ======================= ANALYTICS (إحصائيات الاستخدام) =======================
let analyticsPromise: Promise<Analytics | null> | null = null;

function getAnalyticsInstance(): Promise<Analytics | null> {
  if (!analyticsPromise) {
    analyticsPromise = (async () => {
      try {
        if (!activeFirebaseConfig.measurementId) return null;
        if (!(await isSupported())) return null;
        return getAnalytics(app);
      } catch (e) {
        console.warn('Analytics unavailable:', e);
        return null;
      }
    })();
  }
  return analyticsPromise;
}

/**
 * تسجيل حدث في Google Analytics (لا يؤثر على عمل الموقع إن فشل).
 */
export async function trackEvent(name: string, params?: Record<string, string | number | boolean>): Promise<void> {
  try {
    const a = await getAnalyticsInstance();
    if (a) fbLogEvent(a, name, params);
  } catch {
    /* ignore */
  }
}


// اختبار الاتصال بـ Firestore
async function testConnection() {
  if (!isValidApiKey(activeFirebaseConfig.apiKey)) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, using offline persistence mode.');
    }
  }
}
testConnection();

// ======================= ERROR HANDLING =======================
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function mapUserDoc(
  uid: string,
  data: any,
  fbUser: { displayName: string | null; email: string | null }
): UserProfile {
  return {
    id: uid,
    name: data.displayName || data.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'مستخدم',
    email: fbUser.email || data.email || '',
    phone: data.phone || undefined,
    role: data.role || 'مهندس استشاري',
    accountType: data.accountType || 'individual',
    companyName: data.companyName || undefined,
    taxOrRegNumber: data.taxOrRegNumber || undefined,
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

// ======================= AUTHENTICATION API =======================

/**
 * Subscribe to Auth State Changes
 */
export function subscribeToAuthState(callback: (user: UserProfile | null) => void): () => void {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      callback(null);
      return;
    }

    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        callback({
          id: fbUser.uid,
          name: data.displayName || fbUser.displayName || 'مستخدم',
          email: fbUser.email || data.email || '',
          phone: data.phone || fbUser.phoneNumber || undefined,
          role: data.role || 'مهندس استشاري',
          accountType: data.accountType || 'individual',
          companyName: data.companyName,
          taxOrRegNumber: data.taxOrRegNumber,
          createdAt: data.createdAt || new Date().toISOString(),
        });
      } else {
        const profile: UserProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'مستخدم مسجل',
          email: fbUser.email || '',
          phone: fbUser.phoneNumber || undefined,
          role: 'مهندس / استشاري',
          accountType: 'individual',
          createdAt: new Date().toISOString(),
        };

        setDoc(userRef, {
          uid: profile.id,
          email: profile.email,
          displayName: profile.name,
          role: profile.role,
          accountType: 'individual',
          createdAt: profile.createdAt,
          updatedAt: profile.createdAt,
        }).catch((e) => console.warn('Could not write initial user doc:', e));

        callback(profile);
      }
    } catch (e) {
      console.warn('Error reading user profile on auth change:', e);
      callback({
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'مستخدم',
        email: fbUser.email || '',
        role: 'مستخدم مسجل',
        accountType: 'individual',
        createdAt: new Date().toISOString(),
      });
    }
  });
}

/**
 * Sign in with Google popup
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;

  const userRef = doc(db, 'users', fbUser.uid);
  let profile: UserProfile;

  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      profile = mapUserDoc(fbUser.uid, userSnap.data(), fbUser);
    } else {
      profile = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'مستخدم جوجل',
        email: fbUser.email || '',
        phone: fbUser.phoneNumber || undefined,
        role: 'مهندس / استشاري',
        createdAt: new Date().toISOString(),
      };
      await setDoc(userRef, {
        uid: profile.id,
        email: profile.email,
        displayName: profile.name,
        photoURL: fbUser.photoURL || '',
        role: profile.role,
        createdAt: profile.createdAt,
        updatedAt: profile.createdAt,
      });
    }
  } catch (err) {
    profile = {
      id: fbUser.uid,
      name: fbUser.displayName || fbUser.email?.split('@')[0] || 'مستخدم جوجل',
      email: fbUser.email || '',
      role: 'مهندس / استشاري',
      createdAt: new Date().toISOString(),
    };
  }

  return profile;
}

/**
 * Login with Email and Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const fbUser = result.user;

  const userRef = doc(db, 'users', fbUser.uid);
  let profile: UserProfile;

  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      profile = mapUserDoc(fbUser.uid, userSnap.data(), fbUser);
    } else {
      profile = {
        id: fbUser.uid,
        name: fbUser.displayName || email.split('@')[0],
        email: fbUser.email || email,
        role: 'مستخدم مسجل',
        createdAt: new Date().toISOString(),
      };
      await setDoc(userRef, {
        uid: profile.id,
        email: profile.email,
        displayName: profile.name,
        role: profile.role,
        createdAt: profile.createdAt,
        updatedAt: profile.createdAt,
      });
    }
  } catch (err) {
    profile = {
      id: fbUser.uid,
      name: fbUser.displayName || email.split('@')[0],
      email: fbUser.email || email,
      role: 'مستخدم مسجل',
      createdAt: new Date().toISOString(),
    };
  }

  return profile;
}

/**
 * Register with Email, Password, Name and Role
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  name: string,
  role: string,
  phone?: string,
  accountType: AccountType = 'individual',
  companyName?: string,
  taxOrRegNumber?: string
): Promise<UserProfile> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const fbUser = result.user;

  try {
    await updateProfile(fbUser, { displayName: name.trim() });
  } catch (err) {
    console.warn('Could not update Auth displayName:', err);
  }

  const profile: UserProfile = {
    id: fbUser.uid,
    name: name.trim(),
    email: email.trim(),
    phone: phone?.trim() || undefined,
    role: role || (accountType === 'company' ? 'شركة / مكتب هندسي' : 'مهندس استشاري'),
    accountType,
    companyName: companyName?.trim() || undefined,
    taxOrRegNumber: taxOrRegNumber?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  try {
    const userRef = doc(db, 'users', fbUser.uid);
    await setDoc(userRef, {
      uid: profile.id,
      email: profile.email,
      displayName: profile.name,
      phone: profile.phone || '',
      role: profile.role,
      accountType: profile.accountType,
      companyName: profile.companyName || '',
      taxOrRegNumber: profile.taxOrRegNumber || '',
      createdAt: profile.createdAt,
      updatedAt: profile.createdAt,
    });
  } catch (err) {
    console.warn('Could not write user profile to firestore:', err);
  }

  trackEvent('sign_up', { method: 'email', account_type: accountType });
  return profile;
}

/**
 * Send Password Reset Email
 */
export async function resetPasswordEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Log out
 */
export async function logOutFirebase(): Promise<void> {
  await signOut(auth);
}

// ======================= FIRESTORE PROJECTS API =======================

/**
 * Fetch all projects for a specific user from Firestore
 */
export async function fetchFirestoreProjects(userId: string): Promise<SavedProject[]> {
  try {
    const projectsCol = collection(db, 'users', userId, 'projects');
    const snapshot = await getDocs(projectsCol);
    const projects: SavedProject[] = [];

    snapshot.forEach((docSnap) => {
      projects.push(docSnap.data() as SavedProject);
    });

    projects.sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
    return projects;
  } catch (err) {
    console.warn('Error fetching projects from Firestore:', err);
    return [];
  }
}

/**
 * Save or update project in Firestore under /users/{userId}/projects/{projectId}
 */
export async function saveProjectToFirestore(project: SavedProject, userId: string): Promise<void> {
  try {
    const projRef = doc(db, 'users', userId, 'projects', project.id);
    await setDoc(projRef, {
      ...project,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Error saving project to Firestore:', err);
    throw err;
  }
}

/**
 * Delete project from Firestore
 */
export async function deleteProjectFromFirestore(projectId: string, userId: string): Promise<void> {
  try {
    const projRef = doc(db, 'users', userId, 'projects', projectId);
    await deleteDoc(projRef);
  } catch (err) {
    console.warn('Error deleting project from Firestore:', err);
    throw err;
  }
}


// ======================= REPORTS QUOTA (رصيد التقارير) =======================

export const FREE_REPORTS = 5;

export interface Entitlement {
  used: number;
  limit: number;
}

/**
 * قراءة رصيد المستخدم، وإنشاؤه (5 تقارير مجانية) عند أول مرة.
 */
export async function getEntitlement(uid: string): Promise<Entitlement> {
  const ref = doc(db, 'entitlements', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const d = snap.data();
    return { used: Number(d.used) || 0, limit: Number(d.limit) || FREE_REPORTS };
  }
  await setDoc(ref, { used: 0, limit: FREE_REPORTS, createdAt: new Date().toISOString() });
  return { used: 0, limit: FREE_REPORTS };
}

/**
 * خصم تقرير واحد من الرصيد (بعد نجاح التنزيل).
 */
export async function consumeReport(uid: string): Promise<Entitlement> {
  const ref = doc(db, 'entitlements', uid);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const d = snap.data() || {};
    const used = Number(d.used) || 0;
    const limit = Number(d.limit) || FREE_REPORTS;
    if (used >= limit) throw new Error('QUOTA_EXCEEDED');
    tx.update(ref, { used: used + 1 });
    return { used: used + 1, limit };
  });
}

/**
 * تفعيل كود: يُضاف رصيد الكود (مثلًا 100 تقرير) إلى حد المستخدم، ويُستهلك الكود مرة واحدة.
 */
export async function redeemCode(uid: string, rawCode: string): Promise<Entitlement> {
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z0-9-]{6,40}$/.test(code)) throw new Error('INVALID');

  const ent = await getEntitlement(uid);
  const codeRef = doc(db, 'codes', code);

  let codeData: any;
  try {
    const codeSnap = await getDoc(codeRef);
    if (!codeSnap.exists()) throw new Error('INVALID');
    codeData = codeSnap.data();
  } catch (e) {
    if (e instanceof Error && e.message === 'INVALID') throw e;
    throw new Error('INVALID');
  }

  if (codeData.used) throw new Error('USED');
  const credits = Number(codeData.credits) || 0;
  if (credits <= 0) throw new Error('INVALID');

  const batch = writeBatch(db);
  batch.update(codeRef, { used: true, usedBy: uid, usedAt: new Date().toISOString() });
  batch.update(doc(db, 'entitlements', uid), { limit: ent.limit + credits, lastCode: code });
  await batch.commit();

  trackEvent('code_redeemed', { credits });
  return { used: ent.used, limit: ent.limit + credits };
}


// ======================= ADMIN: ACTIVATION CODES (لك أنت فقط) =======================

export interface ActivationCode {
  code: string;
  credits: number;
  used: boolean;
  usedBy?: string;
  usedAt?: string;
  createdAt?: string;
}

/**
 * إنشاء كود تفعيل عشوائي (يسمح به فقط حساب الإدارة حسب قواعد Firestore).
 */
export async function createActivationCode(credits: number): Promise<string> {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const code =
    'MOEEN-' +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  await setDoc(doc(db, 'codes', code), {
    credits: Math.floor(credits),
    used: false,
    createdAt: new Date().toISOString(),
  });
  return code;
}

/**
 * آخر الأكواد المنشأة (لحساب الإدارة فقط).
 */
export async function listRecentCodes(): Promise<ActivationCode[]> {
  const q = query(collection(db, 'codes'), orderBy('createdAt', 'desc'), fsLimit(30));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ code: d.id, ...(d.data() as Omit<ActivationCode, 'code'>) }));
}

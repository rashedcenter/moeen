import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  initializeAuth,
  inMemoryPersistence
} from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, getDocs, query, where, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 1. النسخة الأساسية (اللي المدير بيسجل دخوله منها)
const companyApp = getApps().find(app => app.name === 'company') 
  ? getApp('company') 
  : initializeApp(firebaseConfig, 'company');

export const companyAuth = getAuth(companyApp);
export const companyDb = getFirestore(companyApp);

export const formatCompanyEmail = (username: string, companyId: string) => {
  return `${username.trim().toLowerCase()}@${companyId.trim().toLowerCase()}.moeen.app`;
};

export const loginCompanyUser = async (username: string, companyId: string, password: string) => {
  const email = formatCompanyEmail(username, companyId);
  const result = await signInWithEmailAndPassword(companyAuth, email, password);
  return result.user;
};

export const logoutCompanyUser = async () => {
  await signOut(companyAuth);
};

// 2. دالة إنشاء حساب مهندس باستخدام نسخة (Secondary) معزولة
export const createEngineerAccount = async (
  companyId: string, 
  username: string, 
  password: string, 
  name: string
) => {
  const email = formatCompanyEmail(username, companyId);
  const secondaryAppName = `secondary-${Date.now()}`;
  let secondaryApp: FirebaseApp | null = null;

  try {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = initializeAuth(secondaryApp, {
      persistence: inMemoryPersistence
    });

    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const newUid = userCredential.user.uid;

    await signOut(secondaryAuth);

    const memberRef = doc(collection(companyDb, 'companies', companyId, 'members'));
    await setDoc(memberRef, {
      username,
      name,
      role: 'engineer',
      isActive: true,
      userId: newUid,
      createdAt: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error("Error creating engineer:", error);
    throw error;
  } finally {
    if (secondaryApp) {
      await deleteApp(secondaryApp);
    }
  }
};

// ================= دوال جلب بيانات العضو =================
export const getCompanyMember = async (companyId: string, uid: string): Promise<any> => {
  const membersRef = collection(companyDb, 'companies', companyId, 'members');
  const q = query(membersRef, where('userId', '==', uid));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }
  return null;
};

// ================= دوال المشاريع =================
export const getCompanyEngineers = async (companyId: string) => {
  const membersRef = collection(companyDb, 'companies', companyId, 'members');
  const q = query(membersRef, where('role', '==', 'engineer')); 
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createCompanyProject = async (companyId: string, projectData: any) => {
  const projectsRef = collection(companyDb, 'companies', companyId, 'projects');
  const docRef = await addDoc(projectsRef, {
    ...projectData,
    createdAt: serverTimestamp(),
    status: 'active'
  });
  return docRef.id;
};

export const subscribeToEngineerProjects = (companyId: string, engineerId: string, callback: (projects: any[]) => void) => {
  const projectsRef = collection(companyDb, 'companies', companyId, 'projects');
  const q = query(projectsRef, where('assignedEngineers', 'array-contains', engineerId));
  
  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(projects);
  });
};
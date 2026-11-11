import { UserProfile, SavedProject, CustomProjectField, CurrencyCode } from '../types';
import {
  saveProjectToFirestore,
  deleteProjectFromFirestore,
  fetchFirestoreProjects,
} from '../lib/firebase';

export const CRITICAL_ENGINEERING_DISCLAIMER =
  'ملاحظة هامة جداً جداً: جميع الأرقام والكميات استرشادية وقابلة للزيادة والنقص، وإن الكميات المعتمدة على الرسومات والمخططات هي الكميات الدقيقة والمعمول بها، لذا يرجى الرجوع للمهندس المختص في حالة التأكد من أي رقم في التقارير.';

const USER_STORAGE_KEY = 'moeen_user_profile';
const PROJECTS_STORAGE_KEY = 'moeen_saved_projects';

// Initial sample project to showcase features immediately
export const SAMPLE_PROJECTS: SavedProject[] = []; /*no-sample*/

export function loadCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load user from localStorage:', e);
    return null;
  }
}

export function saveCurrentUser(user: UserProfile | null): void {
  try {
    if (!user) {
      localStorage.removeItem(USER_STORAGE_KEY);
    } else {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.error('Failed to save user to localStorage:', e);
  }
}

export function loadSavedProjects(userId?: string): SavedProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    let projects: SavedProject[] = [];
    if (raw) {
      projects = (JSON.parse(raw) as SavedProject[]).filter((p) => p.id !== 'proj_sample_01');
    } else {
      projects = [...SAMPLE_PROJECTS];
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    }

    if (userId) {
      return projects.filter((p) => p.userId === userId);
    }
    return projects;
  } catch (e) {
    console.error('Failed to load projects from localStorage:', e);
    return SAMPLE_PROJECTS;
  }
}

/**
 * Load projects from Firestore and merge with local projects
 */
export async function syncProjectsFromFirestore(userId: string): Promise<SavedProject[]> {
  try {
    const remoteProjects = await fetchFirestoreProjects(userId);
    const localProjects = loadSavedProjects();

    // Map by ID
    const mergedMap = new Map<string, SavedProject>();
    localProjects.forEach((p) => mergedMap.set(p.id, p));
    remoteProjects.forEach((p) => mergedMap.set(p.id, p));

    const merged = Array.from(mergedMap.values());
    merged.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(merged));
    return merged.filter((p) => p.userId === userId);
  } catch (err) {
    console.error('Failed to sync projects from Firestore:', err);
    return loadSavedProjects(userId);
  }
}

export function saveProject(
  projectData: Omit<SavedProject, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): SavedProject {
  const currentProjects = loadSavedProjects();
  const now = new Date().toISOString();

  let targetProject: SavedProject;

  if (projectData.id) {
    // Update existing
    const index = currentProjects.findIndex((p) => p.id === projectData.id);
    if (index >= 0) {
      const updated: SavedProject = {
        ...currentProjects[index],
        ...projectData,
        id: projectData.id,
        updatedAt: now,
      };
      currentProjects[index] = updated;
      try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(currentProjects));
      } catch (e) {
        console.error('Error saving updated project:', e);
      }
      targetProject = updated;
    } else {
      targetProject = {
        ...projectData,
        id: projectData.id,
        createdAt: now,
        updatedAt: now,
      };
      currentProjects.unshift(targetProject);
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(currentProjects));
    }
  } else {
    // Create new project
    const newProject: SavedProject = {
      ...projectData,
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };

    currentProjects.unshift(newProject);
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(currentProjects));
    } catch (e) {
      console.error('Error creating new project:', e);
    }
    targetProject = newProject;
  }

  // If user is authenticated in Firebase, sync to Firestore
  if (targetProject.userId) {
    saveProjectToFirestore(targetProject, targetProject.userId).catch((err) => {
      console.warn('Could not sync project to Firestore (offline or rule error):', err);
    });
  }

  return targetProject;
}

export async function deleteProject(id: string, userId?: string): Promise<void> { /*delete-fixed*/
  const currentProjects = loadSavedProjects();
  const filtered = currentProjects.filter((p) => p.id !== id);
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error deleting project from localStorage:', e);
  }

  if (userId) {
    try {
      await deleteProjectFromFirestore(id, userId);
    } catch (err) {
      console.warn('Could not delete project from Firestore:', err);
    }
  }
}

export function duplicateProject(id: string): SavedProject | null {
  const currentProjects = loadSavedProjects();
  const source = currentProjects.find((p) => p.id === id);
  if (!source) return null;

  const now = new Date().toISOString();
  const duplicated: SavedProject = {
    ...source,
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    projectName: `${source.projectName} (نسخة)`,
    reportName: `${source.reportName} (نسخة)`,
    customFields: source.customFields.map((cf) => ({
      ...cf,
      id: `cf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    })),
    createdAt: now,
    updatedAt: now,
  };

  const updatedProjects = [duplicated, ...currentProjects];
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));
  } catch (e) {
    console.error('Error duplicating project:', e);
  }

  if (duplicated.userId) {
    saveProjectToFirestore(duplicated, duplicated.userId).catch((err) => {
      console.warn('Could not sync duplicated project to Firestore:', err);
    });
  }

  return duplicated;
}

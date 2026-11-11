import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  limit as fsLimit,
  getDocs,
  getAggregateFromServer,
  average,
  count,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Review {
  uid: string;
  name: string;
  rating: number;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export const MAX_REVIEW_CHARS = 600;

/** آخر التقييمات (الأحدث أولًا) */
export async function fetchReviews(n: number): Promise<Review[]> {
  const q = query(collection(db, 'reviews'), orderBy('updatedAt', 'desc'), fsLimit(n));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Review);
}

/** المتوسط والعدد من الخادم مباشرة (بدون قراءة كل التقييمات) */
export async function fetchReviewStats(): Promise<{ avg: number; count: number }> {
  const agg = await getAggregateFromServer(collection(db, 'reviews'), {
    avg: average('rating'),
    n: count(),
  });
  const d = agg.data();
  return { avg: Number(d.avg) || 0, count: Number(d.n) || 0 };
}

export async function fetchMyReview(uid: string): Promise<Review | null> {
  const snap = await getDoc(doc(db, 'reviews', uid));
  return snap.exists() ? (snap.data() as Review) : null;
}

export async function saveReview(
  uid: string,
  name: string,
  rating: number,
  text: string,
  existing?: Review | null
): Promise<void> {
  const now = new Date().toISOString();
  await setDoc(doc(db, 'reviews', uid), {
    uid,
    name: name.trim().slice(0, 60) || 'مستخدم',
    rating: Math.min(5, Math.max(1, Math.round(rating))),
    text: text.trim().slice(0, MAX_REVIEW_CHARS),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  });
}

export async function deleteReview(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'reviews', uid));
}

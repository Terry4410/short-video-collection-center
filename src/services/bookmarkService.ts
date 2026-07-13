import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Bookmark, BookmarkInput } from '../types/bookmark';

const bookmarksCollection = () => {
  if (!db) throw new Error('Firebase 尚未設定');
  return collection(db, 'bookmarks');
};

const toBookmark = (id: string, data: Record<string, unknown>): Bookmark => ({
  id,
  url: String(data.url || ''),
  platform: String(data.platform || 'Other'),
  title: String(data.title || ''),
  description: String(data.description || ''),
  note: String(data.note || ''),
  mainCategory: String(data.mainCategory || '其他'),
  subCategory: String(data.subCategory || ''),
  tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
  status: (data.status || '待整理') as Bookmark['status'],
  priority: (data.priority || '中') as Bookmark['priority'],
  thumbnailUrl: String(data.thumbnailUrl || ''),
  hasLocation: Boolean(data.hasLocation),
  placeName: String(data.placeName || ''),
  address: String(data.address || ''),
  lat: typeof data.lat === 'number' ? data.lat : undefined,
  lng: typeof data.lng === 'number' ? data.lng : undefined,
  googlePlaceId: String(data.googlePlaceId || ''),
  mapUrl: String(data.mapUrl || ''),
  sourceText: String(data.sourceText || ''),
  aiSummary: String(data.aiSummary || ''),
  aiSuggestedCategory: String(data.aiSuggestedCategory || ''),
  aiSuggestedTags: Array.isArray(data.aiSuggestedTags) ? data.aiSuggestedTags.map(String) : [],
  aiSuggestedStatus: String(data.aiSuggestedStatus || ''),
  aiSuggestedLocation: String(data.aiSuggestedLocation || ''),
  aiConfidence: typeof data.aiConfidence === 'number' ? data.aiConfidence : 0,
  createdAt: (data.createdAt as Bookmark['createdAt']) || null,
  updatedAt: (data.updatedAt as Bookmark['updatedAt']) || null,
  confirmedAt: (data.confirmedAt as Bookmark['confirmedAt']) || null,
  completedAt: (data.completedAt as Bookmark['completedAt']) || null,
  visitedAt: (data.visitedAt as Bookmark['visitedAt']) || null,
  purchasedAt: (data.purchasedAt as Bookmark['purchasedAt']) || null,
  archivedAt: (data.archivedAt as Bookmark['archivedAt']) || null,
});

export async function getBookmarks(): Promise<Bookmark[]> {
  return new Promise((resolve, reject) => {
    const stop = subscribeBookmarks(
      (bookmarks) => {
        stop();
        resolve(bookmarks);
      },
      reject,
    );
  });
}

export function subscribeBookmarks(
  onChange: (bookmarks: Bookmark[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const bookmarkQuery = query(bookmarksCollection(), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    bookmarkQuery,
    (snapshot) =>
      onChange(snapshot.docs.map((snapshotDoc) => toBookmark(snapshotDoc.id, snapshotDoc.data()))),
    (error) => onError(error),
  );
}

export async function addBookmark(bookmark: BookmarkInput) {
  return addDoc(bookmarksCollection(), {
    ...bookmark,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateBookmark(id: string, partialBookmark: Partial<BookmarkInput>) {
  return updateDoc(doc(bookmarksCollection(), id), {
    ...partialBookmark,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBookmark(id: string) {
  return deleteDoc(doc(bookmarksCollection(), id));
}

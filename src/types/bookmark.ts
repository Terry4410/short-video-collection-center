import type { Timestamp } from 'firebase/firestore';

export type BookmarkStatus =
  | '待整理'
  | 'AI待確認'
  | '已確認'
  | '想看'
  | '想學'
  | '想買'
  | '想去'
  | '進行中'
  | '已完成'
  | '已購買'
  | '已去過'
  | '封存';

export type BookmarkPriority = '高' | '中' | '低';
export type FirestoreDate = Timestamp | Date | string | null;

export type Bookmark = {
  id: string;
  url: string;
  platform: string;
  title: string;
  description?: string;
  note?: string;
  mainCategory: string;
  subCategory?: string;
  tags: string[];
  status: BookmarkStatus;
  priority: BookmarkPriority;
  thumbnailUrl?: string;
  hasLocation: boolean;
  placeName?: string;
  address?: string;
  lat?: number;
  lng?: number;
  googlePlaceId?: string;
  mapUrl?: string;
  ownerId?: string;
  sourceText?: string;
  aiSummary?: string;
  aiSuggestedCategory?: string;
  aiSuggestedTags?: string[];
  aiSuggestedStatus?: string;
  aiSuggestedLocation?: string;
  aiConfidence?: number;
  createdAt: FirestoreDate;
  updatedAt?: FirestoreDate;
  confirmedAt?: FirestoreDate;
  completedAt?: FirestoreDate;
  visitedAt?: FirestoreDate;
  purchasedAt?: FirestoreDate;
  archivedAt?: FirestoreDate;
};

export type BookmarkInput = Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>;

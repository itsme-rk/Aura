// ─── Event / Calendar Types ───────────────────────────────

export interface EventItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startAt: number;
  endAt: number;
  isAllDay: boolean;
  location?: string;
  category: EventCategory;
  priority: EventPriority;
  reminder?: number; // minutes before
  isRecurring: boolean;
  recurrenceRule?: string; // RRULE format
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export type EventCategory =
  | 'workout'
  | 'meal'
  | 'meeting'
  | 'task'
  | 'reminder'
  | 'personal'
  | 'other';

export type EventPriority = 'low' | 'medium' | 'high' | 'urgent';

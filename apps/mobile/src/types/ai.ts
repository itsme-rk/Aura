// ─── AI Insight Types ─────────────────────────────────────

export interface AIInsight {
  id: string;
  userId: string;
  type: InsightType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  source: InsightSource;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  isDismissed: boolean;
  expiresAt?: number;
  createdAt: number;
}

export type InsightType =
  | 'workout_suggestion'
  | 'nutrition_alert'
  | 'progress_update'
  | 'habit_pattern'
  | 'recovery_tip'
  | 'weekly_summary'
  | 'goal_milestone';

export type InsightSource =
  | 'workout_analysis'
  | 'nutrition_analysis'
  | 'sleep_analysis'
  | 'trend_detection'
  | 'manual';

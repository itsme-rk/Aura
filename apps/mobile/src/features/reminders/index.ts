// ─── Reminders Feature Barrel ─────────────────────────────

export * as reminderService from './services/reminder.service';
export {
  DEFAULT_REMINDER_SETTINGS,
  loadReminderSettings,
  saveReminderSettings,
  getActiveReminders,
  dismissReminder,
  clearAllReminders,
  checkWorkoutReminder,
  checkProteinReminder,
  evaluateAllReminders,
  isInQuietHours,
  canShowReminder,
  createReminder,
} from './services/reminder.service';
export type {
  ReminderType,
  Reminder,
  ReminderSettings,
  ReminderHistory,
} from './services/reminder.service';

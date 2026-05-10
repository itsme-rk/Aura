// ─── ReminderBanner ───────────────────────────────────────
//
// Lightweight dismissible banner for active reminders.
// Shows at the top of the home screen.
//

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useReminderStore } from '../../store/reminderStore';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { Reminder } from '../../features/reminders/services/reminder.service';

const PRIORITY_COLORS: Record<string, string> = {
  high: COLORS.error,
  medium: COLORS.warning,
  low: COLORS.info,
};

export function ReminderBanner() {
  const activeReminders = useReminderStore((s) => s.activeReminders);
  const dismissReminder = useReminderStore((s) => s.dismissReminder);

  if (activeReminders.length === 0) return null;

  return (
    <View style={styles.container}>
      {activeReminders.map((reminder) => (
        <View
          key={reminder.id}
          style={[
            styles.banner,
            { borderLeftColor: PRIORITY_COLORS[reminder.priority] ?? COLORS.info },
          ]}
        >
          <View style={styles.content}>
            <Text style={styles.title}>{reminder.title}</Text>
            <Text style={styles.body}>{reminder.body}</Text>
          </View>
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={() => dismissReminder(reminder.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.text,
  },
  body: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dismissBtn: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  dismissText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});

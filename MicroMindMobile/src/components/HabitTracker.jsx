import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useStoreState, useStoreDispatch } from '../store/StoreContext';
import { triggerTaskCompletionHaptic } from '../services/haptics';

export default function HabitTracker() {
  const { habits, history, theme } = useStoreState();
  const dispatch = useStoreDispatch();
  const colors = theme.colors;

  const completedCount = habits.filter((h) => h.done).length;
  const progressPercent = Math.round((completedCount / habits.length) * 100);

  const handleToggleHabit = (id) => {
    triggerTaskCompletionHaptic();
    dispatch({ type: 'TOGGLE_HABIT', id });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Overview Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgCard, borderColor: colors.borderColor },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            🌿 Daily Micro-Habits
          </Text>
          <Text style={[styles.progressText, { color: colors.primaryViolet }]}>
            {completedCount}/{habits.length} Done ({progressPercent}%)
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: colors.primaryViolet,
              },
            ]}
          />
        </View>
      </View>

      {/* Habit List */}
      <View style={styles.habitGrid}>
        {habits.map((habit) => (
          <Pressable
            key={habit.id}
            style={[
              styles.habitCard,
              {
                backgroundColor: habit.done
                  ? 'rgba(34, 197, 94, 0.15)'
                  : colors.bgCard,
                borderColor: habit.done ? '#22c55e' : colors.borderColor,
              },
            ]}
            onPress={() => handleToggleHabit(habit.id)}
          >
            <Text style={styles.habitEmoji}>{habit.emoji}</Text>
            <Text
              style={[
                styles.habitLabel,
                { color: habit.done ? '#22c55e' : colors.textPrimary },
              ]}
            >
              {habit.label}
            </Text>
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: habit.done ? '#22c55e' : colors.borderColor,
                  backgroundColor: habit.done ? '#22c55e' : 'transparent',
                },
              ]}
            >
              {habit.done && <Text style={styles.checkMark}>✓</Text>}
            </View>
          </Pressable>
        ))}
      </View>

      {/* History Heatmap Preview */}
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.textSecondary, marginTop: 16 },
        ]}
      >
        Habit History (Last 14 Days)
      </Text>

      <View
        style={[
          styles.heatmapCard,
          { backgroundColor: colors.bgCard, borderColor: colors.borderColor },
        ]}
      >
        <View style={styles.heatmapRow}>
          {Array.from({ length: 14 }).map((_, i) => {
            const hEntry = history[i];
            const count = hEntry?.habitsCompleted || 0;
            let bg = 'rgba(255,255,255,0.06)';
            if (count > 4) bg = '#22c55e';
            else if (count > 2) bg = 'rgba(34, 197, 94, 0.6)';
            else if (count > 0) bg = 'rgba(34, 197, 94, 0.3)';

            return (
              <View
                key={i}
                style={[styles.heatmapSquare, { backgroundColor: bg }]}
              />
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  habitGrid: {
    gap: 8,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  habitEmoji: {
    fontSize: 20,
  },
  habitLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  heatmapCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heatmapSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
});

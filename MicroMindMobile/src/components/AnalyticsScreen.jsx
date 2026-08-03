import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useStoreState, useStoreDispatch } from '../store/StoreContext';
import { Ionicons } from '@expo/vector-icons';
import { triggerMediumImpact, triggerLightImpact } from '../services/haptics';

export default function AnalyticsScreen() {
  const { tasks, moodToday, xp, level, badges, theme } = useStoreState();
  const dispatch = useStoreDispatch();
  const colors = theme.colors;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;

  const q1Count = tasks.filter((t) => t.category === 'q1').length;
  const q2Count = tasks.filter((t) => t.category === 'q2').length;
  const q3Count = tasks.filter((t) => t.category === 'q3').length;
  const q4Count = tasks.filter((t) => t.category === 'q4').length;

  const handleSetMood = (mood) => {
    triggerLightImpact();
    dispatch({ type: 'SET_MOOD', mood });
  };

  const handleDailyReset = () => {
    triggerMediumImpact();
    dispatch({ type: 'DAILY_RESET' });
  };

  const BADGE_DEFINITIONS = [
    {
      id: 'task-crusher',
      title: 'Task Crusher',
      emoji: '⚔️',
      desc: 'Completed 10 tasks in a day',
    },
    {
      id: '7-day-warrior',
      title: '7-Day Warrior',
      emoji: '🛡️',
      desc: 'Maintained a 7-day streak',
    },
    {
      id: 'focus-master',
      title: 'Focus Master',
      emoji: '🧘',
      desc: 'Completed 5 Pomodoro sessions',
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Mood Tracker Widget */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgCard, borderColor: colors.borderColor },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
          😊 How is your focus & mood today?
        </Text>
        <View style={styles.moodRow}>
          {[
            { level: 1, emoji: '😫', label: 'Drained' },
            { level: 2, emoji: '🙁', label: 'Low' },
            { level: 3, emoji: '😐', label: 'Okay' },
            { level: 4, emoji: '🙂', label: 'Good' },
            { level: 5, emoji: '🔥', label: 'Peak' },
          ].map((m) => (
            <Pressable
              key={m.level}
              style={[
                styles.moodBtn,
                {
                  backgroundColor:
                    moodToday === m.level
                      ? 'rgba(168, 85, 247, 0.25)'
                      : 'rgba(255,255,255,0.05)',
                  borderColor:
                    moodToday === m.level
                      ? colors.primaryViolet
                      : 'transparent',
                },
              ]}
              onPress={() => handleSetMood(m.level)}
            >
              <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
              <Text style={[styles.moodLabel, { color: colors.textSecondary }]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Stats Summary Grid */}
      <View style={styles.statsGrid}>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.bgCard, borderColor: colors.borderColor },
          ]}
        >
          <Text style={[styles.statVal, { color: colors.primaryViolet }]}>
            {completedTasks}/{totalTasks}
          </Text>
          <Text style={[styles.statLbl, { color: colors.textSecondary }]}>
            Tasks Completed
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.bgCard, borderColor: colors.borderColor },
          ]}
        >
          <Text style={[styles.statVal, { color: '#22c55e' }]}>{xp} XP</Text>
          <Text style={[styles.statLbl, { color: colors.textSecondary }]}>
            Level {level}
          </Text>
        </View>
      </View>

      {/* Eisenhower Distribution Breakdown */}
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.textSecondary, marginTop: 16 },
        ]}
      >
        📊 Quadrant Distribution
      </Text>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgCard, borderColor: colors.borderColor },
        ]}
      >
        {[
          { label: 'Q1 Do First', count: q1Count, color: '#ef4444' },
          { label: 'Q2 Schedule', count: q2Count, color: '#3b82f6' },
          { label: 'Q3 Delegate', count: q3Count, color: '#eab308' },
          { label: 'Q4 Eliminate', count: q4Count, color: '#94a3b8' },
        ].map((item) => {
          const pct =
            totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0;
          return (
            <View key={item.label} style={styles.distRow}>
              <View style={styles.distLabelRow}>
                <Text style={[styles.distLabel, { color: colors.textPrimary }]}>
                  {item.label}
                </Text>
                <Text style={[styles.distPct, { color: item.color }]}>
                  {item.count} ({pct}%)
                </Text>
              </View>
              <View style={styles.distBarBg}>
                <View
                  style={[
                    styles.distBarFill,
                    { width: `${pct}%`, backgroundColor: item.color },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Badges Unlocked */}
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.textSecondary, marginTop: 16 },
        ]}
      >
        🏆 Badges & Achievements
      </Text>

      <View style={styles.badgeGrid}>
        {BADGE_DEFINITIONS.map((b) => {
          const isUnlocked = badges.includes(b.id);

          return (
            <View
              key={b.id}
              style={[
                styles.badgeCard,
                {
                  backgroundColor: isUnlocked
                    ? 'rgba(234, 179, 8, 0.15)'
                    : colors.bgCard,
                  borderColor: isUnlocked ? '#eab308' : colors.borderColor,
                  opacity: isUnlocked ? 1 : 0.5,
                },
              ]}
            >
              <Text style={{ fontSize: 24 }}>{b.emoji}</Text>
              <Text
                style={[
                  styles.badgeCardTitle,
                  { color: isUnlocked ? '#eab308' : colors.textSecondary },
                ]}
              >
                {b.title}
              </Text>
              <Text
                style={[styles.badgeCardDesc, { color: colors.textSecondary }]}
              >
                {b.desc}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Daily Reset Button */}
      <Pressable style={styles.resetButton} onPress={handleDailyReset}>
        <Ionicons name="refresh-circle-outline" size={20} color="#ef4444" />
        <Text style={styles.resetButtonText}>Trigger Daily Reset</Text>
      </Pressable>
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
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodBtn: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    width: '18%',
  },
  moodLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLbl: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  distRow: {
    marginBottom: 10,
  },
  distLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  distLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  distPct: {
    fontSize: 12,
    fontWeight: '700',
  },
  distBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  distBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  badgeGrid: {
    gap: 8,
    marginBottom: 24,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  badgeCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  badgeCardDesc: {
    fontSize: 11,
    flex: 1,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    marginBottom: 32,
  },
  resetButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
});

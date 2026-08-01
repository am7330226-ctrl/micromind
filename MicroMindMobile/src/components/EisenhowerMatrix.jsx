import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useStoreState } from '../store/StoreContext';
import TaskCard from './TaskCard';

const QUADRANTS = [
  { id: 'q1', title: 'Q1: Do First', subtitle: 'Urgent & Important', color: '#ef4444' },
  { id: 'q2', title: 'Q2: Schedule', subtitle: 'Not Urgent & Important', color: '#3b82f6' },
  { id: 'q3', title: 'Q3: Delegate', subtitle: 'Urgent & Not Important', color: '#eab308' },
  { id: 'q4', title: 'Q4: Eliminate', subtitle: 'Not Urgent & Not Important', color: '#94a3b8' },
];

export default function EisenhowerMatrix({ onOpenDetail }) {
  const { tasks, theme } = useStoreState();
  const colors = theme.colors;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {QUADRANTS.map(q => {
        const quadrantTasks = tasks.filter(t => t.category === q.id);

        return (
          <View
            key={q.id}
            style={[
              styles.quadrantBox,
              { backgroundColor: colors.bgCard, borderColor: colors.borderColor },
            ]}
          >
            <View style={styles.quadrantHeader}>
              <View style={[styles.colorIndicator, { backgroundColor: q.color }]} />
              <View style={styles.quadrantTitleGroup}>
                <Text style={[styles.quadrantTitle, { color: colors.textPrimary }]}>{q.title}</Text>
                <Text style={[styles.quadrantSubtitle, { color: colors.textSecondary }]}>{q.subtitle}</Text>
              </View>
              <View style={[styles.countBadge, { backgroundColor: `${q.color}20` }]}>
                <Text style={[styles.countText, { color: q.color }]}>{quadrantTasks.length}</Text>
              </View>
            </View>

            {quadrantTasks.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No tasks in this quadrant</Text>
            ) : (
              quadrantTasks.map(task => (
                <TaskCard key={task.id} task={task} onOpenDetail={onOpenDetail} />
              ))
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  quadrantBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  quadrantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  colorIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  quadrantTitleGroup: {
    flex: 1,
  },
  quadrantTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  quadrantSubtitle: {
    fontSize: 11,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
});

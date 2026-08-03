import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useStoreState, useStoreDispatch } from '../store/StoreContext';
import { Ionicons } from '@expo/vector-icons';
import {
  triggerTaskCompletionHaptic,
  triggerLightImpact,
} from '../services/haptics';

const CATEGORY_COLORS = {
  q1: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'Q1 Do First' },
  q2: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', label: 'Q2 Schedule' },
  q3: { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', label: 'Q3 Delegate' },
  q4: {
    bg: 'rgba(148, 163, 184, 0.15)',
    text: '#94a3b8',
    label: 'Q4 Eliminate',
  },
  inbox: { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', label: 'Inbox' },
};

export default function TaskCard({ task, onOpenDetail }) {
  const { theme } = useStoreState();
  const dispatch = useStoreDispatch();
  const colors = theme.colors;

  const isCompleted = task.completed;
  const categoryInfo = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.inbox;

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;

  const handleToggle = () => {
    triggerTaskCompletionHaptic();
    dispatch({ type: 'TOGGLE_TASK', id: task.id, completing: !isCompleted });
  };

  const handleDelete = () => {
    triggerLightImpact();
    dispatch({ type: 'DELETE_TASK', id: task.id });
  };

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: isCompleted
            ? 'rgba(34, 197, 94, 0.3)'
            : colors.borderColor,
          opacity: isCompleted ? 0.65 : 1,
        },
      ]}
      onPress={() => {
        triggerLightImpact();
        onOpenDetail(task);
      }}
    >
      {/* Checkbox */}
      <Pressable
        style={[
          styles.checkbox,
          {
            borderColor: isCompleted ? '#22c55e' : colors.borderColor,
            backgroundColor: isCompleted ? '#22c55e' : 'transparent',
          },
        ]}
        onPress={handleToggle}
      >
        {isCompleted && <Ionicons name="checkmark" size={14} color="#ffffff" />}
      </Pressable>

      {/* Task Info */}
      <View style={styles.content}>
        <Text
          style={[
            styles.taskText,
            {
              color: isCompleted ? colors.textSecondary : colors.textPrimary,
              textDecorationLine: isCompleted ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={2}
        >
          {task.text}
        </Text>

        {/* Badges Row */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: categoryInfo.bg }]}>
            <Text style={[styles.badgeText, { color: categoryInfo.text }]}>
              {categoryInfo.label}
            </Text>
          </View>

          {task.timeEstimate?.label && (
            <View
              style={[
                styles.badge,
                { backgroundColor: 'rgba(255,255,255,0.06)' },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={10}
                color={colors.textSecondary}
              />
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                {task.timeEstimate.label}
              </Text>
            </View>
          )}

          {subtasks.length > 0 && (
            <View
              style={[
                styles.badge,
                { backgroundColor: 'rgba(255,255,255,0.06)' },
              ]}
            >
              <Ionicons
                name="list-outline"
                size={10}
                color={colors.textSecondary}
              />
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                {completedSubtasks}/{subtasks.length}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Delete button */}
      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  taskText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  deleteButton: {
    padding: 4,
  },
});

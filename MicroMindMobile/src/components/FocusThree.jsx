import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useStoreState, useStoreDispatch } from '../store/StoreContext';
import TaskCard from './TaskCard';
import { Ionicons } from '@expo/vector-icons';
import { triggerLightImpact } from '../services/haptics';

export default function FocusThree({ onOpenDetail }) {
  const { tasks, focusSlots, theme } = useStoreState();
  const dispatch = useStoreDispatch();
  const colors = theme.colors;

  const slots = ['focus-1', 'focus-2', 'focus-3'];

  // Available tasks to assign to focus slots
  const unassignedTasks = tasks.filter(
    (t) => !t.completed && !Object.values(focusSlots).includes(t.id),
  );

  const handleAssignSlot = (slotId, taskId) => {
    triggerLightImpact();
    dispatch({ type: 'SET_FOCUS_SLOT', slotId, taskId });
  };

  const handleClearSlot = (slotId) => {
    triggerLightImpact();
    dispatch({ type: 'SET_FOCUS_SLOT', slotId, taskId: null });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerBox}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          🎯 Today's Focus Three
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Limit work-in-progress to 3 high-impact commitments.
        </Text>
      </View>

      {/* Focus Slots */}
      {slots.map((slotId, index) => {
        const assignedTaskId = focusSlots[slotId];
        const assignedTask = tasks.find((t) => t.id === assignedTaskId);

        return (
          <View
            key={slotId}
            style={[
              styles.slotCard,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.borderColor,
              },
            ]}
          >
            <View style={styles.slotHeader}>
              <View
                style={[
                  styles.slotBadge,
                  { backgroundColor: colors.primaryViolet },
                ]}
              >
                <Text style={styles.slotBadgeText}>Priority #{index + 1}</Text>
              </View>

              {assignedTask && (
                <Pressable onPress={() => handleClearSlot(slotId)}>
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                </Pressable>
              )}
            </View>

            {assignedTask ? (
              <TaskCard task={assignedTask} onOpenDetail={onOpenDetail} />
            ) : (
              <View style={styles.unassignedBox}>
                <Text
                  style={[
                    styles.unassignedText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Slot Empty — Select a task below to commit
                </Text>
              </View>
            )}
          </View>
        );
      })}

      {/* Available Tasks Picker */}
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.textSecondary, marginTop: 16 },
        ]}
      >
        Unassigned Tasks ({unassignedTasks.length})
      </Text>

      {unassignedTasks.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No unassigned tasks available
        </Text>
      ) : (
        unassignedTasks.map((task) => (
          <View
            key={task.id}
            style={[
              styles.assignRow,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.borderColor,
              },
            ]}
          >
            <Text
              style={[styles.assignTaskText, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {task.text}
            </Text>
            <View style={styles.assignButtons}>
              {slots.map((slotId, idx) => (
                <Pressable
                  key={slotId}
                  style={[
                    styles.assignChip,
                    { backgroundColor: 'rgba(168, 85, 247, 0.15)' },
                  ]}
                  onPress={() => handleAssignSlot(slotId, task.id)}
                >
                  <Text
                    style={[
                      styles.assignChipText,
                      { color: colors.primaryViolet },
                    ]}
                  >
                    +#{idx + 1}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBox: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
  },
  slotCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  slotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  slotBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  unassignedBox: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
  },
  unassignedText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
    gap: 8,
  },
  assignTaskText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  assignButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  assignChip: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  assignChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

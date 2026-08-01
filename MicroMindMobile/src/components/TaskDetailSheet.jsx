import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useStoreState, useStoreDispatch } from '../store/StoreContext';
import { generateSubtasks } from '../services/aiClassifier';
import { Ionicons } from '@expo/vector-icons';
import { triggerLightImpact, triggerMediumImpact } from '../services/haptics';

export default function TaskDetailSheet({ task, visible, onClose }) {
  const { theme } = useStoreState();
  const dispatch = useStoreDispatch();
  const colors = theme.colors;

  const [newSubtask, setNewSubtask] = useState('');
  const [notes, setNotes] = useState(task?.notes || '');
  const [isAiLoading, setIsAiLoading] = useState(false);

  if (!task) return null;

  const subtasks = task.subtasks || [];

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    triggerLightImpact();
    dispatch({ type: 'ADD_SUBTASK', id: task.id, text: newSubtask.trim() });
    setNewSubtask('');
  };

  const handleToggleSubtask = (subtaskId, completed) => {
    triggerLightImpact();
    dispatch({ type: 'TOGGLE_SUBTASK', id: task.id, subtaskId, completed: !completed });
  };

  const handleDeleteSubtask = subtaskId => {
    triggerLightImpact();
    dispatch({ type: 'DELETE_SUBTASK', id: task.id, subtaskId });
  };

  const handleSaveNotes = () => {
    dispatch({ type: 'UPDATE_TASK_NOTES', id: task.id, notes });
  };

  const handleAiBreakdown = async () => {
    triggerMediumImpact();
    setIsAiLoading(true);
    try {
      const generated = await generateSubtasks(task.text);
      generated.forEach(st => {
        dispatch({ type: 'ADD_SUBTASK', id: task.id, text: st });
      });
    } catch (e) {
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleMoveCategory = newCat => {
    triggerLightImpact();
    dispatch({ type: 'MOVE_TASK', id: task.id, category: newCat });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.bgSidebar, borderColor: colors.borderColor }]}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {task.text}
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Category Selector */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Category</Text>
            <View style={styles.categoryRow}>
              {[
                { id: 'q1', label: 'Q1 Do First', color: '#ef4444' },
                { id: 'q2', label: 'Q2 Schedule', color: '#3b82f6' },
                { id: 'q3', label: 'Q3 Delegate', color: '#eab308' },
                { id: 'q4', label: 'Q4 Eliminate', color: '#94a3b8' },
                { id: 'inbox', label: 'Inbox', color: '#a855f7' },
              ].map(cat => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: task.category === cat.id ? `${cat.color}25` : colors.bgCard,
                      borderColor: task.category === cat.id ? cat.color : colors.borderColor,
                    },
                  ]}
                  onPress={() => handleMoveCategory(cat.id)}
                >
                  <Text style={[styles.catChipText, { color: task.category === cat.id ? cat.color : colors.textSecondary }]}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Subtasks Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Subtasks</Text>

              <Pressable
                style={[styles.aiBreakdownBtn, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}
                onPress={handleAiBreakdown}
                disabled={isAiLoading}
              >
                {isAiLoading ? (
                  <ActivityIndicator size="small" color={colors.primaryViolet} />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={12} color={colors.primaryViolet} />
                    <Text style={[styles.aiBreakdownBtnText, { color: colors.primaryViolet }]}>AI Breakdown</Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Subtask items */}
            {subtasks.map(st => (
              <View key={st.id} style={[styles.subtaskRow, { borderColor: colors.borderColor }]}>
                <Pressable onPress={() => handleToggleSubtask(st.id, st.completed)}>
                  <Ionicons
                    name={st.completed ? 'checkbox' : 'square-outline'}
                    size={18}
                    color={st.completed ? '#22c55e' : colors.textSecondary}
                  />
                </Pressable>
                <Text
                  style={[
                    styles.subtaskText,
                    {
                      color: st.completed ? colors.textSecondary : colors.textPrimary,
                      textDecorationLine: st.completed ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {st.text}
                </Text>
                <Pressable onPress={() => handleDeleteSubtask(st.id)}>
                  <Ionicons name="close-circle-outline" size={16} color={colors.textSecondary} />
                </Pressable>
              </View>
            ))}

            {/* Add Subtask Input */}
            <View style={[styles.addSubtaskRow, { backgroundColor: colors.bgCard, borderColor: colors.borderColor }]}>
              <TextInput
                style={[styles.subtaskInput, { color: colors.textPrimary }]}
                placeholder="Add subtask..."
                placeholderTextColor={colors.textSecondary}
                value={newSubtask}
                onChangeText={setNewSubtask}
                onSubmitEditing={handleAddSubtask}
              />
              <Pressable onPress={handleAddSubtask}>
                <Ionicons name="add-circle" size={24} color={colors.primaryViolet} />
              </Pressable>
            </View>

            {/* Notes Section */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 16 }]}>Notes</Text>
            <TextInput
              style={[styles.notesInput, { backgroundColor: colors.bgCard, borderColor: colors.borderColor, color: colors.textPrimary }]}
              placeholder="Add extra details or notes..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              onBlur={handleSaveNotes}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  aiBreakdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiBreakdownBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  subtaskText: {
    flex: 1,
    fontSize: 13,
  },
  addSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  subtaskInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 13,
  },
  notesInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
});

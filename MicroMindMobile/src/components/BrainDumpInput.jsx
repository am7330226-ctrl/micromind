import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable, Text } from 'react-native';
import { useStoreState, useStoreDispatch } from '../store/StoreContext';
import { classifyTask, estimateTaskTime } from '../services/aiClassifier';
import { Ionicons } from '@expo/vector-icons';
import { triggerMediumImpact, triggerLightImpact } from '../services/haptics';

export default function BrainDumpInput() {
  const { theme } = useStoreState();
  const dispatch = useStoreDispatch();
  const colors = theme.colors;

  const [text, setText] = useState('');

  const predictedCategory = text.trim() ? classifyTask(text) : null;
  const timeEstimate = text.trim() ? estimateTaskTime(text) : null;

  const handleAddTask = () => {
    if (!text.trim()) return;

    triggerMediumImpact();
    dispatch({
      type: 'ADD_TASK',
      task: {
        text: text.trim(),
      },
    });

    setText('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCard, borderColor: colors.borderColor }]}>
      <View style={styles.inputRow}>
        <Ionicons name="flash-outline" size={18} color={colors.primaryViolet} />
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder="Brain dump task or thought..."
          placeholderTextColor={colors.textSecondary}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleAddTask}
          returnKeyType="done"
        />
        <Pressable
          style={[
            styles.addButton,
            {
              backgroundColor: text.trim() ? colors.primaryViolet : 'rgba(255,255,255,0.08)',
            },
          ]}
          onPress={handleAddTask}
          disabled={!text.trim()}
        >
          <Ionicons name="arrow-up" size={16} color="#ffffff" />
        </Pressable>
      </View>

      {/* AI Preview */}
      {text.trim().length > 0 && (
        <View style={styles.previewRow}>
          <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>🤖 AI Preview:</Text>

          <View style={[styles.badge, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
            <Text style={[styles.badgeText, { color: colors.primaryViolet }]}>
              {predictedCategory ? predictedCategory.toUpperCase() : 'INBOX'}
            </Text>
          </View>

          {timeEstimate && (
            <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>⏱️ {timeEstimate.label}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 6,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

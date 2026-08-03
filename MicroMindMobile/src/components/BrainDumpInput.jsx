import { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable, Text } from 'react-native';
import { useStoreState, useStoreDispatch } from '../store/StoreContext';
import { classifyTask, estimateTaskTime } from '../services/aiClassifier';
import { Ionicons } from '@expo/vector-icons';
import { triggerMediumImpact, triggerLightImpact } from '../services/haptics';

const TAGS = [
  { id: 'Idea', emoji: '💡', label: 'Idea' },
  { id: 'Learning', emoji: '🎓', label: 'Learning' },
  { id: 'Habit', emoji: '🌿', label: 'Habit' },
  { id: 'Reflection', emoji: '🪞', label: 'Reflection' },
];

const TAG_COLORS = {
  Idea: { bg: 'rgba(99,102,241,0.18)', text: '#6366F1', activeBg: '#6366F1' },
  Learning: {
    bg: 'rgba(16,185,129,0.18)',
    text: '#10B981',
    activeBg: '#10B981',
  },
  Habit: { bg: 'rgba(245,158,11,0.18)', text: '#F59E0B', activeBg: '#F59E0B' },
  Reflection: {
    bg: 'rgba(236,72,153,0.18)',
    text: '#EC4899',
    activeBg: '#EC4899',
  },
};

export default function BrainDumpInput() {
  const { theme } = useStoreState();
  const dispatch = useStoreDispatch();
  const colors = theme.colors;

  const [text, setText] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);

  const predictedCategory = text.trim() ? classifyTask(text) : null;
  const timeEstimate = text.trim() ? estimateTaskTime(text) : null;

  const canSubmit = text.trim().length > 0;

  const handleAdd = () => {
    if (!canSubmit) return;
    triggerMediumImpact();

    if (selectedTag) {
      // Save to Memory Deck as a tagged thought
      dispatch({
        type: 'ADD_THOUGHT',
        payload: { text: text.trim(), tag: selectedTag },
      });
    } else {
      // Save as a task to Inbox
      dispatch({
        type: 'ADD_TASK',
        task: { text: text.trim() },
      });
    }

    setText('');
    setSelectedTag(null);
  };

  const handleTagPress = (tagId) => {
    triggerLightImpact();
    setSelectedTag((prev) => (prev === tagId ? null : tagId));
  };

  const tagStyle = selectedTag ? TAG_COLORS[selectedTag] : null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgCard,
          borderColor: selectedTag
            ? tagStyle?.text || colors.borderColor
            : colors.borderColor,
        },
      ]}
    >
      {/* ── Input Row ─────────────────────────────────────────────────────── */}
      <View style={styles.inputRow}>
        <Ionicons
          name={selectedTag ? 'bulb' : 'flash'}
          size={18}
          color={tagStyle?.text || colors.primaryViolet}
        />
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder={
            selectedTag
              ? `Capture a ${selectedTag.toLowerCase()}...`
              : 'Brain dump a task or thought...'
          }
          placeholderTextColor={colors.textSecondary}
          value={text}
          onChangeText={setText}
          multiline
          numberOfLines={2}
          returnKeyType="done"
          blurOnSubmit
          onSubmitEditing={handleAdd}
        />
        <Pressable
          style={[
            styles.addButton,
            {
              backgroundColor: canSubmit
                ? tagStyle?.activeBg || colors.primaryViolet
                : 'rgba(255,255,255,0.08)',
            },
          ]}
          onPress={handleAdd}
          disabled={!canSubmit}
        >
          <Ionicons name="arrow-up" size={16} color="#ffffff" />
        </Pressable>
      </View>

      {/* ── Tag Pill Selector ─────────────────────────────────────────────── */}
      <View style={styles.tagRow}>
        <Text style={[styles.tagRowLabel, { color: colors.textSecondary }]}>
          Save to:
        </Text>
        {TAGS.map((tag) => {
          const tc = TAG_COLORS[tag.id];
          const isActive = selectedTag === tag.id;
          return (
            <Pressable
              key={tag.id}
              style={[
                styles.tagPill,
                {
                  backgroundColor: isActive ? tc.activeBg : tc.bg,
                  borderColor: isActive ? tc.text : 'transparent',
                },
              ]}
              onPress={() => handleTagPress(tag.id)}
            >
              <Text style={styles.tagPillEmoji}>{tag.emoji}</Text>
              <Text
                style={[
                  styles.tagPillText,
                  { color: isActive ? '#ffffff' : tc.text },
                ]}
              >
                {tag.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Destination hint ─────────────────────────────────────────────── */}
      <View style={styles.hintRow}>
        {selectedTag ? (
          <>
            <Ionicons name="albums-outline" size={11} color={tagStyle?.text} />
            <Text style={[styles.hintText, { color: tagStyle?.text }]}>
              → Memory Deck as &quot;{selectedTag}&quot;
            </Text>
          </>
        ) : (
          <>
            <Ionicons
              name="flash-outline"
              size={11}
              color={colors.textSecondary}
            />
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              → Task Inbox
            </Text>
          </>
        )}

        {!selectedTag && text.trim().length > 0 && (
          <>
            <View
              style={[
                styles.aiBadge,
                { backgroundColor: 'rgba(99,102,241,0.15)' },
              ]}
            >
              <Text
                style={[styles.aiBadgeText, { color: colors.primaryViolet }]}
              >
                🤖 {predictedCategory?.toUpperCase() || 'INBOX'}
              </Text>
            </View>
            {timeEstimate && (
              <View
                style={[
                  styles.aiBadge,
                  { backgroundColor: 'rgba(255,255,255,0.06)' },
                ]}
              >
                <Text
                  style={[styles.aiBadgeText, { color: colors.textSecondary }]}
                >
                  ⏱ {timeEstimate.label}
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 16,
    gap: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 2,
    maxHeight: 80,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  // Tag pills
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagRowLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginRight: 2,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  tagPillEmoji: { fontSize: 12 },
  tagPillText: { fontSize: 11, fontWeight: '800' },

  // Hint row
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  hintText: { fontSize: 11, fontWeight: '600' },
  aiBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiBadgeText: { fontSize: 10, fontWeight: '700' },
});

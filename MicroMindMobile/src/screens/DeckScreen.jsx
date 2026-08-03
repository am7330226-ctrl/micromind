import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { useStoreState, useStoreDispatch } from '../store/StoreContext';
import { Ionicons } from '@expo/vector-icons';
import {
  triggerLightImpact,
  triggerMediumImpact,
  triggerTaskCompletionHaptic,
} from '../services/haptics';

const TAG_FILTERS = ['All', 'Idea', 'Learning', 'Habit', 'Reflection'];

const TAG_COLORS = {
  Idea: { bg: 'rgba(99,102,241,0.18)', text: '#6366F1' },
  Learning: { bg: 'rgba(16,185,129,0.18)', text: '#10B981' },
  Habit: { bg: 'rgba(245,158,11,0.18)', text: '#F59E0B' },
  Reflection: { bg: 'rgba(236,72,153,0.18)', text: '#EC4899' },
};

const STATUS_CONFIG = {
  active: { label: 'Active', color: '#94A3B8' },
  reviewed: { label: 'Reviewed', color: '#10B981' },
  archived: { label: 'Archived', color: '#6366F1' },
};

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DeckScreen() {
  const { thoughts, theme } = useStoreState();
  const dispatch = useStoreDispatch();
  const colors = theme.colors;

  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let list = [...(thoughts || [])];

    // Pinned float to top
    list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt - a.createdAt;
    });

    if (activeFilter !== 'All') {
      list = list.filter((t) => t.tag === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => t.text.toLowerCase().includes(q));
    }

    return list;
  }, [thoughts, activeFilter, searchQuery]);

  const activeCount = (thoughts || []).filter(
    (t) => t.status === 'active',
  ).length;
  const reviewedCount = (thoughts || []).filter(
    (t) => t.status === 'reviewed',
  ).length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bgMain }]}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.topArea}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
            Memory Deck
          </Text>
          <Text
            style={[styles.screenSubtitle, { color: colors.textSecondary }]}
          >
            {(thoughts || []).length} captured thoughts
          </Text>
        </View>
        <View style={styles.countPills}>
          <View
            style={[
              styles.countPill,
              { backgroundColor: 'rgba(16,185,129,0.15)' },
            ]}
          >
            <Text style={[styles.countPillText, { color: '#10B981' }]}>
              ✅ {reviewedCount}
            </Text>
          </View>
          <View
            style={[
              styles.countPill,
              { backgroundColor: 'rgba(99,102,241,0.15)' },
            ]}
          >
            <Text style={[styles.countPillText, { color: '#6366F1' }]}>
              🔵 {activeCount}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.searchRow,
          { backgroundColor: colors.bgCard, borderColor: colors.borderColor },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={16}
          color={colors.textSecondary}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search thoughts..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons
              name="close-circle"
              size={16}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {/* ── Tag Filters ────────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {TAG_FILTERS.map((f) => (
          <Pressable
            key={f}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  activeFilter === f ? colors.primaryViolet : colors.bgCard,
                borderColor:
                  activeFilter === f
                    ? colors.primaryViolet
                    : colors.borderColor,
              },
            ]}
            onPress={() => {
              triggerLightImpact();
              setActiveFilter(f);
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: activeFilter === f ? '#ffffff' : colors.textSecondary,
                },
              ]}
            >
              {f === 'All'
                ? '🗂 All'
                : f === 'Idea'
                  ? '💡 Idea'
                  : f === 'Learning'
                    ? '🎓 Learning'
                    : f === 'Habit'
                      ? '🌿 Habit'
                      : '🪞 Reflection'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Thought Cards ──────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧠</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {(thoughts || []).length === 0
                ? 'No thoughts captured yet'
                : 'No results found'}
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              {(thoughts || []).length === 0
                ? 'Use Brain Dump in the Inbox tab to capture your first idea.'
                : 'Try a different filter or search term.'}
            </Text>
          </View>
        ) : (
          filtered.map((thought) => (
            <ThoughtCard
              key={thought.id}
              thought={thought}
              colors={colors}
              dispatch={dispatch}
            />
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ── Individual Thought Card ──────────────────────────────────────────────────
function ThoughtCard({ thought, colors, dispatch }) {
  const tagStyle = TAG_COLORS[thought.tag] || TAG_COLORS.Idea;
  const statusInfo = STATUS_CONFIG[thought.status] || STATUS_CONFIG.active;

  const handlePin = () => {
    triggerLightImpact();
    dispatch({ type: 'PIN_THOUGHT', id: thought.id });
  };

  const handleReview = () => {
    triggerTaskCompletionHaptic();
    dispatch({
      type: 'UPDATE_THOUGHT_STATUS',
      id: thought.id,
      status: thought.status === 'reviewed' ? 'active' : 'reviewed',
    });
  };

  const handleArchive = () => {
    triggerMediumImpact();
    dispatch({ type: 'ARCHIVE_THOUGHT', id: thought.id });
  };

  const handleDelete = () => {
    triggerLightImpact();
    dispatch({ type: 'DELETE_THOUGHT', id: thought.id });
  };

  return (
    <View
      style={[
        styles.thoughtCard,
        {
          backgroundColor: colors.bgCard,
          borderColor: thought.pinned
            ? 'rgba(245,158,11,0.5)'
            : thought.status === 'reviewed'
              ? 'rgba(16,185,129,0.35)'
              : thought.status === 'archived'
                ? 'rgba(99,102,241,0.25)'
                : colors.borderColor,
          opacity: thought.status === 'archived' ? 0.65 : 1,
        },
      ]}
    >
      {/* Pin indicator strip */}
      {thought.pinned && (
        <View
          style={[
            styles.pinStrip,
            { backgroundColor: 'rgba(245,158,11,0.12)' },
          ]}
        >
          <Text style={styles.pinStripText}>📌 Pinned</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        {/* Tag + Time */}
        <View style={styles.cardMeta}>
          <View style={[styles.tagChip, { backgroundColor: tagStyle.bg }]}>
            <Text style={[styles.tagChipText, { color: tagStyle.text }]}>
              {thought.tag}
            </Text>
          </View>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {timeAgo(thought.createdAt)}
          </Text>
          <View
            style={[styles.statusDot, { backgroundColor: statusInfo.color }]}
          />
        </View>

        {/* Thought text */}
        <Text style={[styles.thoughtText, { color: colors.textPrimary }]}>
          {thought.text}
        </Text>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {/* Pin */}
          <Pressable
            style={[
              styles.actionBtn,
              {
                backgroundColor: thought.pinned
                  ? 'rgba(245,158,11,0.18)'
                  : 'rgba(255,255,255,0.06)',
              },
            ]}
            onPress={handlePin}
          >
            <Text style={styles.actionBtnEmoji}>📌</Text>
            <Text
              style={[
                styles.actionBtnLabel,
                { color: thought.pinned ? '#F59E0B' : colors.textSecondary },
              ]}
            >
              {thought.pinned ? 'Unpin' : 'Pin'}
            </Text>
          </Pressable>

          {/* Reviewed */}
          <Pressable
            style={[
              styles.actionBtn,
              {
                backgroundColor:
                  thought.status === 'reviewed'
                    ? 'rgba(16,185,129,0.18)'
                    : 'rgba(255,255,255,0.06)',
              },
            ]}
            onPress={handleReview}
          >
            <Ionicons
              name={
                thought.status === 'reviewed'
                  ? 'checkmark-circle'
                  : 'checkmark-circle-outline'
              }
              size={14}
              color={
                thought.status === 'reviewed' ? '#10B981' : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.actionBtnLabel,
                {
                  color:
                    thought.status === 'reviewed'
                      ? '#10B981'
                      : colors.textSecondary,
                },
              ]}
            >
              Reviewed
            </Text>
          </Pressable>

          {/* Archive */}
          <Pressable
            style={[
              styles.actionBtn,
              {
                backgroundColor:
                  thought.status === 'archived'
                    ? 'rgba(99,102,241,0.18)'
                    : 'rgba(255,255,255,0.06)',
              },
            ]}
            onPress={handleArchive}
          >
            <Ionicons
              name={
                thought.status === 'archived' ? 'archive' : 'archive-outline'
              }
              size={14}
              color={
                thought.status === 'archived' ? '#6366F1' : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.actionBtnLabel,
                {
                  color:
                    thought.status === 'archived'
                      ? '#6366F1'
                      : colors.textSecondary,
                },
              ]}
            >
              Archive
            </Text>
          </Pressable>

          {/* Delete */}
          <Pressable style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={14} color="#ef4444" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  topArea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  screenTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  screenSubtitle: { fontSize: 13, marginTop: 2 },
  countPills: { flexDirection: 'row', gap: 6, marginTop: 4 },
  countPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countPillText: { fontSize: 12, fontWeight: '700' },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },

  filterScroll: { paddingBottom: 4 },
  filterContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontWeight: '700' },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 16 },

  // Thought card
  thoughtCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  pinStrip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245,158,11,0.2)',
  },
  pinStripText: { fontSize: 11, fontWeight: '700', color: '#F59E0B' },
  cardBody: { padding: 14 },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tagChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagChipText: { fontSize: 11, fontWeight: '800' },
  timeText: { fontSize: 11, flex: 1 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  thoughtText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 12,
  },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionBtnEmoji: { fontSize: 12 },
  actionBtnLabel: { fontSize: 11, fontWeight: '700' },
  deleteBtn: { marginLeft: 'auto', padding: 4 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

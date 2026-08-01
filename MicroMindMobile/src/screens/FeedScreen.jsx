import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
} from 'react-native';
import { useStoreState } from '../store/StoreContext';
import { Ionicons } from '@expo/vector-icons';
import { triggerLightImpact } from '../services/haptics';

// ── Rich mock data: 8 Micro-Insight Knowledge Cards ─────────────────────────
const INSIGHTS = [
  {
    id: 'ins-1',
    category: 'Cognitive Bias',
    categoryColor: '#6366F1',
    emoji: '🧩',
    title: "Dunning-Kruger Effect",
    summary:
      "People with limited knowledge in a domain tend to overestimate their own competence — while experts underestimate theirs. Awareness of this bias sharpens calibration and invites deliberate humility.",
    readTime: '60s',
    xpReward: 10,
    tag: 'Mental Model',
  },
  {
    id: 'ins-2',
    category: 'Productivity',
    categoryColor: '#10B981',
    emoji: '⚡',
    title: "Parkinson's Law",
    summary:
      "Work expands to fill the time available. By setting artificially tight deadlines, you force your brain into execution mode and dramatically cut decision-making overhead.",
    readTime: '45s',
    xpReward: 10,
    tag: 'Time Management',
  },
  {
    id: 'ins-3',
    category: 'Decision Making',
    categoryColor: '#F59E0B',
    emoji: '🎯',
    title: "First Principles Thinking",
    summary:
      "Break problems into their fundamental truths, then reason up from scratch. Used by Aristotle and Elon Musk — it obliterates inherited assumptions and unlocks radical solutions.",
    readTime: '60s',
    xpReward: 15,
    tag: 'Mental Model',
  },
  {
    id: 'ins-4',
    category: 'Focus',
    categoryColor: '#8B5CF6',
    emoji: '🔭',
    title: "The 2-Minute Rule",
    summary:
      "If a task takes under 2 minutes, do it immediately. This single heuristic eliminates the hidden mental tax of 'open loops' — tasks stored in working memory without resolution.",
    readTime: '30s',
    xpReward: 8,
    tag: 'GTD',
  },
  {
    id: 'ins-5',
    category: 'Cognitive Bias',
    categoryColor: '#6366F1',
    emoji: '🌀',
    title: "Sunk Cost Fallacy",
    summary:
      "Past investment — money, time, effort — should never drive future decisions. Only future value matters. Recognizing this frees you from escalating losing commitments.",
    readTime: '45s',
    xpReward: 10,
    tag: 'Decision Making',
  },
  {
    id: 'ins-6',
    category: 'Learning',
    categoryColor: '#10B981',
    emoji: '🧠',
    title: "Spaced Repetition",
    summary:
      "Reviewing material at gradually increasing intervals (1d → 3d → 7d → 21d) exploits the 'spacing effect' — one of the most replicated findings in memory research. Active recall beats passive re-reading 4-to-1.",
    readTime: '60s',
    xpReward: 15,
    tag: 'Learning Science',
  },
  {
    id: 'ins-7',
    category: 'Systems',
    categoryColor: '#F59E0B',
    emoji: '⚙️',
    title: "Second-Order Thinking",
    summary:
      "Ask 'and then what?' after every decision. First-order thinkers see immediate consequences; second-order thinkers model the downstream ripple effects — the mark of genuine strategic intelligence.",
    readTime: '60s',
    xpReward: 15,
    tag: 'Mental Model',
  },
  {
    id: 'ins-8',
    category: 'Psychology',
    categoryColor: '#EC4899',
    emoji: '🪞',
    title: "Cognitive Reframing",
    summary:
      "Deliberately shifting the perspective through which you interpret a situation changes its emotional valence without changing any facts. Used by CBT therapists and elite athletes alike to break destructive thought loops.",
    readTime: '45s',
    xpReward: 10,
    tag: 'Mental Clarity',
  },
];

const FEATURED = INSIGHTS.slice(0, 3);
const REMAINING = INSIGHTS.slice(3);

export default function FeedScreen() {
  const { theme, clarityScore, streak } = useStoreState();
  const colors = theme.colors;

  const [learnedIds, setLearnedIds] = useState(new Set());

  const toggleLearned = id => {
    triggerLightImpact();
    setLearnedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgMain }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {/* ── Top Banner ─────────────────────────────────────────────────────── */}
      <View style={styles.banner}>
        <View>
          <Text style={[styles.bannerDate, { color: colors.textSecondary }]}>{todayLabel}</Text>
          <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>
            Daily Micro-Insights
          </Text>
          <Text style={[styles.bannerSubtitle, { color: colors.textSecondary }]}>
            Sharpen your mind in 60 seconds ⚡
          </Text>
        </View>

        {/* Streak pill */}
        <View style={[styles.streakPill, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={[styles.streakText, { color: colors.accentAmber }]}>{streak}d</Text>
        </View>
      </View>

      {/* ── Clarity Gauge ──────────────────────────────────────────────────── */}
      <View style={[styles.clarityCard, { backgroundColor: colors.bgCard, borderColor: colors.borderColor }]}>
        <View style={styles.clarityHeader}>
          <Text style={[styles.clarityLabel, { color: colors.textSecondary }]}>
            🧠 Cognitive Clarity Score
          </Text>
          <Text style={[styles.clarityScore, { color: colors.primaryViolet }]}>
            {clarityScore}/100
          </Text>
        </View>
        <View style={[styles.gaugeTrack, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
          <View
            style={[
              styles.gaugeFill,
              {
                width: `${clarityScore}%`,
                backgroundColor:
                  clarityScore >= 70
                    ? colors.accentEmerald
                    : clarityScore >= 40
                    ? colors.accentAmber
                    : '#ef4444',
              },
            ]}
          />
        </View>
        <Text style={[styles.clarityCaption, { color: colors.textSecondary }]}>
          {clarityScore >= 70
            ? '✨ Peak clarity — you\'re firing on all cylinders!'
            : clarityScore >= 40
            ? '⚡ Building momentum — keep stacking habits.'
            : '🌱 Low clarity — complete habits and set your mood.'}
        </Text>
      </View>

      {/* ── Featured Insights (Horizontal Scroll) ─────────────────────────── */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        ⭐ FEATURED TODAY
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.featuredScroll}
        contentContainerStyle={styles.featuredContent}
      >
        {FEATURED.map(card => (
          <FeaturedCard
            key={card.id}
            card={card}
            learned={learnedIds.has(card.id)}
            onToggle={toggleLearned}
            colors={colors}
          />
        ))}
      </ScrollView>

      {/* ── More Insights (Vertical List) ─────────────────────────────────── */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 24 }]}>
        📚 MORE KNOWLEDGE CARDS
      </Text>

      {REMAINING.map(card => (
        <InsightCard
          key={card.id}
          card={card}
          learned={learnedIds.has(card.id)}
          onToggle={toggleLearned}
          colors={colors}
        />
      ))}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

// ── Featured Card Component ──────────────────────────────────────────────────
function FeaturedCard({ card, learned, onToggle, colors }) {
  return (
    <Pressable
      style={[
        styles.featCard,
        {
          backgroundColor: colors.bgCard,
          borderColor: learned ? colors.accentEmerald : colors.borderColor,
        },
      ]}
      onPress={() => onToggle(card.id)}
      activeOpacity={0.7}
    >
      <View style={styles.featCardTop}>
        <Text style={styles.featEmoji}>{card.emoji}</Text>
        <View style={[styles.categoryChip, { backgroundColor: `${card.categoryColor}22` }]}>
          <Text style={[styles.categoryChipText, { color: card.categoryColor }]}>
            {card.category}
          </Text>
        </View>
      </View>

      <Text style={[styles.featTitle, { color: colors.textPrimary }]}>{card.title}</Text>
      <Text style={[styles.featSummary, { color: colors.textSecondary }]} numberOfLines={4}>
        {card.summary}
      </Text>

      <View style={styles.featFooter}>
        <View style={[styles.readTimeBadge, { backgroundColor: 'rgba(255,255,255,0.07)' }]}>
          <Ionicons name="time-outline" size={11} color={colors.textSecondary} />
          <Text style={[styles.readTimeText, { color: colors.textSecondary }]}>
            🕐 {card.readTime}
          </Text>
        </View>
        <View style={[styles.xpBadge, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
          <Text style={[styles.xpText, { color: colors.accentIndigo }]}>+{card.xpReward} XP</Text>
        </View>

        <Pressable
          style={[
            styles.learnedBtn,
            {
              backgroundColor: learned
                ? 'rgba(16,185,129,0.2)'
                : 'rgba(255,255,255,0.07)',
              borderColor: learned ? colors.accentEmerald : 'transparent',
            },
          ]}
          onPress={() => onToggle(card.id)}
        >
          <Ionicons
            name={learned ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={14}
            color={learned ? colors.accentEmerald : colors.textSecondary}
          />
          <Text
            style={[
              styles.learnedBtnText,
              { color: learned ? colors.accentEmerald : colors.textSecondary },
            ]}
          >
            {learned ? 'Learned' : 'Mark Learned'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

// ── Insight Card Component (vertical list) ───────────────────────────────────
function InsightCard({ card, learned, onToggle, colors }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      style={[
        styles.insightCard,
        {
          backgroundColor: colors.bgCard,
          borderColor: learned ? colors.accentEmerald : colors.borderColor,
        },
      ]}
      onPress={() => {
        triggerLightImpact();
        setExpanded(e => !e);
      }}
      activeOpacity={0.85}
    >
      <View style={styles.insightHeader}>
        <Text style={styles.insightEmoji}>{card.emoji}</Text>
        <View style={styles.insightTitleBlock}>
          <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>{card.title}</Text>
          <View style={styles.insightMetaRow}>
            <View style={[styles.categoryChip, { backgroundColor: `${card.categoryColor}22` }]}>
              <Text style={[styles.categoryChipText, { color: card.categoryColor }]}>
                {card.category}
              </Text>
            </View>
            <Text style={[styles.readTimeInline, { color: colors.textSecondary }]}>
              🕐 {card.readTime}
            </Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textSecondary}
        />
      </View>

      {expanded && (
        <>
          <Text style={[styles.insightBody, { color: colors.textSecondary }]}>
            {card.summary}
          </Text>
          <View style={styles.insightFooter}>
            <View style={[styles.xpBadge, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
              <Text style={[styles.xpText, { color: colors.accentIndigo }]}>+{card.xpReward} XP</Text>
            </View>
            <Pressable
              style={[
                styles.learnedBtn,
                {
                  backgroundColor: learned
                    ? 'rgba(16,185,129,0.2)'
                    : 'rgba(255,255,255,0.07)',
                  borderColor: learned ? colors.accentEmerald : 'transparent',
                },
              ]}
              onPress={() => onToggle(card.id)}
            >
              <Ionicons
                name={learned ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={14}
                color={learned ? colors.accentEmerald : colors.textSecondary}
              />
              <Text
                style={[
                  styles.learnedBtnText,
                  { color: learned ? colors.accentEmerald : colors.textSecondary },
                ]}
              >
                {learned ? 'Learned ✓' : 'Mark Learned'}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bannerDate: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  bannerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  bannerSubtitle: { fontSize: 13, marginTop: 2 },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  streakEmoji: { fontSize: 14 },
  streakText: { fontSize: 13, fontWeight: '800' },

  // Clarity
  clarityCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  clarityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clarityLabel: { fontSize: 12, fontWeight: '600' },
  clarityScore: { fontSize: 18, fontWeight: '800' },
  gaugeTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  gaugeFill: { height: '100%', borderRadius: 5 },
  clarityCaption: { fontSize: 12 },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  // Featured horizontal
  featuredScroll: { marginHorizontal: -16 },
  featuredContent: { paddingHorizontal: 16, gap: 12 },
  featCard: {
    width: 260,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  featCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featEmoji: { fontSize: 28 },
  featTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  featSummary: { fontSize: 13, lineHeight: 20 },
  featFooter: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 },

  // Insight card (vertical)
  insightCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  insightEmoji: { fontSize: 22 },
  insightTitleBlock: { flex: 1 },
  insightTitle: { fontSize: 14, fontWeight: '700' },
  insightMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  insightBody: { fontSize: 13, lineHeight: 20, marginTop: 12 },
  insightFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  readTimeInline: { fontSize: 11 },

  // Shared
  categoryChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryChipText: { fontSize: 10, fontWeight: '700' },
  readTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  readTimeText: { fontSize: 10 },
  xpBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  xpText: { fontSize: 10, fontWeight: '800' },
  learnedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 'auto',
  },
  learnedBtnText: { fontSize: 11, fontWeight: '700' },

  bottomSpacer: { height: 20 },
});

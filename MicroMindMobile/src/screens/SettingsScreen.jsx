import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import {
  useStoreState,
  useStoreDispatch,
  useAuth,
} from '../store/StoreContext';
import { Ionicons } from '@expo/vector-icons';
import { THEMES } from '../theme/themes';
import AuthModal from '../components/AuthModal';
import VoiceBriefingModal from '../components/VoiceBriefingModal';
import { triggerLightImpact, triggerMediumImpact } from '../services/haptics';

// Sub-navigation sections
const TOOL_SECTIONS = [
  {
    id: 'matrix',
    icon: 'grid-outline',
    label: 'Eisenhower Matrix',
    desc: 'Prioritize by urgency & importance',
  },
  {
    id: 'focus',
    icon: 'disc-outline',
    label: 'Focus Three',
    desc: 'Lock in your top 3 commitments',
  },
  {
    id: 'pomodoro',
    icon: 'timer-outline',
    label: 'Pomodoro Timer',
    desc: '25-min deep work sprints',
  },
  {
    id: 'habits',
    icon: 'leaf-outline',
    label: 'Habit Tracker',
    desc: 'Build daily micro-habits',
  },
  {
    id: 'stats',
    icon: 'stats-chart-outline',
    label: 'Analytics',
    desc: 'Track progress & mood trends',
  },
];

export default function SettingsScreen({ navigation }) {
  const { theme, xp, level, streak, tasks, thoughts, habits, clarityScore } =
    useStoreState();
  const dispatch = useStoreDispatch();
  const { user, setTheme } = useAuth();
  const colors = theme.colors;

  const [authVisible, setAuthVisible] = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(false);

  const handleDailyReset = () => {
    triggerMediumImpact();
    dispatch({ type: 'DAILY_RESET' });
  };

  const versionString = '2.0.0';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgMain }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Profile Banner ─────────────────────────────────────────────────── */}
      <View
        style={[
          styles.profileCard,
          { backgroundColor: colors.bgCard, borderColor: colors.borderColor },
        ]}
      >
        <View style={styles.profileLeft}>
          <View
            style={[
              styles.avatarCircle,
              {
                backgroundColor: 'rgba(99,102,241,0.2)',
                borderColor: colors.primaryViolet,
              },
            ]}
          >
            <Ionicons
              name={user ? 'person' : 'person-outline'}
              size={28}
              color={colors.primaryViolet}
            />
          </View>
          <View>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>
              {user ? user.email.split('@')[0] : 'MicroMind User'}
            </Text>
            <Text
              style={[styles.profileEmail, { color: colors.textSecondary }]}
            >
              {user ? user.email : 'Sign in to sync across devices'}
            </Text>
          </View>
        </View>
        <Pressable
          style={[styles.authBtn, { borderColor: colors.primaryViolet }]}
          onPress={() => {
            triggerLightImpact();
            setAuthVisible(true);
          }}
        >
          <Text style={[styles.authBtnText, { color: colors.primaryViolet }]}>
            {user ? 'Account' : 'Sign In'}
          </Text>
        </Pressable>
      </View>

      {/* ── Stats Strip ────────────────────────────────────────────────────── */}
      <View style={styles.statsStrip}>
        {[
          { label: 'Streak', value: `🔥 ${streak}d`, color: '#F59E0B' },
          { label: 'Level', value: `⚡ ${level}`, color: colors.primaryViolet },
          { label: 'XP', value: `${xp} XP`, color: '#10B981' },
          { label: 'Clarity', value: `${clarityScore}%`, color: '#EC4899' },
        ].map((s) => (
          <View
            key={s.label}
            style={[
              styles.statBlock,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.borderColor,
              },
            ]}
          >
            <Text style={[styles.statBlockVal, { color: s.color }]}>
              {s.value}
            </Text>
            <Text
              style={[styles.statBlockLabel, { color: colors.textSecondary }]}
            >
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      {/* ── Theme Picker ───────────────────────────────────────────────────── */}
      <SectionHeader label="🎨 Theme" colors={colors} />
      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgCard, borderColor: colors.borderColor },
        ]}
      >
        {THEMES.map((t) => {
          const isActive = t.id === theme.id;
          return (
            <Pressable
              key={t.id}
              style={[
                styles.themeRow,
                {
                  backgroundColor: isActive
                    ? `${colors.primaryViolet}15`
                    : 'transparent',
                  borderColor: isActive ? colors.primaryViolet : 'transparent',
                },
              ]}
              onPress={() => {
                triggerLightImpact();
                setTheme(t.id);
              }}
            >
              <Text style={styles.themeEmoji}>{t.emoji}</Text>
              <View style={styles.themeInfo}>
                <Text style={[styles.themeName, { color: colors.textPrimary }]}>
                  {t.name}
                </Text>
                <Text
                  style={[styles.themeDesc, { color: colors.textSecondary }]}
                >
                  {t.description}
                </Text>
              </View>
              {t.unlockLevel > 0 && level < t.unlockLevel && (
                <View
                  style={[
                    styles.lockBadge,
                    { backgroundColor: 'rgba(255,255,255,0.07)' },
                  ]}
                >
                  <Ionicons
                    name="lock-closed"
                    size={12}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.lockText, { color: colors.textSecondary }]}
                  >
                    Lv{t.unlockLevel}
                  </Text>
                </View>
              )}
              {isActive && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.primaryViolet}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* ── Productivity Tools ─────────────────────────────────────────────── */}
      <SectionHeader label="🛠️ Productivity Tools" colors={colors} />
      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgCard, borderColor: colors.borderColor },
        ]}
      >
        {TOOL_SECTIONS.map((tool, idx) => (
          <Pressable
            key={tool.id}
            style={[
              styles.toolRow,
              idx < TOOL_SECTIONS.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.borderColor,
              },
            ]}
            onPress={() => {
              triggerLightImpact();
              // navigation would go here in a stack navigator
            }}
          >
            <View
              style={[
                styles.toolIconBox,
                { backgroundColor: 'rgba(99,102,241,0.1)' },
              ]}
            >
              <Ionicons
                name={tool.icon}
                size={18}
                color={colors.primaryViolet}
              />
            </View>
            <View style={styles.toolTextBlock}>
              <Text style={[styles.toolLabel, { color: colors.textPrimary }]}>
                {tool.label}
              </Text>
              <Text style={[styles.toolDesc, { color: colors.textSecondary }]}>
                {tool.desc}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textSecondary}
            />
          </Pressable>
        ))}
      </View>

      {/* ── Voice Briefing ─────────────────────────────────────────────────── */}
      <SectionHeader label="🎙️ AI Features" colors={colors} />
      <Pressable
        style={[
          styles.card,
          styles.singleRow,
          { backgroundColor: colors.bgCard, borderColor: colors.borderColor },
        ]}
        onPress={() => {
          triggerLightImpact();
          setVoiceVisible(true);
        }}
      >
        <View
          style={[
            styles.toolIconBox,
            { backgroundColor: 'rgba(245,158,11,0.1)' },
          ]}
        >
          <Ionicons name="volume-medium-outline" size={18} color="#F59E0B" />
        </View>
        <View style={styles.toolTextBlock}>
          <Text style={[styles.toolLabel, { color: colors.textPrimary }]}>
            Daily Voice Briefing
          </Text>
          <Text style={[styles.toolDesc, { color: colors.textSecondary }]}>
            AI reads your priorities aloud
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textSecondary}
        />
      </Pressable>

      {/* ── Data & Reset ───────────────────────────────────────────────────── */}
      <SectionHeader label="⚙️ Data" colors={colors} />
      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgCard, borderColor: colors.borderColor },
        ]}
      >
        <View style={styles.dataRow}>
          <Ionicons
            name="albums-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>
            Tasks stored
          </Text>
          <Text style={[styles.dataVal, { color: colors.textPrimary }]}>
            {tasks.length}
          </Text>
        </View>
        <View
          style={[
            styles.dataRow,
            { borderTopWidth: 1, borderTopColor: colors.borderColor },
          ]}
        >
          <Ionicons
            name="bulb-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>
            Thoughts captured
          </Text>
          <Text style={[styles.dataVal, { color: colors.textPrimary }]}>
            {(thoughts || []).length}
          </Text>
        </View>
        <View
          style={[
            styles.dataRow,
            { borderTopWidth: 1, borderTopColor: colors.borderColor },
          ]}
        >
          <Ionicons
            name="leaf-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>
            Habits tracked
          </Text>
          <Text style={[styles.dataVal, { color: colors.textPrimary }]}>
            {habits.length}
          </Text>
        </View>
      </View>

      <Pressable
        style={[styles.resetButton, { borderColor: '#ef4444' }]}
        onPress={handleDailyReset}
      >
        <Ionicons name="refresh-circle-outline" size={18} color="#ef4444" />
        <Text style={styles.resetText}>Trigger Daily Reset</Text>
      </Pressable>

      {/* ── App Info ───────────────────────────────────────────────────────── */}
      <View style={styles.appInfo}>
        <Text style={[styles.appInfoText, { color: colors.textSecondary }]}>
          MicroMind v{versionString} · Built with ❤️ using Expo
        </Text>
      </View>

      <AuthModal visible={authVisible} onClose={() => setAuthVisible(false)} />
      <VoiceBriefingModal
        visible={voiceVisible}
        onClose={() => setVoiceVisible(false)}
      />
    </ScrollView>
  );
}

function SectionHeader({ label, colors }) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  profileLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { fontSize: 16, fontWeight: '800' },
  profileEmail: { fontSize: 12, marginTop: 1 },
  authBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  authBtnText: { fontSize: 13, fontWeight: '700' },

  // Stats strip
  statsStrip: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  statBlockVal: { fontSize: 15, fontWeight: '800' },
  statBlockLabel: { fontSize: 10, marginTop: 2 },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  singleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    marginBottom: 20,
  },

  // Theme rows
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    margin: 4,
  },
  themeEmoji: { fontSize: 24 },
  themeInfo: { flex: 1 },
  themeName: { fontSize: 14, fontWeight: '700' },
  themeDesc: { fontSize: 11, marginTop: 1 },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lockText: { fontSize: 10, fontWeight: '700' },

  // Tool rows
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  toolIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTextBlock: { flex: 1 },
  toolLabel: { fontSize: 14, fontWeight: '700' },
  toolDesc: { fontSize: 11, marginTop: 1 },

  // Data rows
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  dataLabel: { flex: 1, fontSize: 13 },
  dataVal: { fontSize: 14, fontWeight: '700' },

  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    marginBottom: 24,
  },
  resetText: { color: '#ef4444', fontSize: 14, fontWeight: '700' },

  appInfo: { alignItems: 'center', paddingBottom: 8 },
  appInfoText: { fontSize: 12 },
});

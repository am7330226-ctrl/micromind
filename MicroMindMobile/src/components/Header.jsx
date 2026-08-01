import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useStoreState, useAuth } from '../store/StoreContext';
import { Ionicons } from '@expo/vector-icons';
import ThemeSelectorModal from './ThemeSelectorModal';
import AuthModal from './AuthModal';
import VoiceBriefingModal from './VoiceBriefingModal';
import { triggerLightImpact } from '../services/haptics';

export default function Header() {
  const { streak, xp, level, theme } = useStoreState();
  const { user } = useAuth();

  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  const colors = theme.colors;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgHeader, borderColor: colors.borderColor }]}>
      <View style={styles.leftSection}>
        <Text style={[styles.appTitle, { color: colors.textPrimary }]}>🧠 MicroMind</Text>
        <Pressable
          style={[styles.badgePill, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}
          onPress={() => {
            triggerLightImpact();
            setVoiceModalVisible(true);
          }}
        >
          <Ionicons name="volume-medium" size={14} color="#eab308" />
          <Text style={styles.badgeText}>Briefing</Text>
        </Pressable>
      </View>

      <View style={styles.rightSection}>
        {/* Streak */}
        <View style={[styles.statPill, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
          <Text style={{ fontSize: 13 }}>🔥</Text>
          <Text style={[styles.statText, { color: '#f97316' }]}>{streak}d</Text>
        </View>

        {/* Level & XP */}
        <View style={[styles.statPill, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
          <Text style={{ fontSize: 13 }}>⚡</Text>
          <Text style={[styles.statText, { color: colors.primaryViolet }]}>Lvl {level}</Text>
        </View>

        {/* Theme Selector */}
        <Pressable
          style={[styles.iconButton, { backgroundColor: colors.bgCard, borderColor: colors.borderColor }]}
          onPress={() => {
            triggerLightImpact();
            setThemeModalVisible(true);
          }}
        >
          <Text style={{ fontSize: 16 }}>{theme.emoji}</Text>
        </Pressable>

        {/* Auth Button */}
        <Pressable
          style={[
            styles.iconButton,
            { backgroundColor: user ? 'rgba(34, 197, 94, 0.15)' : colors.bgCard, borderColor: colors.borderColor },
          ]}
          onPress={() => {
            triggerLightImpact();
            setAuthModalVisible(true);
          }}
        >
          <Ionicons name={user ? 'person-circle' : 'person-outline'} size={18} color={user ? '#22c55e' : colors.textSecondary} />
        </Pressable>
      </View>

      <ThemeSelectorModal visible={themeModalVisible} onClose={() => setThemeModalVisible(false)} />
      <AuthModal visible={authModalVisible} onClose={() => setAuthModalVisible(false)} />
      <VoiceBriefingModal visible={voiceModalVisible} onClose={() => setVoiceModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#eab308',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statText: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

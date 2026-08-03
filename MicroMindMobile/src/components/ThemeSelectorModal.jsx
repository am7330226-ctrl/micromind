import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useStoreState, useAuth } from '../store/StoreContext';
import { THEMES } from '../theme/themes';
import { Ionicons } from '@expo/vector-icons';
import { triggerLightImpact } from '../services/haptics';

export default function ThemeSelectorModal({ visible, onClose }) {
  const { activeThemeId, level, theme } = useStoreState();
  const { setTheme } = useAuth();
  const colors = theme.colors;

  const handleSelectTheme = (selectedTheme) => {
    if (level < selectedTheme.unlockLevel) return;
    triggerLightImpact();
    setTheme(selectedTheme.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.bgSidebar,
              borderColor: colors.borderColor,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              🎨 Select Theme
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.themeList}
            showsVerticalScrollIndicator={false}
          >
            {THEMES.map((t) => {
              const isUnlocked = level >= t.unlockLevel;
              const isActive = activeThemeId === t.id;

              return (
                <Pressable
                  key={t.id}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: isActive
                        ? 'rgba(168, 85, 247, 0.2)'
                        : colors.bgCard,
                      borderColor: isActive
                        ? colors.primaryViolet
                        : colors.borderColor,
                      opacity: isUnlocked ? 1 : 0.5,
                    },
                  ]}
                  onPress={() => handleSelectTheme(t)}
                  disabled={!isUnlocked}
                >
                  <Text style={{ fontSize: 24 }}>{t.emoji}</Text>
                  <View style={styles.themeInfo}>
                    <Text
                      style={[styles.themeName, { color: colors.textPrimary }]}
                    >
                      {t.name}
                    </Text>
                    <Text
                      style={[
                        styles.themeDesc,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t.description}
                    </Text>
                  </View>

                  {!isUnlocked ? (
                    <View style={styles.lockBadge}>
                      <Ionicons name="lock-closed" size={12} color="#eab308" />
                      <Text style={styles.lockText}>Lvl {t.unlockLevel}</Text>
                    </View>
                  ) : isActive ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primaryViolet}
                    />
                  ) : null}
                </Pressable>
              );
            })}
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
    height: '60%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  themeList: {
    flex: 1,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '700',
  },
  themeDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  lockText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#eab308',
  },
});

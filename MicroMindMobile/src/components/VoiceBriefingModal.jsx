import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import { useStoreState } from '../store/StoreContext';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { triggerMediumImpact, triggerLightImpact } from '../services/haptics';

export default function VoiceBriefingModal({ visible, onClose }) {
  const { tasks, streak, level, theme } = useStoreState();
  const colors = theme.colors;

  const [isSpeaking, setIsSpeaking] = useState(false);

  const pendingCount = tasks.filter(t => !t.completed).length;
  const q1Tasks = tasks.filter(t => t.category === 'q1' && !t.completed);

  const script = `Good morning! Welcome to MicroMind. You have a ${streak}-day streak and are currently Level ${level}. Today you have ${pendingCount} pending tasks, including ${q1Tasks.length} high priority Q1 items. Focus on your top goals and make today count!`;

  const handleSpeak = () => {
    triggerMediumImpact();
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      Speech.speak(script, {
        language: 'en',
        pitch: 1.0,
        rate: 0.95,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const handleClose = () => {
    Speech.stop();
    setIsSpeaking(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.bgSidebar, borderColor: colors.borderColor }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>🎙️ Daily Audio Briefing</Text>
            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={[styles.scriptText, { color: colors.textPrimary }]}>{script}</Text>

          <Pressable style={[styles.speakButton, { backgroundColor: colors.primaryViolet }]} onPress={handleSpeak}>
            <Ionicons name={isSpeaking ? 'pause-circle' : 'volume-high'} size={24} color="#ffffff" />
            <Text style={styles.speakButtonText}>{isSpeaking ? 'Stop Briefing' : 'Play Voice Briefing'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
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
  scriptText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  speakButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

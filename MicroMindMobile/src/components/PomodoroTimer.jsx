import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useStoreState, useStoreDispatch } from '../store/StoreContext';
import { toggleAmbientSound } from '../services/soundEngine';
import { Ionicons } from '@expo/vector-icons';
import { triggerMediumImpact, triggerLightImpact } from '../services/haptics';

const TIMER_PRESETS = [
  { label: 'Pomodoro', minutes: 25 },
  { label: 'Short Break', minutes: 5 },
  { label: 'Long Break', minutes: 15 },
];

const SOUND_TRACKS = [
  { id: 'rain', label: 'Rain', emoji: '🌧️' },
  { id: 'waves', label: 'Ocean Waves', emoji: '🌊' },
  { id: 'forest', label: 'Forest Birds', emoji: '🌲' },
  { id: 'whiteNoise', label: 'White Noise', emoji: '📻' },
];

export default function PomodoroTimer() {
  const { pomodoroSessions, theme } = useStoreState();
  const dispatch = useStoreDispatch();
  const colors = theme.colors;

  const [selectedPreset, setSelectedPreset] = useState(TIMER_PRESETS[0]);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [activeSoundTrack, setActiveSoundTrack] = useState(null);

  useEffect(() => {
    let timer = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      triggerMediumImpact();
      if (selectedPreset.label === 'Pomodoro') {
        dispatch({
          type: 'SET_POMODORO_SESSIONS',
          sessions: (pomodoroSessions || 0) + 1,
        });
      }
    }
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, timeLeft]);

  const handleSelectPreset = (preset) => {
    triggerLightImpact();
    setSelectedPreset(preset);
    setTimeLeft(preset.minutes * 60);
    setIsRunning(false);
  };

  const handleStartPause = () => {
    triggerMediumImpact();
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    triggerLightImpact();
    setIsRunning(false);
    setTimeLeft(selectedPreset.minutes * 60);
  };

  const handleToggleSound = async (trackId) => {
    triggerLightImpact();
    const playing = await toggleAmbientSound(trackId);
    setActiveSoundTrack(playing ? trackId : null);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Timer Presets */}
      <View style={styles.presetRow}>
        {TIMER_PRESETS.map((preset) => (
          <Pressable
            key={preset.label}
            style={[
              styles.presetChip,
              {
                backgroundColor:
                  selectedPreset.label === preset.label
                    ? colors.primaryViolet
                    : colors.bgCard,
                borderColor:
                  selectedPreset.label === preset.label
                    ? colors.primaryViolet
                    : colors.borderColor,
              },
            ]}
            onPress={() => handleSelectPreset(preset)}
          >
            <Text
              style={[
                styles.presetChipText,
                {
                  color:
                    selectedPreset.label === preset.label
                      ? '#ffffff'
                      : colors.textSecondary,
                },
              ]}
            >
              {preset.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Main Timer Display Card */}
      <View
        style={[
          styles.timerCard,
          { backgroundColor: colors.bgCard, borderColor: colors.borderColor },
        ]}
      >
        <Text style={[styles.timerDisplay, { color: colors.textPrimary }]}>
          {formattedTime}
        </Text>
        <Text style={[styles.sessionText, { color: colors.textSecondary }]}>
          Sessions completed today: {pomodoroSessions || 0}
        </Text>

        {/* Timer Control Buttons */}
        <View style={styles.controlsRow}>
          <Pressable
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primaryViolet },
            ]}
            onPress={handleStartPause}
          >
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={24}
              color="#ffffff"
            />
            <Text style={styles.buttonText}>
              {isRunning ? 'Pause' : 'Start Focus'}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.secondaryButton,
              { backgroundColor: 'rgba(255,255,255,0.08)' },
            ]}
            onPress={handleReset}
          >
            <Ionicons name="refresh" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Ambient Sound Player */}
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.textSecondary, marginTop: 16 },
        ]}
      >
        🎧 Ambient Focus Sounds
      </Text>

      <View style={styles.soundGrid}>
        {SOUND_TRACKS.map((track) => {
          const isActive = activeSoundTrack === track.id;

          return (
            <Pressable
              key={track.id}
              style={[
                styles.soundCard,
                {
                  backgroundColor: isActive
                    ? 'rgba(168, 85, 247, 0.2)'
                    : colors.bgCard,
                  borderColor: isActive
                    ? colors.primaryViolet
                    : colors.borderColor,
                },
              ]}
              onPress={() => handleToggleSound(track.id)}
            >
              <Text style={styles.soundEmoji}>{track.emoji}</Text>
              <Text
                style={[
                  styles.soundLabel,
                  {
                    color: isActive ? colors.primaryViolet : colors.textPrimary,
                  },
                ]}
              >
                {track.label}
              </Text>
              <Ionicons
                name={isActive ? 'volume-high' : 'play-circle-outline'}
                size={18}
                color={isActive ? colors.primaryViolet : colors.textSecondary}
              />
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timerCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  timerDisplay: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 4,
  },
  sessionText: {
    fontSize: 12,
    marginBottom: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  soundGrid: {
    gap: 8,
  },
  soundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  soundEmoji: {
    fontSize: 20,
  },
  soundLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
});

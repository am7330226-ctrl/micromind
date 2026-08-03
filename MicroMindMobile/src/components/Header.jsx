import { View, Text, StyleSheet } from 'react-native';
import { useStoreState } from '../store/StoreContext';

export default function Header() {
  const { streak, level, theme, clarityScore } = useStoreState();
  const colors = theme.colors;

  const gaugeColor =
    clarityScore >= 70
      ? colors.accentEmerald
      : clarityScore >= 40
        ? colors.accentAmber
        : '#ef4444';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.bgHeader, borderColor: colors.borderColor },
      ]}
    >
      {/* ── Left: Logo + pills ─────────────────────────────────────────────── */}
      <View style={styles.leftSection}>
        <Text style={[styles.appTitle, { color: colors.textPrimary }]}>
          🧠 MicroMind
        </Text>

        <View
          style={[styles.pill, { backgroundColor: 'rgba(249,115,22,0.15)' }]}
        >
          <Text style={styles.pillEmoji}>🔥</Text>
          <Text style={[styles.pillText, { color: '#f97316' }]}>{streak}d</Text>
        </View>

        <View
          style={[styles.pill, { backgroundColor: 'rgba(99,102,241,0.15)' }]}
        >
          <Text style={styles.pillEmoji}>⚡</Text>
          <Text style={[styles.pillText, { color: colors.primaryViolet }]}>
            Lv {level}
          </Text>
        </View>
      </View>

      {/* ── Right: Clarity Score Gauge ─────────────────────────────────────── */}
      <View style={styles.claritySection}>
        <Text style={[styles.clarityLabel, { color: colors.textSecondary }]}>
          Clarity
        </Text>
        <View style={styles.clarityRow}>
          <View
            style={[
              styles.gaugeTrack,
              { backgroundColor: 'rgba(255,255,255,0.10)' },
            ]}
          >
            <View
              style={[
                styles.gaugeFill,
                { width: `${clarityScore}%`, backgroundColor: gaugeColor },
              ]}
            />
          </View>
          <Text style={[styles.clarityNum, { color: gaugeColor }]}>
            {clarityScore}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  appTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginRight: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pillEmoji: { fontSize: 12 },
  pillText: { fontSize: 12, fontWeight: '800' },

  // Clarity gauge
  claritySection: { alignItems: 'flex-end', gap: 2 },
  clarityLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  clarityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gaugeTrack: {
    width: 80,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 3,
  },
  clarityNum: {
    fontSize: 13,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'right',
  },
});

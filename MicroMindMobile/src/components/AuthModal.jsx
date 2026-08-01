import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useStoreState, useAuth } from '../store/StoreContext';
import { supabase } from '../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { triggerLightImpact, triggerMediumImpact } from '../services/haptics';

export default function AuthModal({ visible, onClose }) {
  const { theme } = useStoreState();
  const { user, setUser } = useAuth();
  const colors = theme.colors;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAuthSubmit = async () => {
    if (!email || !password) return;

    setLoading(true);
    setErrorMessage('');
    triggerMediumImpact();

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) setUser(data.user);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) setUser(data.user);
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    triggerLightImpact();
    await supabase.auth.signOut();
    setUser(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.bgSidebar, borderColor: colors.borderColor }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {user ? '👤 Account Settings' : isSignUp ? 'Create MicroMind Account' : 'Sign In to MicroMind'}
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {user ? (
            <View style={styles.userSection}>
              <Text style={[styles.userEmailText, { color: colors.textPrimary }]}>Signed in as:</Text>
              <Text style={[styles.userEmail, { color: colors.primaryViolet }]}>{user.email}</Text>

              <Pressable style={styles.signOutButton} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                <Text style={styles.signOutText}>Sign Out</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.form}>
              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgCard, borderColor: colors.borderColor, color: colors.textPrimary }]}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgCard, borderColor: colors.borderColor, color: colors.textPrimary }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <Pressable style={[styles.submitBtn, { backgroundColor: colors.primaryViolet }]} onPress={handleAuthSubmit} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
                )}
              </Pressable>

              <Pressable onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleAuth}>
                <Text style={[styles.toggleAuthText, { color: colors.textSecondary }]}>
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </Text>
              </Pressable>
            </View>
          )}
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
  card: {
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
  userSection: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  userEmailText: {
    fontSize: 13,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  form: {
    gap: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  submitBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  toggleAuth: {
    alignItems: 'center',
    marginTop: 8,
  },
  toggleAuthText: {
    fontSize: 12,
  },
});

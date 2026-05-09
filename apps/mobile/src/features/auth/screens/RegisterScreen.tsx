// ─── Register Screen ──────────────────────────────────────
//
// Email/password registration.
// Dark UI, minimal design.
//

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthInput, AuthButton, ErrorBanner } from '../components';
import { useAuthStore, selectAuthLoading, selectAuthError } from '../../../store';
import { AUTH_COLORS, AUTH_SPACING, AUTH_TYPOGRAPHY } from '../theme';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

export function RegisterScreen({ onNavigateToLogin }: RegisterScreenProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const register = useAuthStore((s) => s.registerWithEmail);
  const clearError = useAuthStore((s) => s.clearError);
  const isLoading = useAuthStore(selectAuthLoading);
  const storeError = useAuthStore(selectAuthError);

  const error = localError || storeError;

  const isFormValid =
    displayName.trim().length >= 2 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    confirmPassword.length >= 6;

  const handleRegister = useCallback(async () => {
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    try {
      await register(email.trim(), password, displayName.trim());
    } catch {
      // Error is set in store
    }
  }, [displayName, email, password, confirmPassword, register]);

  const handleDismissError = () => {
    setLocalError(null);
    clearError();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>AURA</Text>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            Start your personal intelligence journey
          </Text>
        </View>

        {/* Error */}
        <ErrorBanner message={error} onDismiss={handleDismissError} />

        {/* Form */}
        <View style={styles.form}>
          <AuthInput
            label="Display Name"
            placeholder="What should we call you?"
            value={displayName}
            onChangeText={setDisplayName}
            autoComplete="name"
          />

          <AuthInput
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoComplete="email"
          />

          <AuthInput
            label="Password"
            placeholder="At least 6 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoComplete="new-password"
          />

          <AuthInput
            label="Confirm Password"
            placeholder="Re-enter your password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoComplete="new-password"
          />

          <AuthButton
            title="Create Account"
            onPress={handleRegister}
            isLoading={isLoading}
            disabled={!isFormValid}
            style={styles.registerButton}
          />
        </View>

        {/* Login Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={onNavigateToLogin}>
            <Text style={styles.footerLink}> Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: AUTH_SPACING.lg,
    paddingVertical: AUTH_SPACING.xxl,
  },
  header: {
    marginBottom: AUTH_SPACING.xl,
  },
  brand: {
    fontSize: 14,
    fontWeight: '800',
    color: AUTH_COLORS.primary,
    letterSpacing: 6,
    marginBottom: AUTH_SPACING.md,
  },
  title: {
    ...AUTH_TYPOGRAPHY.h1,
    color: AUTH_COLORS.text,
    marginBottom: AUTH_SPACING.sm,
  },
  subtitle: {
    ...AUTH_TYPOGRAPHY.body,
    color: AUTH_COLORS.textSecondary,
  },
  form: {
    marginBottom: AUTH_SPACING.xl,
  },
  registerButton: {
    marginTop: AUTH_SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...AUTH_TYPOGRAPHY.caption,
    color: AUTH_COLORS.textSecondary,
  },
  footerLink: {
    ...AUTH_TYPOGRAPHY.caption,
    color: AUTH_COLORS.primary,
    fontWeight: '600',
  },
});

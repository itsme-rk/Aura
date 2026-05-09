// ─── Login Screen ─────────────────────────────────────────
//
// Email/password login + Google sign-in.
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
import { AUTH_COLORS, AUTH_SPACING, AUTH_RADIUS, AUTH_TYPOGRAPHY } from '../theme';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

export function LoginScreen({ onNavigateToRegister }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useAuthStore((s) => s.loginWithEmail);
  const clearError = useAuthStore((s) => s.clearError);
  const isLoading = useAuthStore(selectAuthLoading);
  const error = useAuthStore(selectAuthError);

  const isFormValid = email.trim().length > 0 && password.length >= 6;

  const handleLogin = useCallback(async () => {
    if (!isFormValid) return;
    try {
      await login(email.trim(), password);
    } catch {
      // Error is set in store
    }
  }, [email, password, isFormValid, login]);

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
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in to your personal intelligence OS
          </Text>
        </View>

        {/* Error */}
        <ErrorBanner message={error} onDismiss={clearError} />

        {/* Form */}
        <View style={styles.form}>
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
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoComplete="password"
          />

          <AuthButton
            title="Sign In"
            onPress={handleLogin}
            isLoading={isLoading}
            disabled={!isFormValid}
            style={styles.loginButton}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google (placeholder — requires expo-auth-session setup) */}
        <AuthButton
          title="Continue with Google"
          onPress={() => {
            // TODO: Integrate expo-auth-session for Google Sign-In
            // The loginWithGoogle(idToken) action is ready in the store
          }}
          variant="outline"
          style={styles.googleButton}
        />

        {/* Register Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={onNavigateToRegister}>
            <Text style={styles.footerLink}> Create one</Text>
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
    marginBottom: AUTH_SPACING.lg,
  },
  loginButton: {
    marginTop: AUTH_SPACING.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AUTH_SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AUTH_COLORS.divider,
  },
  dividerText: {
    ...AUTH_TYPOGRAPHY.small,
    color: AUTH_COLORS.textMuted,
    marginHorizontal: AUTH_SPACING.md,
  },
  googleButton: {
    marginBottom: AUTH_SPACING.xl,
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

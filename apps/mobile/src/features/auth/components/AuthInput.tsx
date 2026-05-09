// ─── AuthInput Component ──────────────────────────────────
//
// Reusable dark-themed text input for auth screens.
//

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { AUTH_COLORS, AUTH_SPACING, AUTH_RADIUS, AUTH_TYPOGRAPHY } from '../theme';

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function AuthInput({
  label,
  error,
  icon,
  rightIcon,
  containerStyle,
  secureTextEntry,
  ...rest
}: AuthInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = secureTextEntry !== undefined;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        {icon && <View style={styles.iconLeft}>{icon}</View>}
        <TextInput
          style={[styles.input, icon && styles.inputWithIcon]}
          placeholderTextColor={AUTH_COLORS.textPlaceholder}
          selectionColor={AUTH_COLORS.primary}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword ? !isPasswordVisible : false}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.togglePassword}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.toggleText}>
              {isPasswordVisible ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: AUTH_SPACING.md,
  },
  label: {
    ...AUTH_TYPOGRAPHY.caption,
    color: AUTH_COLORS.textSecondary,
    marginBottom: AUTH_SPACING.xs,
    marginLeft: AUTH_SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AUTH_COLORS.surface,
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
    borderRadius: AUTH_RADIUS.md,
    paddingHorizontal: AUTH_SPACING.md,
    height: 52,
  },
  inputFocused: {
    borderColor: AUTH_COLORS.borderFocus,
    backgroundColor: AUTH_COLORS.surfaceLight,
  },
  inputError: {
    borderColor: AUTH_COLORS.error,
    backgroundColor: AUTH_COLORS.errorBackground,
  },
  input: {
    flex: 1,
    ...AUTH_TYPOGRAPHY.body,
    color: AUTH_COLORS.text,
    height: '100%',
  },
  inputWithIcon: {
    marginLeft: AUTH_SPACING.sm,
  },
  iconLeft: {
    marginRight: AUTH_SPACING.xs,
  },
  iconRight: {
    marginLeft: AUTH_SPACING.sm,
  },
  togglePassword: {
    paddingLeft: AUTH_SPACING.sm,
  },
  toggleText: {
    ...AUTH_TYPOGRAPHY.small,
    color: AUTH_COLORS.primary,
    fontWeight: '600',
  },
  errorText: {
    ...AUTH_TYPOGRAPHY.small,
    color: AUTH_COLORS.error,
    marginTop: AUTH_SPACING.xs,
    marginLeft: AUTH_SPACING.xs,
  },
});

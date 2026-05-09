// ─── AuthButton Component ─────────────────────────────────
//
// Reusable dark-themed button for auth screens.
//

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { AUTH_COLORS, AUTH_SPACING, AUTH_RADIUS, AUTH_TYPOGRAPHY } from '../theme';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function AuthButton({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
  icon,
}: AuthButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost'
            ? AUTH_COLORS.primary
            : AUTH_COLORS.white}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              styles[`${variant}Text` as keyof typeof styles],
              icon && { marginLeft: AUTH_SPACING.sm },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: AUTH_RADIUS.md,
    paddingHorizontal: AUTH_SPACING.lg,
  },
  primary: {
    backgroundColor: AUTH_COLORS.primary,
  },
  secondary: {
    backgroundColor: AUTH_COLORS.surfaceLight,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...AUTH_TYPOGRAPHY.bodyBold,
  },
  primaryText: {
    color: AUTH_COLORS.white,
  },
  secondaryText: {
    color: AUTH_COLORS.text,
  },
  outlineText: {
    color: AUTH_COLORS.primary,
  },
  ghostText: {
    color: AUTH_COLORS.primary,
  },
});

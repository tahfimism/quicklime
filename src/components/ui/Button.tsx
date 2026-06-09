import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  useColorScheme,
} from 'react-native';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Typography } from './Typography';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'text';
  loading?: boolean;
  children: string; // The button label
  textStyle?: TextStyle;
  style?: ViewStyle;
}

/**
 * Standard button component conforming to the Swiss Editorial design system.
 * Maintain 50pt height, 12pt radius, and explicit active/disabled styling.
 */
export function Button({
  variant = 'primary',
  loading = false,
  disabled = false,
  children,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const scheme = useColorScheme();
  const activeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isText = variant === 'text';

  // Base button styles
  const buttonStyles: ViewStyle[] = [styles.button];
  const labelStyles: TextStyle[] = [];

  if (isPrimary) {
    buttonStyles.push({
      backgroundColor: activeColors.onBackground, // Primary button has inverted text/bg
    });
    labelStyles.push({
      color: activeColors.background,
    });
  } else if (isSecondary) {
    buttonStyles.push({
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: activeColors.line,
    });
    labelStyles.push({
      color: activeColors.onBackground,
    });
  } else if (isText) {
    buttonStyles.push(styles.textButton);
    labelStyles.push({
      color: activeColors.primary,
    });
  }

  // Handle disabled state
  if (disabled || loading) {
    if (isPrimary) {
      buttonStyles.push({ backgroundColor: activeColors.line });
      labelStyles.push({ color: activeColors.textTertiary });
    } else if (isSecondary) {
      buttonStyles.push({ borderColor: activeColors.line });
      labelStyles.push({ color: activeColors.textTertiary });
    } else if (isText) {
      labelStyles.push({ color: activeColors.textTertiary });
    }
  }

  return (
    <TouchableOpacity
      activeOpacity={isText ? 0.7 : 0.8}
      disabled={disabled || loading}
      style={[buttonStyles, style]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={isPrimary ? activeColors.background : activeColors.primary}
          size="small"
        />
      ) : (
        <Typography
          variant="bodyMd"
          style={[styles.label, labelStyles, textStyle]}
        >
          {children}
        </Typography>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: Spacing.buttonHeight,
    borderRadius: Radii.md, // 12pt radius
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  textButton: {
    width: 'auto',
    height: 'auto',
    backgroundColor: 'transparent',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
export default Button;

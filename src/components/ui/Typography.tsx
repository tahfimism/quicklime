import React from 'react';
import { Text, TextProps, StyleSheet, useColorScheme } from 'react-native';
import { TypographyVariants, TypographyVariant, Colors } from '@/constants/theme';

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
}

/**
 * Reusable typography component conforming to the Swiss Editorial design guidelines.
 * Maps standard labels like 'displayWordmark', 'headlineLg', etc. to correct fonts and sizes.
 */
export function Typography({
  variant = 'bodyMd',
  color,
  style,
  ...props
}: TypographyProps) {
  const scheme = useColorScheme();
  const activeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  
  const variantStyle = TypographyVariants[variant];
  
  // Assign default colors based on typography role
  let defaultColor: string = activeColors.onBackground;
  if (
    variant === 'sectionHeader' || 
    variant === 'labelMd' || 
    variant === 'caption' ||
    variant === 'dataMono' ||
    variant === 'codeMono'
  ) {
    defaultColor = activeColors.secondary;
  }

  return (
    <Text
      style={[
        styles.base,
        variantStyle,
        { color: color || defaultColor },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontStyle: 'normal',
  },
});
export default Typography;

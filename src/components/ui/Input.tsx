import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
  useColorScheme,
  Animated,
  Platform,
} from 'react-native';
import { Colors, Spacing, Radii } from '@/constants/theme';
import { Typography } from './Typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

/**
 * Standard TextInput component conforming to the Swiss Editorial design system.
 * Maintain 50pt height, 10pt radius, static labels above, and error displays below.
 */
export function Input({
  label,
  error,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const scheme = useColorScheme();
  const activeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [focused, setFocused] = useState(false);

  const handleFocus = (e: any) => {
    setFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Typography variant="labelMd" style={styles.label}>
          {label}
        </Typography>
      )}
      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: activeColors.surface,
            borderColor: error
              ? activeColors.destructive
              : focused
              ? activeColors.primaryContainer
              : activeColors.line,
            borderWidth: error || focused ? 1.5 : 1,
            color: activeColors.onBackground,
          },
          inputStyle,
        ]}
        placeholderTextColor={activeColors.textTertiary}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      {error && (
        <Typography
          variant="caption"
          style={[styles.errorText, { color: activeColors.destructive }]}
        >
          {error}
        </Typography>
      )}
    </View>
  );
}

interface InviteCodeInputProps {
  value: string;
  onChangeText: (code: string) => void;
  error?: boolean;
}

/**
 * 6-digit segmented invite code input box.
 * Automatically manages input focus shifting and triggers shake animations on errors.
 */
export function InviteCodeInput({
  value,
  onChangeText,
  error = false,
}: InviteCodeInputProps) {
  const scheme = useColorScheme();
  const activeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const inputsRef = useRef<(TextInput | null)[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Initialize values list from code string
  const codeArray = value.padEnd(6, ' ').slice(0, 6).split('');

  useEffect(() => {
    if (error) {
      // Trigger horizontal shake animation: 3 cycles, 300ms
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace') {
      const nextCode = value.substring(0, value.length - 1);
      onChangeText(nextCode);
      // Auto-tab back
      if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handleTextChange = (index: number, text: string) => {
    // Standard char input
    const cleanText = text.trim().slice(-1);
    if (!cleanText) return;

    const codeChars = [...codeArray];
    codeChars[index] = cleanText;
    const finalCode = codeChars.join('').trim();
    onChangeText(finalCode);

    // Auto-tab forward
    if (index < 5 && cleanText) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  return (
    <Animated.View
      style={[
        styles.inviteCodeContainer,
        { transform: [{ translateX: shakeAnimation }] },
      ]}
    >
      {Array.from({ length: 6 }).map((_, index) => {
        const val = codeArray[index].trim();
        return (
          <TextInput
            key={index}
            ref={(el) => (inputsRef.current[index] = el)}
            style={[
              styles.inviteCodeBox,
              {
                backgroundColor: activeColors.surface,
                borderColor: error
                  ? activeColors.destructive
                  : activeColors.line,
                color: activeColors.onBackground,
              },
            ]}
            keyboardType="default"
            maxLength={2} // Allow placeholder/auto-fills
            value={val}
            selectTextOnFocus
            onChangeText={(text) => handleTextChange(index, text)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
            // Auto focus first item on mount in mobile
            autoFocus={index === 0 && Platform.OS !== 'web'}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  textInput: {
    height: Spacing.buttonHeight,
    borderRadius: 10, // 10pt radius
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    fontFamily: 'InstrumentSans_400Regular',
  },
  errorText: {
    marginTop: Spacing.xs,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.xs,
  },
  inviteCodeBox: {
    width: 46,
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'InstrumentSans_600SemiBold',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
});

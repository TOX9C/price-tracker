import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import Icon from 'react-native-vector-icons/Ionicons';

interface OfflineBannerProps {
  visible?: boolean;
}

export function OfflineBanner({ visible = true }: OfflineBannerProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Icon name="cloud-offline-outline" size={16} color={colors.warning} />
      <Text style={styles.text}>Offline - showing cached data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warning + '20',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.warning,
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.xs,
  },
});

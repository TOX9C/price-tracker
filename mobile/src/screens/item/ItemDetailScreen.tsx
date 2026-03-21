import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useItem, useDeleteItem, useCheckPrice } from '@/hooks/useItems';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { formatCurrency, formatRelativeTime } from '@/utils/formatting';

type ItemDetailParams = {
  ItemDetail: { id: string };
};

export function ItemDetailScreen() {
  const route = useRoute<RouteProp<ItemDetailParams, 'ItemDetail'>>();
  const navigation = useNavigation();
  const { id } = route.params;

  const { data: item, isLoading, error } = useItem(id);
  const deleteItem = useDeleteItem();
  const checkPrice = useCheckPrice(id);

  const handleCheckPrice = () => {
    checkPrice.mutate(undefined, {
      onSuccess: () => {
        Alert.alert('Success', 'Price check initiated');
      },
      onError: (error) => {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to check price');
      },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteItem.mutate(id, {
              onSuccess: () => {
                navigation.goBack();
              },
            });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.error}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <Text style={styles.errorText}>Failed to load item</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Image */}
      {item.image_url ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="contain" />
        </View>
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderIcon}>📦</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Name */}
        <Text style={styles.name}>{item.name}</Text>

        {/* Best Price Card */}
        {item.best_price && (
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Best Price</Text>
            <Text style={styles.priceValue}>{formatCurrency(item.best_price)}</Text>
            {item.best_store && (
              <View style={styles.storeBadge}>
                <Text style={styles.storeText}>at {item.best_store}</Text>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.checkButton, checkPrice.isPending && styles.buttonDisabled]}
            onPress={handleCheckPrice}
            disabled={checkPrice.isPending}
            activeOpacity={0.8}
          >
            <Text style={styles.checkButtonText}>
              {checkPrice.isPending ? 'Checking...' : 'Check Price Now'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteButtonText}>Delete Item</Text>
          </TouchableOpacity>
        </View>

        {/* Tracked URLs */}
        <Text style={styles.sectionTitle}>Store Prices ({item.urls.length})</Text>

        {item.urls.map((url) => (
          <View key={url.id} style={styles.urlCard}>
            <View style={styles.urlHeader}>
              <Text style={styles.urlStore}>{url.store_name || 'Unknown Store'}</Text>
              <Text style={styles.urlPrice}>{formatCurrency(url.current_price)}</Text>
            </View>
            <View style={styles.urlMeta}>
              <Text style={styles.urlStatus}>
                {url.availability.replace('_', ' ')}
              </Text>
              <Text style={styles.urlChecked}>
                Checked {formatRelativeTime(url.last_checked)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.error,
    marginBottom: spacing.md,
  },
  backLink: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  imageContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderIcon: {
    fontSize: 64,
  },
  content: {
    padding: spacing.lg,
  },
  name: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  priceCard: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  priceValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.primary,
  },
  storeBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  storeText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  actions: {
    marginBottom: spacing.lg,
  },
  checkButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  checkButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: typography.fontSize.md,
  },
  dangerZone: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: '#fef2f2',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dangerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.error,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  deleteButton: {
    height: 44,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteButtonText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: typography.fontSize.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  urlCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  urlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  urlStore: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  urlPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },
  urlMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  urlStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  urlChecked: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
});

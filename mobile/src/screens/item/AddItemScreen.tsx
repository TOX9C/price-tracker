import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCreateItem } from '@/hooks/useItems';
import { colors, spacing, borderRadius, typography } from '@/theme';

export function AddItemScreen() {
  const navigation = useNavigation();
  const createItem = useCreateItem();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [checking, setChecking] = useState(false);

  const handleCheckUrl = async () => {
    if (!url) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    setChecking(true);
    try {
      // In real implementation, this would call the backend to scrape/validate
      new URL(url);
      Alert.alert('Success', 'URL validated. Add a name and save.');
    } catch {
      Alert.alert('Invalid URL', 'Please enter a valid product URL');
    } finally {
      setChecking(false);
    }
  };

  const handleSave = async () => {
    if (!name || !url) {
      Alert.alert('Error', 'Please provide both a name and URL');
      return;
    }

    try {
      await createItem.mutateAsync({ name, urls: [url] });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add item');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Item</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* URL Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Product URL</Text>
          <Text style={styles.helper}>
            Paste a link from Amazon, Best Buy, Target, or other supported stores
          </Text>
          <TextInput
            style={styles.input}
            placeholder="https://amazon.com/product/..."
            placeholderTextColor={colors.inputPlaceholder}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <TouchableOpacity
            style={[styles.checkButton, checking && styles.checkButtonDisabled]}
            onPress={handleCheckUrl}
            disabled={checking}
            activeOpacity={0.8}
          >
            {checking ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.checkButtonText}>Validate URL</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Name Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Item Name</Text>
          <Text style={styles.helper}>
            Give your item a memorable name
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Sony WH-1000XM5 Headphones"
            placeholderTextColor={colors.inputPlaceholder}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!name || !url || createItem.isPending) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!name || !url || createItem.isPending}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>
            {createItem.isPending ? 'Adding...' : 'Add Item'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSpacer: {
    width: 60,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  helper: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.md,
    backgroundColor: colors.inputBackground,
    color: colors.text,
  },
  checkButton: {
    height: 48,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  checkButtonDisabled: {
    opacity: 0.6,
  },
  checkButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: typography.fontSize.md,
  },
  saveButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonDisabled: {
    backgroundColor: colors.textMuted,
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
});

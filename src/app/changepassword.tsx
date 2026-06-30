import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/settings');
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify old password by attempting to re-authenticate
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('User not found');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (signInError) {
        throw new Error('Incorrect old password');
      }

      // 2. Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      Alert.alert('Success', 'Your password has been changed successfully', [
        { text: 'OK', onPress: handleBack }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Change Password</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Old Password</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                  placeholder="Enter old password"
                  placeholderTextColor={theme.textSecondary}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>New Password</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                  placeholder="Enter new password"
                  placeholderTextColor={theme.textSecondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Confirm New Password</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                  placeholder="Confirm new password"
                  placeholderTextColor={theme.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.brand, opacity: loading ? 0.7 : 1 }]}
                onPress={handleChangePassword}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <ThemedText style={styles.buttonText}>Update Password</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingTop: Spacing.eight,
  },
  form: {
    gap: Spacing.five,
  },
  inputContainer: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: Spacing.one,
  },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: Spacing.four,
    fontSize: 16,
  },
  button: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

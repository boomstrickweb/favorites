import { useRouter, useLocalSearchParams } from 'expo-router';
import { StyleSheet, TouchableOpacity, View, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
// Hashing is now handled at the server level (Supabase) for security and architectural correctness.

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function ConfirmationCodeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!code || !email) {
      Alert.alert('Error', 'Please enter the confirmation code.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup',
      });

      if (error) throw error;

      if (data.user) {
        Alert.alert('Success', 'Account confirmed!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, width: '100%' }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={theme.text} />
              </TouchableOpacity>
              <ThemedText type="subtitle" style={styles.title}>Confirm Email</ThemedText>
              <ThemedText style={styles.subtitle}>
                We've sent a 6-digit code to {email}. Enter it below to confirm your account.
              </ThemedText>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Confirmation Code</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor={theme.textSecondary}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.brand, opacity: loading ? 0.7 : 1 }]}
                onPress={handleConfirm}
                disabled={loading}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.buttonText}>
                  {loading ? 'Verifying...' : 'Confirm'}
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity 
                onPress={async () => {
                  if (!email) {
                    Alert.alert('Error', 'Email is missing.');
                    return;
                  }
                  setLoading(true);
                  try {
                    const { error } = await supabase.auth.resend({
                      type: 'signup',
                      email: email,
                    });
                    if (error) throw error;
                    Alert.alert('Success', 'Verification code resent!');
                  } catch (error: any) {
                    Alert.alert('Error', error.message || 'Failed to resend code');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                <ThemedText style={{ color: theme.brand, fontWeight: '700', opacity: loading ? 0.5 : 1 }}>
                  Resend Code
                </ThemedText>
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
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: {
    marginTop: Spacing.four,
    marginBottom: Spacing.six,
  },
  backButton: {
    marginBottom: Spacing.four,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
  },
  form: {
    gap: Spacing.four,
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
    letterSpacing: 8,
    textAlign: 'center',
  },
  button: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.six,
    marginBottom: Spacing.four,
  },
});

import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

import { generateSecret, encryptSecret, decryptSecret, generateRecoveryCodes, verifyTOTP } from '@/lib/twofactor';

export default function SignInScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempUserData, setTempUserData] = useState<any>(null);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // 1. Sign in to Supabase first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // 2. Check if user has 2FA enabled
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('two_factor_enabled')
          .eq('id', data.user.id)
          .single();
        
        if (profiles?.two_factor_enabled) {
          setTempUserData(data);
          setShow2FA(true);
          setLoading(false);
          return;
        }

        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred during sign in');
    } finally {
      if (!show2FA) setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (twoFactorCode.length < 6) {
      Alert.alert('Error', 'Please enter a valid code');
      return;
    }

    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('two_factor_secret, two_factor_recovery_codes')
        .eq('id', tempUserData.user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Try TOTP code
      const decryptedSecret = decryptSecret(profile.two_factor_secret);
      const isTOTPValid = verifyTOTP(twoFactorCode, decryptedSecret);
      
      // Try Recovery Code
      const isRecoveryValid = profile.two_factor_recovery_codes?.includes(twoFactorCode.toUpperCase());

      if (isTOTPValid || isRecoveryValid) {
        // If recovery code was used, we should ideally remove it, but for now we just allow login
        router.replace('/(tabs)');
      } else {
        // IMPORTANT: If 2FA fails, we must sign out to prevent session bypass
        await supabase.auth.signOut();
        Alert.alert('Error', 'Invalid verification code. Please sign in again.');
        setShow2FA(false);
        setTempUserData(null);
        setTwoFactorCode('');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (show2FA) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => {
                  supabase.auth.signOut();
                  setShow2FA(false);
                  setTempUserData(null);
                  setTwoFactorCode('');
                }} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <ThemedText type="subtitle" style={styles.title}>Two-Factor Authentication</ThemedText>
                <ThemedText style={styles.subtitle}>Enter the code from your authenticator app or a recovery code.</ThemedText>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.label}>Verification Code</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, textAlign: 'center', fontSize: 24, letterSpacing: 4 }]}
                    placeholder="000000"
                    placeholderTextColor={theme.textSecondary}
                    value={twoFactorCode}
                    onChangeText={setTwoFactorCode}
                    keyboardType="default"
                    autoCapitalize="characters"
                    maxLength={10}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: theme.brand, opacity: loading ? 0.7 : 1 }]}
                  onPress={handleVerify2FA}
                  disabled={loading}
                >
                  <ThemedText style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify'}</ThemedText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ThemedView>
    );
  }

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
              <ThemedText type="subtitle" style={styles.title}>Welcome Back</ThemedText>
              <ThemedText style={styles.subtitle}>Sign in to continue to fav♡rites.</ThemedText>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Email</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Password</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.brand, opacity: loading ? 0.7 : 1 }]}
                onPress={handleSignIn}
                disabled={loading}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.buttonText}>{loading ? 'Signing In...' : 'Sign In'}</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <ThemedText>Don't have an account? </ThemedText>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <ThemedText style={{ color: theme.brand, fontWeight: '700' }}>Sign Up</ThemedText>
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

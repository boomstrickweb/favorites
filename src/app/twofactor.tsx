import { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, Clipboard } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { generateSecret, encryptSecret, decryptSecret, generateRecoveryCodes, verifyTOTP } from '@/lib/twofactor';

export default function TwoFactorScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'recovery'>('status');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetch2FAStatus();
  }, []);

  const fetch2FAStatus = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('two_factor_enabled, two_factor_recovery_codes')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setIsEnabled(!!data.two_factor_enabled);
        if (data.two_factor_recovery_codes) {
          setRecoveryCodes(data.two_factor_recovery_codes);
        }
      }
    } catch (error: any) {
      console.error('Error fetching 2FA status:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const startSetup = () => {
    const newSecret = generateSecret();
    setSecret(newSecret);
    setStep('setup');
  };

  const handleVerifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    setProcessing(true);
    try {
      const isValid = verifyTOTP(verificationCode, secret);
      if (!isValid) {
        Alert.alert('Error', 'Invalid verification code. Please try again.');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const encryptedSecret = encryptSecret(secret);
      const newRecoveryCodes = generateRecoveryCodes();
      
      const { error } = await supabase
        .from('profiles')
        .update({
          two_factor_enabled: true,
          two_factor_secret: encryptedSecret,
          two_factor_recovery_codes: newRecoveryCodes
        })
        .eq('id', user.id);

      if (error) throw error;

      setRecoveryCodes(newRecoveryCodes);
      setIsEnabled(true);
      setStep('recovery');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to enable 2FA');
    } finally {
      setProcessing(false);
    }
  };

  const disable2FA = async () => {
    Alert.alert(
      'Disable 2FA',
      'Are you sure you want to disable two-factor authentication? This will make your account less secure.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disable', 
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const { error } = await supabase
                .from('profiles')
                .update({
                  two_factor_enabled: false,
                  two_factor_secret: null,
                  two_factor_recovery_codes: null
                })
                .eq('id', user.id);

              if (error) throw error;
              
              setIsEnabled(false);
              setStep('status');
              Alert.alert('Success', 'Two-factor authentication has been disabled.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to disable 2FA');
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/settings');
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={theme.brand} style={styles.centered} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Two-Factor Auth</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {step === 'status' && (
            <View style={styles.section}>
              <View style={styles.statusIconContainer}>
                <Ionicons 
                  name={isEnabled ? "shield-checkmark" : "shield-outline"} 
                  size={80} 
                  color={isEnabled ? "#34C759" : theme.textSecondary} 
                />
              </View>
              <ThemedText style={styles.statusTitle}>
                {isEnabled ? "2FA is Enabled" : "2FA is Disabled"}
              </ThemedText>
              <ThemedText style={styles.statusDescription}>
                {isEnabled 
                  ? "Your account is protected with an additional layer of security. You'll need a code from your authenticator app to sign in."
                  : "Two-factor authentication adds an extra layer of security to your account. To log in, you'll need to provide a code from an authenticator app."}
              </ThemedText>

              {isEnabled ? (
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.button, { backgroundColor: theme.backgroundElement }]}
                    onPress={() => setStep('recovery')}
                  >
                    <ThemedText style={[styles.buttonText, { color: theme.text }]}>View Recovery Codes</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.destructiveButton]}
                    onPress={disable2FA}
                  >
                    <ThemedText style={styles.destructiveButtonText}>Disable 2FA</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: theme.brand }]}
                  onPress={startSetup}
                >
                  <ThemedText style={styles.buttonText}>Enable 2FA</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {step === 'setup' && (
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.stepTitle}>Step 1: Scan QR Code</ThemedText>
              <ThemedText style={styles.stepDescription}>
                Scan this QR code with your authenticator app (like Google Authenticator or Authy).
              </ThemedText>
              
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code" size={150} color={theme.text} />
                <ThemedText style={styles.qrMockText}>[ QR Code for Authenticator ]</ThemedText>
              </View>

              <ThemedText style={styles.manualEntryTitle}>Can't scan? Enter this code manually:</ThemedText>
              <TouchableOpacity 
                style={[styles.secretContainer, { backgroundColor: theme.backgroundElement }]}
                onPress={() => copyToClipboard(secret, 'Secret key')}
              >
                <ThemedText style={styles.secretText}>{secret}</ThemedText>
                <Ionicons name="copy-outline" size={20} color={theme.brand} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, { backgroundColor: theme.brand, marginTop: Spacing.six }]}
                onPress={() => setStep('verify')}
              >
                <ThemedText style={styles.buttonText}>Next</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {step === 'verify' && (
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.stepTitle}>Step 2: Verify Code</ThemedText>
              <ThemedText style={styles.stepDescription}>
                Enter the 6-digit code from your authenticator app to confirm setup.
              </ThemedText>

              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                placeholder="000000"
                placeholderTextColor={theme.textSecondary}
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <TouchableOpacity 
                style={[styles.button, { backgroundColor: theme.brand, opacity: processing ? 0.7 : 1 }]}
                onPress={handleVerifyAndEnable}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <ThemedText style={styles.buttonText}>Verify and Enable</ThemedText>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.textButton}
                onPress={() => setStep('setup')}
                disabled={processing}
              >
                <ThemedText style={{ color: theme.textSecondary }}>Back to QR Code</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {step === 'recovery' && (
            <View style={styles.section}>
              <View style={styles.successHeader}>
                <Ionicons name="checkmark-circle" size={48} color="#34C759" />
                <ThemedText type="subtitle">Setup Complete</ThemedText>
              </View>
              
              <ThemedText style={styles.recoveryDescription}>
                Save these recovery codes in a safe place. You can use them to access your account if you lose your authenticator app.
              </ThemedText>

              <View style={[styles.recoveryCodesContainer, { backgroundColor: theme.backgroundElement }]}>
                {recoveryCodes.map((code, index) => (
                  <View key={index} style={styles.recoveryCodeItem}>
                    <ThemedText style={styles.recoveryCodeText}>{code}</ThemedText>
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.button, { backgroundColor: theme.backgroundElement, marginBottom: Spacing.three }]}
                onPress={() => copyToClipboard(recoveryCodes.join('\n'), 'Recovery codes')}
              >
                <ThemedText style={[styles.buttonText, { color: theme.text }]}>Copy All Codes</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, { backgroundColor: theme.brand }]}
                onPress={() => setStep('status')}
              >
                <ThemedText style={styles.buttonText}>Done</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
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
    paddingTop: Spacing.six,
  },
  section: {
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconContainer: {
    marginBottom: Spacing.four,
    marginTop: Spacing.four,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.three,
  },
  statusDescription: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
    marginBottom: Spacing.eight,
    paddingHorizontal: Spacing.four,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.three,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  destructiveButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  destructiveButtonText: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 20,
    marginBottom: Spacing.two,
    width: '100%',
  },
  stepDescription: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: Spacing.six,
    width: '100%',
  },
  qrPlaceholder: {
    width: 250,
    height: 250,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.six,
  },
  qrMockText: {
    fontSize: 12,
    marginTop: 10,
    opacity: 0.5,
  },
  manualEntryTitle: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: Spacing.two,
    width: '100%',
  },
  secretContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderRadius: 12,
    width: '100%',
  },
  secretText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    height: 64,
    borderRadius: 16,
    paddingHorizontal: Spacing.four,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: Spacing.six,
  },
  textButton: {
    marginTop: Spacing.four,
    padding: Spacing.two,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: Spacing.six,
    gap: Spacing.two,
  },
  recoveryDescription: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: Spacing.six,
    lineHeight: 20,
  },
  recoveryCodesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderRadius: 16,
    width: '100%',
    marginBottom: Spacing.six,
    gap: Spacing.three,
  },
  recoveryCodeItem: {
    width: '45%',
    paddingVertical: Spacing.two,
  },
  recoveryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

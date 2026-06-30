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

export default function SignUpScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        router.push({
          pathname: '/confirm',
          params: { email }
        });
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred during sign up');
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
              <ThemedText type="subtitle" style={styles.title}>Create Account</ThemedText>
              <ThemedText style={styles.subtitle}>Join fav♡rites to share what you love.</ThemedText>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Email address</ThemedText>
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
                <ThemedText style={styles.label}>Username</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                  placeholder="Choose a username"
                  placeholderTextColor={theme.textSecondary}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Password</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                  placeholder="Create a password"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.brand, opacity: loading ? 0.7 : 1 }]}
                onPress={handleSignUp}
                disabled={loading}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.buttonText}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <ThemedText>Already have an account? </ThemedText>
              <TouchableOpacity onPress={() => router.push('/signin')}>
                <ThemedText style={{ color: theme.brand, fontWeight: '700' }}>Sign In</ThemedText>
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

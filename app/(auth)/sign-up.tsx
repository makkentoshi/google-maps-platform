import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded) return;
    setPending(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      Alert.alert('Sign Up Failed', err.errors?.[0]?.message || err.message);
    }
    setPending(false);
  };

  const handleVerify = async () => {
    if (!isLoaded) return;
    setPending(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/');
      } else {
        Alert.alert(
          'Verification Incomplete',
          'Please check your code and try again.'
        );
      }
    } catch (err: any) {
      Alert.alert(
        'Verification Failed',
        err.errors?.[0]?.message || err.message
      );
    }
    setPending(false);
  };

  if (pendingVerification) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('verifyEmail') || 'Verify your email'}
        </Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.colors.surface, color: theme.colors.text },
          ]}
          placeholder={t('verificationCode') || 'Verification code'}
          placeholderTextColor={theme.colors.textSecondary}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
        />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleVerify}
          disabled={pending}
        >
          <Text style={styles.buttonText}>{t('verify') || 'Verify'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {t('signUp') || 'Sign Up'}
      </Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.colors.surface, color: theme.colors.text },
        ]}
        placeholder={t('email') || 'Email'}
        placeholderTextColor={theme.colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.colors.surface, color: theme.colors.text },
        ]}
        placeholder={t('password') || 'Password'}
        placeholderTextColor={theme.colors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={handleSignUp}
        disabled={pending}
      >
        <Text style={styles.buttonText}>{t('signUp') || 'Sign Up'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.linkContainer}
        onPress={() => router.push('/sign-in')}
      >
        <Text style={[styles.link, { color: theme.colors.primary }]}>
          {t('alreadyHaveAccountSignIn') || 'Already have an account? Sign in'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: { borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  linkContainer: { marginTop: 24, alignItems: 'center' },
  link: { fontSize: 16 },
});

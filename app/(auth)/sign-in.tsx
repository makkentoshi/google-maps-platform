import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded) return;
    setPending(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      await setActive({ session: result.createdSessionId });
      router.replace('/');
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.errors?.[0]?.message || err.message);
    }
    setPending(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{t('signIn') || 'Sign In'}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
        placeholder={t('email') || 'Email'}
        placeholderTextColor={theme.colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
        placeholder={t('password') || 'Password'}
        placeholderTextColor={theme.colors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={handleSignIn}
        disabled={pending}
      >
        <Text style={styles.buttonText}>{t('signIn') || 'Sign In'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkContainer} onPress={() => router.push('/sign-up')}>
        <Text style={[styles.link, { color: theme.colors.primary }]}>
          {t('noAccountSignUp') || "Don't have an account? Sign up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
  input: { borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  linkContainer: { marginTop: 24, alignItems: 'center' },
  link: { fontSize: 16 },
});
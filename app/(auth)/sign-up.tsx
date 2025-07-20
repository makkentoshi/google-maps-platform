import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSignUp, useOAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

// Этот хук необходим для правильной работы OAuth в мобильном приложении
export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Завершает сессию веб-браузера после редиректа от OAuth провайдера
WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useLanguage();

  useWarmUpBrowser();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  // Создаем отдельные обработчики для каждой OAuth стратегии
  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({
    strategy: 'oauth_google',
  });
  const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({
    strategy: 'oauth_apple',
  });

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      Alert.alert('Sign Up Failed', err.errors?.[0]?.message || err.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert(
        'Verification Failed',
        err.errors?.[0]?.message || err.toString()
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSocialSignUpPress = async (
    strategy: 'oauth_google' | 'oauth_apple'
  ) => {
    setIsLoading(true);
    try {
      const oAuthFlow =
        strategy === 'oauth_google'
          ? startGoogleOAuthFlow
          : startAppleOAuthFlow;
      const { createdSessionId, signUp, setActive } = await oAuthFlow();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.error('OAuth error', err);
      Alert.alert(
        'Sign Up Failed',
        (err as any).errors?.[0]?.message || (err as any).toString()
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('verifyEmail') || 'Verify Your Email'}
        </Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.colors.surface, color: theme.colors.text },
          ]}
          placeholder={t('verificationCode') || 'Verification Code'}
          placeholderTextColor={theme.colors.textSecondary}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
        />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={onVerifyPress}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('verify') || 'Verify'}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {t('signUp') || 'Create Account'}
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
        onPress={onSignUpPress}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t('signUp') || 'Sign Up'}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.separatorContainer}>
        <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
        <Text
          style={[styles.separatorText, { color: theme.colors.textSecondary }]}
        >
          OR
        </Text>
        <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
      </View>

      <TouchableOpacity
        style={[styles.socialButton, { borderColor: theme.colors.border }]}
        onPress={() => onSocialSignUpPress('oauth_google')}
        disabled={isLoading}
      >
        {/* Здесь нужна иконка Google */}
        <Text style={[styles.socialButtonText, { color: theme.colors.text }]}>
          Continue with Google
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.socialButton,
          { borderColor: theme.colors.border, marginTop: 16 },
        ]}
        onPress={() => onSocialSignUpPress('oauth_apple')}
        disabled={isLoading}
      >
        {/* Здесь нужна иконка Apple */}
        <Text style={[styles.socialButtonText, { color: theme.colors.text }]}>
          Continue with Apple
        </Text>
      </TouchableOpacity>

      <View style={styles.footerContainer}>
        <Text
          style={[styles.footerText, { color: theme.colors.textSecondary }]}
        >
          {t('haveAccountPrompt') || 'Already have an account?'}{' '}
        </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
          <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
            {t('signIn') || 'Sign In'}
          </Text>
        </TouchableOpacity>
      </View>
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
  input: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    height: 52,
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: { flex: 1, height: 1 },
  separatorText: { marginHorizontal: 16, fontSize: 14 },
  socialButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButtonText: { fontWeight: '600', fontSize: 16, marginLeft: 12 },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: { fontSize: 16 },
  footerLink: { fontSize: 16, fontWeight: 'bold' },
});

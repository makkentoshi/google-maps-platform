// Файл: app/_layout.tsx

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env'
  );
}

const InitialLayout = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (!isSignedIn) {
      router.replace('/(auth)/sign-up');
    }
  }, [isLoaded, isSignedIn]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />

      {/* <<< НОВЫЙ БЛОК: Настройка экрана истории >>> */}
      <Stack.Screen
        name="story" // Имя файла: /app/story.tsx
        options={{
          headerShown: true, // Показываем шапку
          headerTitle: '', // Но убираем из нее текст "story"
          headerBackTitle: 'Back', // Убираем текст "< (tabs)"
          headerTintColor: '#000', // Цвет стрелки "назад" (замените на цвет из темы)
          headerTransparent: true, // Делаем фон шапки прозрачным
          headerShadowVisible: false, // Убираем тень
        }}
      />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={CLERK_PUBLISHABLE_KEY}
    >
      <ThemeProvider>
        <LanguageProvider>
          <InitialLayout />
          <StatusBar style="auto" />
        </LanguageProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}

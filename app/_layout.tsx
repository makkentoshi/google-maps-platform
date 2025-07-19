import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Slot } from 'expo-router';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ClerkProvider tokenCache={tokenCache}>
      <ThemeProvider>
        <LanguageProvider>
          <Slot />
          <StatusBar style="auto" />
        </LanguageProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}

import { Tabs } from 'expo-router';
import { Camera, Map, User, Trophy, Settings } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SignedIn, SignedOut } from '@clerk/clerk-expo';

export default function TabLayout() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <>
      <SignedIn>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.textSecondary,
            tabBarStyle: {
              backgroundColor: theme.colors.card,
              borderTopColor: theme.colors.border,
              borderTopWidth: 1,
              paddingTop: 8,
              paddingBottom: 8,
              height: 88,
              shadowColor: theme.colors.text,
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 8,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
              marginTop: 4,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: t('camera'),
              tabBarIcon: ({ size, color }) => (
                <Camera size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="explore"
            options={{
              title: t('explore'),
              tabBarIcon: ({ size, color }) => (
                <Map size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="quests"
            options={{
              title: t('quests'),
              tabBarIcon: ({ size, color }) => (
                <Trophy size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: t('profile'),
              tabBarIcon: ({ size, color }) => (
                <User size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: t('settings'),
              tabBarIcon: ({ size, color }) => (
                <Settings size={size} color={color} />
              ),
            }}
          />
        </Tabs>
      </SignedIn>
      <SignedOut>
        {/* You can replace this with a redirect or a sign-in screen */}
        <div
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 40,
          }}
        >
          <p>Please sign in to access the app.</p>
        </div>
      </SignedOut>
    </>
  );
}

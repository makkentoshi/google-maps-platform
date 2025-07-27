import { Tabs } from 'expo-router';
import {
  Camera,
  Map,
  User,
  Trophy,
  Compass,
  Settings,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SignedIn } from '@clerk/clerk-expo';
import { View } from 'react-native';

export default function TabLayout() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
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
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
            marginTop: 4,
          },
        }}
      >
        {/* 1. Explore - самый левый */}
        <Tabs.Screen
          name="explore"
          options={{
            title: t('explore'),
            tabBarIcon: ({ size, color }) => (
              <Compass size={size} color={color} />
            ),
          }}
        />

        {/* 2. Map - справа от explore */}
        <Tabs.Screen
          name="map"
          options={{
            title: t('map'),
            tabBarIcon: ({ size, color }) => <Map size={size} color={color} />,
          }}
        />

        {/* 3. Camera - центральная (выделенная) */}
        <Tabs.Screen
          name="index"
          options={{
            title: '',
            tabBarIcon: ({ size, color }) => (
              <View
                style={{
                  backgroundColor: theme.colors.primary,
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 28,
                  borderWidth: 3,
                  borderColor: theme.colors.card,
                }}
              >
                <Camera size={size} color={theme.colors.card} />
              </View>
            ),
            tabBarLabel: () => null,
          }}
        />

        {/* 4. Quests - справа от камеры */}
        {/* <Tabs.Screen
          name="quests"
          options={{
            title: t('quests'),
            tabBarIcon: ({ size, color }) => (
              <Trophy size={size} color={color} />
            ),
          }}
        /> */}

        {/* 5. Profile - левее settings */}
        <Tabs.Screen
          name="profile"
          options={{
            title: t('profile'),
            tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
          }}
        />

        {/* 6. Settings - самый правый */}
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
  );
}

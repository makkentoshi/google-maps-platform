import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { 
  Moon, 
  Sun, 
  Globe, 
  Bell, 
  User, 
  Shield, 
  Info, 
  ChevronRight,
  Palette
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SettingsScreen() {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const { t, language, setLanguage } = useLanguage();

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent, 
    showChevron = true 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity 
      style={[styles.settingItem, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}
      onPress={onPress}
      disabled={!onPress}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.surface }]}>
          {icon}
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showChevron && !rightComponent && (
          <ChevronRight size={20} color={theme.colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.colors.card }]}>
        {children}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('settingsTitle')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SettingSection title={t('appearance')}>
          <SettingItem
            icon={<Palette size={20} color={theme.colors.primary} />}
            title={t('darkMode')}
            rightComponent={
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
              />
            }
            showChevron={false}
          />
        </SettingSection>

        <SettingSection title={t('language')}>
          <SettingItem
            icon={<Globe size={20} color={theme.colors.primary} />}
            title={t('language')}
            subtitle={language === 'en' ? t('english') : t('russian')}
            onPress={() => setLanguage(language === 'en' ? 'ru' : 'en')}
          />
        </SettingSection>

        <SettingSection title={t('notifications')}>
          <SettingItem
            icon={<Bell size={20} color={theme.colors.primary} />}
            title={t('pushNotifications')}
            rightComponent={
              <Switch
                value={true}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={'#FFFFFF'}
              />
            }
            showChevron={false}
          />
          <SettingItem
            icon={<Bell size={20} color={theme.colors.primary} />}
            title={t('questReminders')}
            rightComponent={
              <Switch
                value={false}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={'#FFFFFF'}
              />
            }
            showChevron={false}
          />
        </SettingSection>

        <SettingSection title={t('account')}>
          <SettingItem
            icon={<User size={20} color={theme.colors.primary} />}
            title={t('editProfile')}
          />
          <SettingItem
            icon={<Shield size={20} color={theme.colors.primary} />}
            title={t('privacy')}
          />
        </SettingSection>

        <SettingSection title={t('about')}>
          <SettingItem
            icon={<Info size={20} color={theme.colors.primary} />}
            title={t('version')}
            subtitle="1.0.0"
            showChevron={false}
          />
          <SettingItem
            icon={<Info size={20} color={theme.colors.primary} />}
            title={t('support')}
          />
        </SettingSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
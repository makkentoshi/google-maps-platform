import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {
  User as UserIcon,
  MapPin,
  Star,
  Calendar,
  Settings,
  Share2,
  Award,
  Zap,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUser, useAuth } from '@clerk/clerk-expo';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { signOut, userId } = useAuth();
  const router = useRouter();

  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/profile`,
        {
          headers: { 'x-clerk-user-id': userId },
        }
      );
      setProfileData(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'Could not load profile data.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // useFocusEffect будет вызывать fetchProfile каждый раз, когда экран в фокусе
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  if (isLoading || !isUserLoaded) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const displayName = user?.fullName || user?.username || 'User';
  const avatarUrl = user?.imageUrl || null;
  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : '';
  const progressPercentage =
    profileData?.nextLevelXP > 0
      ? (profileData.xp / profileData.nextLevelXP) * 100
      : 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={[styles.header, { backgroundColor: theme.colors.background }]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={[
                styles.settingsButton,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Settings size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.shareButton,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Share2 size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <UserIcon size={40} color="#FFFFFF" />
                </View>
              )}
              <View
                style={[
                  styles.levelBadge,
                  {
                    backgroundColor: `${theme.colors.warning}20`,
                    borderColor: theme.colors.background,
                  },
                ]}
              >
                <Zap size={12} color={theme.colors.warning} />
                <Text
                  style={[styles.levelText, { color: theme.colors.warning }]}
                >
                  {profileData?.level || 1}
                </Text>
              </View>
            </View>

            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {displayName}
            </Text>
            <View style={styles.joinInfo}>
              <Calendar size={14} color={theme.colors.textSecondary} />
              <Text
                style={[styles.joinText, { color: theme.colors.textSecondary }]}
              >
                {t('joinedIn', 'Joined in')} {joinDate}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.xpSection,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.xpHeader}>
              <Text style={[styles.xpLabel, { color: theme.colors.text }]}>
                {t('nextLevel', 'Next Level')}
              </Text>
              <Text
                style={[styles.xpProgress, { color: theme.colors.primary }]}
              >
                {profileData?.xp || 0} / {profileData?.nextLevelXP || 1} XP
              </Text>
            </View>
            <View
              style={[styles.xpBar, { backgroundColor: theme.colors.border }]}
            >
              <View
                style={[
                  styles.xpFill,
                  {
                    backgroundColor: theme.colors.primary,
                    width: `${progressPercentage}%`,
                  },
                ]}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.signOutButton,
              { backgroundColor: theme.colors.error },
            ]}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutButtonText}>
              {t('signOut', 'Sign Out')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <MapPin size={24} color={theme.colors.primary} />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              {profileData?.visitedPlaces || 0}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              {t('places', 'Places')}
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Star size={24} color={theme.colors.success} />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              {profileData?.totalStories || 0}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              {t('stories', 'Stories')}
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Award size={24} color={theme.colors.error} />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              {profileData?.achievements || 0}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              {t('achievements', 'Achievements')}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('quests', 'Quests')}
            </Text>
            <TouchableOpacity onPress={() => router.push('/quests')}>
              <Text
                style={[styles.seeAllText, { color: theme.colors.primary }]}
              >
                {t('all', 'View All')}
              </Text>
            </TouchableOpacity>
          </View>
          {profileData?.quests?.length > 0 ? (
            profileData.quests.map((quest: any) => {
              const questProgress = (quest.progress / quest.goal) * 100;
              return (
                <View
                  key={quest.id}
                  style={[
                    styles.achievementCard,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.achievementIcon,
                      { backgroundColor: `${theme.colors.warning}20` },
                    ]}
                  >
                    <Award size={24} color={theme.colors.warning} />
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text
                      style={[
                        styles.achievementTitle,
                        { color: theme.colors.text },
                      ]}
                    >
                      {quest.title}
                    </Text>
                    <Text
                      style={[
                        styles.achievementDescription,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {quest.progress} / {quest.goal}
                    </Text>
                    <View
                      style={[
                        styles.questProgressBar,
                        { backgroundColor: theme.colors.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.questProgressFill,
                          {
                            backgroundColor: theme.colors.warning,
                            width: `${questProgress}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  {quest.isCompleted && (
                    <View
                      style={[
                        styles.achievementBadge,
                        { backgroundColor: `${theme.colors.success}20` },
                      ]}
                    >
                      <Star size={16} color={theme.colors.success} />
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <Text
              style={{ color: theme.colors.textSecondary, textAlign: 'center' }}
            >
              No active quests.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  joinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  joinText: {
    fontSize: 14,
  },
  xpSection: {
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  xpLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  xpProgress: {
    fontSize: 14,
    fontWeight: '600',
  },
  xpBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: '600',
  },
  achievementCard: {
    marginBottom: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  achievementBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutButton: {
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  questProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  questProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
});

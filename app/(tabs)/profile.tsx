import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { 
  User, 
  MapPin, 
  Trophy, 
  Star, 
  Calendar, 
  Settings, 
  Share2, 
  Award,
  Target,
  Zap,
  Clock
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

const { width } = Dimensions.get('window');

const mockUser = {
  name: 'Alexander Petrov',
  username: '@alex_explorer',
  level: 5,
  xp: 1250,
  nextLevelXP: 1500,
  joinDate: 'January 2024',
  visitedPlaces: 45,
  completedQuests: 12,
  totalStories: 28,
  rating: 4.8,
  achievements: 15,
  streak: 7,
};

const recentActivity = [
  {
    id: 1,
    type: 'quest_completed',
    title: 'Completed quest "Secrets of Red Square"',
    time: '2 hours ago',
    xp: 150,
  },
  {
    id: 2,
    type: 'place_visited',
    title: 'Visited Christ the Savior Cathedral',
    time: '1 day ago',
    xp: 50,
  },
  {
    id: 3,
    type: 'story_liked',
    title: 'Story received 10 likes',
    time: '3 days ago',
    xp: 25,
  },
];

const topAchievements = [
  { id: 1, title: 'Moscow Explorer', description: 'Visited 50+ places', icon: 'map' },
  { id: 2, title: 'Quest Master', description: 'Completed 10 quests', icon: 'trophy' },
  { id: 3, title: 'Storyteller', description: 'Received 100+ likes', icon: 'star' },
];

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const progressPercentage = (mockUser.xp / mockUser.nextLevelXP) * 100;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
          
          <View style={styles.headerTop}>
            <TouchableOpacity style={[styles.settingsButton, { backgroundColor: theme.colors.surface }]}>
              <Settings size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareButton, { backgroundColor: theme.colors.surface }]}>
              <Share2 size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                <User size={40} color="#FFFFFF" />
              </View>
              <View style={[styles.levelBadge, { backgroundColor: theme.colors.warning + '20', borderColor: theme.colors.background }]}>
                <Zap size={12} color={theme.colors.warning} />
                <Text style={[styles.levelText, { color: theme.colors.warning }]}>{mockUser.level}</Text>
              </View>
            </View>

            <Text style={[styles.userName, { color: theme.colors.text }]}>{mockUser.name}</Text>
            <Text style={[styles.userHandle, { color: theme.colors.primary }]}>{mockUser.username}</Text>
            
            <View style={styles.joinInfo}>
              <Calendar size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.joinText, { color: theme.colors.textSecondary }]}>{t('joinedIn')} {mockUser.joinDate}</Text>
            </View>
          </View>

          <View style={[styles.xpSection, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.xpHeader}>
              <Text style={[styles.xpLabel, { color: theme.colors.text }]}>{t('nextLevel')}</Text>
              <Text style={[styles.xpProgress, { color: theme.colors.primary }]}>{mockUser.xp} / {mockUser.nextLevelXP} XP</Text>
            </View>
            <View style={[styles.xpBar, { backgroundColor: theme.colors.border }]}>
              <View style={[styles.xpFill, { backgroundColor: theme.colors.primary, width: `${progressPercentage}%` }]} />
            </View>
          </View>

        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <MapPin size={24} color={theme.colors.primary} />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>{mockUser.visitedPlaces}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('places')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Trophy size={24} color={theme.colors.warning} />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>{mockUser.completedQuests}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('quests')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Star size={24} color={theme.colors.success} />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>{mockUser.totalStories}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('stories')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Award size={24} color={theme.colors.error} />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>{mockUser.achievements}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('achievements')}</Text>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('topAchievements')}</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>{t('all')}</Text>
            </TouchableOpacity>
          </View>

          {topAchievements.map((achievement) => (
            <View key={achievement.id} style={[styles.achievementCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                
                <View style={[styles.achievementIcon, { backgroundColor: theme.colors.warning + '20' }]}>
                  <Award size={24} color={theme.colors.warning} />
                </View>
                
                <View style={styles.achievementInfo}>
                  <Text style={[styles.achievementTitle, { color: theme.colors.text }]}>{achievement.title}</Text>
                  <Text style={[styles.achievementDescription, { color: theme.colors.textSecondary }]}>{achievement.description}</Text>
                </View>

                <View style={[styles.achievementBadge, { backgroundColor: theme.colors.warning + '20' }]}>
                  <Star size={16} color={theme.colors.warning} />
                </View>

            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('recentActivity')}</Text>
          </View>

          {recentActivity.map((activity) => (
            <View key={activity.id} style={[styles.activityCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={[styles.activityIcon, { backgroundColor: theme.colors.surface }]}>
                {activity.type === 'quest_completed' && <Trophy size={20} color={theme.colors.primary} />}
                {activity.type === 'place_visited' && <MapPin size={20} color={theme.colors.success} />}
                {activity.type === 'story_liked' && <Star size={20} color={theme.colors.warning} />}
              </View>

              <View style={styles.activityInfo}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>{activity.title}</Text>
                <View style={styles.activityMeta}>
                  <Clock size={12} color={theme.colors.textSecondary} />
                  <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>{activity.time}</Text>
                </View>
              </View>

              <View style={styles.activityReward}>
                <View style={[styles.xpBadge, { backgroundColor: theme.colors.warning + '20' }]}>
                  <Zap size={12} color={theme.colors.warning} />
                  <Text style={[styles.xpText, { color: theme.colors.warning }]}>+{activity.xp}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Target size={20} color={theme.colors.primary} />
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>{t('myQuests')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <MapPin size={20} color={theme.colors.success} />
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>{t('visitedPlaces')}</Text>
          </TouchableOpacity>
        </View>

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
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  },
  userHandle: {
    fontSize: 16,
    marginBottom: 12,
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
  },
  achievementBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityTime: {
    fontSize: 12,
  },
  activityReward: {
    alignItems: 'flex-end',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Trophy, Target, Clock, MapPin, Star, Zap, Gift, Users } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

const { width } = Dimensions.get('window');

const mockQuests = [
  {
    id: 1,
    title: 'Secrets of Red Square',
    description: 'Find 5 hidden symbols of the Soviet era',
    difficulty: 'medium',
    duration: '45 min',
    reward: 150,
    progress: 60,
    location: 'Red Square',
    participants: 234,
    status: 'active',
  },
  {
    id: 2,
    title: 'Architectural Heritage',
    description: 'Study building styles of the historic center',
    difficulty: 'easy',
    duration: '30 min',
    reward: 100,
    progress: 0,
    location: 'City Center',
    participants: 567,
    status: 'available',
  },
  {
    id: 3,
    title: 'Legends of Gorky Park',
    description: 'Discover mystical stories of the central park',
    difficulty: 'hard',
    duration: '90 min',
    reward: 300,
    progress: 100,
    location: 'Gorky Park',
    participants: 89,
    status: 'completed',
  },
];

const achievements = [
  { id: 1, title: 'Pioneer', icon: 'star', unlocked: true },
  { id: 2, title: 'Historian', icon: 'book', unlocked: true },
  { id: 3, title: 'Explorer', icon: 'compass', unlocked: false },
  { id: 4, title: 'Legend', icon: 'crown', unlocked: false },
];

export default function QuestsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState('active');
  const userLevel = 5;
  const userXP = 1250;
  const nextLevelXP = 1500;

  const filteredQuests = mockQuests.filter(quest => {
    if (selectedTab === 'active') return quest.status === 'active';
    if (selectedTab === 'available') return quest.status === 'available';
    if (selectedTab === 'completed') return quest.status === 'completed';
    return true;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return theme.colors.success;
      case 'medium': return theme.colors.warning;
      case 'hard': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const getDifficultyText = (difficulty: string) => {
    return t(difficulty);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.colors.primary;
      case 'available': return theme.colors.success;
      case 'completed': return theme.colors.textSecondary;
      default: return theme.colors.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('quests')}</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>{t('questsSubtitle')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.progressCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            
            <View style={styles.progressHeader}>
              <View style={[styles.levelBadge, { backgroundColor: theme.colors.warning + '20' }]}>
                <Zap size={16} color={theme.colors.warning} />
                <Text style={[styles.levelText, { color: theme.colors.warning }]}>{t('level')} {userLevel}</Text>
              </View>
              <View style={styles.xpContainer}>
                <Text style={[styles.xpText, { color: theme.colors.textSecondary }]}>{userXP} / {nextLevelXP} XP</Text>
              </View>
            </View>

            <View style={[styles.progressBar, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.progressFill, { backgroundColor: theme.colors.primary, width: `${(userXP / nextLevelXP) * 100}%` }]} />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Trophy size={20} color={theme.colors.warning} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>12</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('questsLabel')}</Text>
              </View>
              <View style={styles.statItem}>
                <Target size={20} color={theme.colors.success} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>45</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('places')}</Text>
              </View>
              <View style={styles.statItem}>
                <Gift size={20} color={theme.colors.primary} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>2.4K</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('points')}</Text>
              </View>
            </View>
        </View>

        <View style={styles.achievementsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('achievements')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementsContainer}>
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementBadge,
                  { 
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    opacity: achievement.unlocked ? 1 : 0.5
                  }
                ]}>
                <Star size={24} color={achievement.unlocked ? theme.colors.warning : theme.colors.textSecondary} />
                <Text style={[
                  styles.achievementText,
                  { color: achievement.unlocked ? theme.colors.text : theme.colors.textSecondary }
                ]}>
                  {achievement.title}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.tabsContainer, { backgroundColor: theme.colors.surface }]}>
          {[
            { key: 'active', label: t('active'), count: mockQuests.filter(q => q.status === 'active').length },
            { key: 'available', label: t('available'), count: mockQuests.filter(q => q.status === 'available').length },
            { key: 'completed', label: t('completed'), count: mockQuests.filter(q => q.status === 'completed').length },
          ].map((tab, index, arr) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                {
                  backgroundColor: selectedTab === tab.key ? theme.colors.primary : 'transparent',
                  borderTopLeftRadius: index === 0 ? 12 : 0,
                  borderBottomLeftRadius: index === 0 ? 12 : 0,
                  borderTopRightRadius: index === arr.length - 1 ? 12 : 0,
                  borderBottomRightRadius: index === arr.length - 1 ? 12 : 0,
                }
              ]}
              onPress={() => setSelectedTab(tab.key)}>
              <Text style={[
                styles.tabText,
                { color: selectedTab === tab.key ? '#FFFFFF' : theme.colors.textSecondary }
              ]}>
                {tab.label}
              </Text>
              <View style={[
                styles.tabBadge,
                { 
                  backgroundColor: selectedTab === tab.key ? '#FFFFFF' : theme.colors.border
                }
              ]}>
                <Text style={[
                  styles.tabBadgeText,
                  { color: selectedTab === tab.key ? theme.colors.primary : theme.colors.textSecondary }
                ]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {filteredQuests.map((quest) => (
          <TouchableOpacity key={quest.id} style={[styles.questCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              
              <View style={styles.questHeader}>
                <View style={styles.questInfo}>
                  <Text style={[styles.questTitle, { color: theme.colors.text }]}>{quest.title}</Text>
                  <Text style={[styles.questDescription, { color: theme.colors.textSecondary }]}>{quest.description}</Text>
                </View>
                
                <View style={styles.questReward}>
                  <View style={[styles.rewardBadge, { backgroundColor: theme.colors.warning + '20' }]}>
                    <Zap size={14} color={theme.colors.warning} />
                    <Text style={[styles.rewardText, { color: theme.colors.warning }]}>{quest.reward} XP</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.questMeta, { borderTopColor: theme.colors.border }]}>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Target size={14} color={getDifficultyColor(quest.difficulty)} />
                    <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{getDifficultyText(quest.difficulty)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock size={14} color={theme.colors.textSecondary} />
                    <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{quest.duration}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MapPin size={14} color={theme.colors.primary} />
                    <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{quest.location}</Text>
                  </View>
                </View>

                <View style={styles.participantsRow}>
                  <Users size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.participantsText, { color: theme.colors.textSecondary }]}>{quest.participants} {t('participants')}</Text>
                </View>
              </View>

              {quest.status === 'active' && (
                <View style={[styles.progressSection, { borderTopColor: theme.colors.border }]}>
                  <View style={styles.progressSubHeader}>
                    <Text style={[styles.progressLabel, { color: theme.colors.text }]}>{t('progress')}</Text>
                    <Text style={[styles.progressPercentage, { color: theme.colors.primary }]}>{quest.progress}%</Text>
                  </View>
                  <View style={[styles.questProgressBar, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.questProgressFill, { backgroundColor: theme.colors.primary, width: `${quest.progress}%` }]} />
                  </View>
                </View>
              )}

              <TouchableOpacity style={[
                styles.questButton,
                { backgroundColor: getStatusColor(quest.status) }
              ]}>
                <Text style={styles.questButtonText}>
                  {quest.status === 'active' ? t('continue') : 
                   quest.status === 'available' ? t('startQuest') : t('completed_status')}
                </Text>
              </TouchableOpacity>

          </TouchableOpacity>
        ))}
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
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  progressCard: {
    marginBottom: 32,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  xpContainer: {
    alignItems: 'flex-end',
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  achievementsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  achievementsContainer: {
    paddingRight: 20,
    gap: 12,
  },
  achievementBadge: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 100,
  },
  achievementText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  questCard: {
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  questInfo: {
    flex: 1,
    marginRight: 16,
  },
  questTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  questDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  questReward: {
    alignItems: 'flex-start',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
  },
  questMeta: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantsText: {
    fontSize: 12,
  },
  progressSection: {
    marginBottom: 16,
    borderTopWidth: 1,
    paddingTop: 16,
  },
  progressSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  questProgressBar: {
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  questProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  questButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  questButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
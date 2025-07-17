import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { 
  ArrowLeft, MapPin, Clock, Heart, MessageCircle, Share2, 
  BookOpen, Users, Star, Target
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

const { width } = Dimensions.get('window');

export default function StoryScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const params = useLocalSearchParams();

  const storyData = useMemo(() => {
    if (params.data && typeof params.data === 'string') {
      try {
        return JSON.parse(params.data);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [params.data]);

  const [isLiked, setIsLiked] = useState(storyData?.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(storyData?.likes ?? 0);

  const coordinates = useMemo(() => {
    if (storyData && storyData.coordinates) {
        const [latitude, longitude] = storyData.coordinates.split(',').map(Number);
        if(!isNaN(latitude) && !isNaN(longitude)) {
            return { latitude, longitude };
        }
    }
    return null;
  }, [storyData]);
  
  if (!storyData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center'}]}>
          <Text style={{color: theme.colors.text}}>Failed to load story data.</Text>
      </View>
    );
  }

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
  };

  const handleBack = () => {
    router.back();
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background + 'E6' }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.colors.surface }]} onPress={handleBack}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.shareButton, { backgroundColor: theme.colors.surface }]}>
          <Share2 size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <View style={[styles.titleCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            
            <Text style={[styles.storyTitle, { color: theme.colors.text }]}>{storyData.title}</Text>
            
            <View style={styles.locationInfo}>
              <MapPin size={16} color={theme.colors.primary} />
              <Text style={[styles.locationText, { color: theme.colors.primary }]}>{storyData.location}</Text>
            </View>

            <View style={styles.storyMeta}>
              <View style={styles.metaItem}>
                <Clock size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{storyData.readTime}</Text>
              </View>
              <View style={styles.metaItem}>
                <BookOpen size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{t('story')}</Text>
              </View>
              <View style={styles.metaItem}>
                <Users size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{t('popular')}</Text>
              </View>
            </View>

          </View>
        </View>

        {coordinates && (
          <View style={styles.mapSection}>
              <MapView 
                  style={styles.map}
                  initialRegion={{
                      latitude: coordinates.latitude,
                      longitude: coordinates.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                  }}
                  provider="google"
                  pitchEnabled={false}
                  rotateEnabled={false}
                  scrollEnabled={false}
                  zoomEnabled={false}
              >
                  <Marker coordinate={coordinates} pinColor={theme.colors.primary}/>
              </MapView>
          </View>
        )}

        <View style={styles.storySection}>
          <Text style={[styles.storyContent, { color: theme.colors.text }]}>{storyData.story}</Text>
        </View>

        {storyData.funFacts && storyData.funFacts.length > 0 && (
            <View style={styles.factsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('interestingFacts')}</Text>
            {storyData.funFacts.map((fact: string, index: number) => (
                <View key={index} style={styles.factItem}>
                <View style={[styles.factDot, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.factText, { color: theme.colors.textSecondary }]}>{fact}</Text>
                </View>
            ))}
            </View>
        )}

        <View style={styles.interactionSection}>
          <View style={[styles.interactionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.interactionRow}>
              <TouchableOpacity 
                style={[styles.interactionButton, { backgroundColor: isLiked ? theme.colors.error + '20' : theme.colors.surface }]}
                onPress={handleLike}>
                <Heart size={20} color={isLiked ? theme.colors.error : theme.colors.textSecondary} fill={isLiked ? theme.colors.error : "transparent"}/>
                <Text style={[styles.interactionText, { color: isLiked ? theme.colors.error : theme.colors.textSecondary }]}>{likesCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.interactionButton, { backgroundColor: theme.colors.surface }]}>
                <MessageCircle size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.interactionText, { color: theme.colors.textSecondary }]}>{storyData.comments ?? 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.interactionButton, { backgroundColor: theme.colors.surface }]}>
                <Share2 size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.interactionText, { color: theme.colors.textSecondary }]}>{t('share')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {storyData.relatedQuests && storyData.relatedQuests.length > 0 && (
            <View style={styles.questsSection}>
                <View style={styles.questsHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('relatedQuests')}</Text>
                    <TouchableOpacity>
                    <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>{t('allQuests')}</Text>
                    </TouchableOpacity>
                </View>
                {storyData.relatedQuests.map((quest: any) => (
                    <TouchableOpacity key={quest.id} style={[styles.questCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <View style={styles.questInfo}>
                            <Text style={[styles.questTitle, { color: theme.colors.text }]}>{quest.title}</Text>
                            <Text style={[styles.questDescription, { color: theme.colors.textSecondary }]}>{quest.description}</Text>
                            <View style={styles.questMeta}>
                                <View style={[styles.difficultyBadge, { backgroundColor: theme.colors.success + '20' }]}>
                                    <Target size={12} color={theme.colors.success} />
                                    <Text style={[styles.difficultyText, { color: theme.colors.success }]}>{quest.difficulty}</Text>
                                </View>
                                <View style={[styles.rewardBadge, { backgroundColor: theme.colors.warning + '20' }]}>
                                    <Star size={12} color={theme.colors.warning} />
                                    <Text style={[styles.rewardText, { color: theme.colors.warning }]}>{quest.reward} XP</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity style={[styles.startQuestButton, { backgroundColor: theme.colors.primary }]}>
                            <Text style={styles.startQuestText}>{t('start')}</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                ))}
            </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 1000,
  },
  backButton: {
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
  content: {
    flex: 1,
    paddingTop: 100,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  titleCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
  },
  storyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    lineHeight: 36,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
  },
  storyMeta: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mapSection: {
    height: 200,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  storySection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  storyContent: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
  },
  factsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  factItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  factDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 16,
  },
  factText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  interactionSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  interactionCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  interactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  interactionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  questsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  questsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: '600',
  },
  questCard: {
    marginBottom: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
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
    marginBottom: 12,
  },
  questMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '600',
  },
  startQuestButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startQuestText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});
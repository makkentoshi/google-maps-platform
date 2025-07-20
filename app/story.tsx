// Файл: app/story.tsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Heart,
  MessageCircle,
  Share2,
  BookOpen,
  Users,
  Star,
  Target,
  Zap,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@clerk/clerk-expo';
import axios from 'axios';

const { width } = Dimensions.get('window');

type StoryData = {
  source: 'database' | 'wikipedia';
  storyId?: string;
  title: string;
  story: string;
  funFacts?: string[];
  relatedQuests?: any[];
  location: string;
  coordinates?: string | null;
  readTime?: string;
  likes?: number;
  comments?: number;
  isLiked?: boolean;
};

export default function StoryScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userId } = useAuth();

  const [storyData, setStoryData] = useState<StoryData | null>(() => {
    if (params.data && typeof params.data === 'string') {
      try {
        // Fix: robust JSON extraction if needed
        const rawText = params.data as string;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in the text');
        return JSON.parse(jsonMatch[0].trim());
      } catch (e) {
        console.error('Failed to parse story data:', e);
        return null;
      }
    }
    return null;
  });

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    setIsLiked(storyData?.isLiked ?? false);
    console.log('Initial isLiked:', storyData?.isLiked);
    setLikesCount(storyData?.likes ?? 0);
    setCommentsCount(storyData?.comments ?? 0);
  }, [storyData]);

  const coordinates = useMemo(() => {
    if (storyData?.coordinates && typeof storyData.coordinates === 'string') {
      const [latitude, longitude] = storyData.coordinates
        .split(',')
        .map(Number);
      if (!isNaN(latitude) && !isNaN(longitude)) {
        return { latitude, longitude };
      }
    }
    return null;
  }, [storyData?.coordinates]);

  const handleEnhance = useCallback(async () => {
    if (!storyData || storyData.source !== 'wikipedia') return;
    setIsEnhancing(true);
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/enhance-story`,
        {
          placeName: storyData.location,
          initialText: storyData.story,
          coordinates: storyData.coordinates,
        }
      );
      setStoryData(response.data);
    } catch (error) {
      Alert.alert(t('errorTitle'), t('errorEnhanceStory'));
    } finally {
      setIsEnhancing(false);
    }
  }, [storyData, t]);

  const handleShare = async () => {
    if (!storyData) return;
    try {
      await Share.share({
        message: `Check out this story about ${storyData.title} in the Storytelling App!`,
      });
    } catch (error) {
      Alert.alert('Sharing failed.');
    }
  };

  const handleLike = async () => {
    if (storyData?.source !== 'database' || !storyData.storyId || !userId)
      return;
    const originalLiked = isLiked;
    setIsLiked(!originalLiked);
    setLikesCount((prev) => (originalLiked ? prev - 1 : prev + 1));
    try {
      await axios({
        method: originalLiked ? 'DELETE' : 'POST',
        url: `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/stories/${storyData.storyId}/like`,
        data: { userClerkId: userId },
      });
    } catch (error) {
      setIsLiked(originalLiked);
      setLikesCount((prev) => (originalLiked ? prev + 1 : prev - 1));
      Alert.alert(t('errorTitle'), t('errorLikeUpdate'));
    }
  };

  const handlePostComment = async () => {
    if (
      !storyData ||
      storyData.source !== 'database' ||
      !storyData.storyId ||
      !userId ||
      !commentText.trim()
    )
      return;
    try {
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/stories/${storyData.storyId}/comments`,
        {
          userClerkId: userId,
          text: commentText,
        }
      );
      setCommentsCount((prev) => prev + 1);
      setCommentText('');
      setCommentModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to post comment.');
    }
  };

  if (!storyData) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <Text style={{ color: theme.colors.text }}>
          Failed to load story data.
        </Text>
      </View>
    );
  }

  const commentInputRef = React.useRef<TextInput>(null);

  return (
    <Modal
      visible={true}
      animationType="slide"
      onRequestClose={() => router.back()}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleSection}>
          <View
            style={[
              styles.titleCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.storyTitle, { color: theme.colors.text }]}>
              {storyData.title}
            </Text>
            <View style={styles.locationInfo}>
              <MapPin size={16} color={theme.colors.primary} />
              <Text
                style={[styles.locationText, { color: theme.colors.primary }]}
              >
                {storyData.location}
              </Text>
            </View>
            <View style={styles.storyMeta}>
              {storyData.readTime && (
                <View style={styles.metaItem}>
                  <Clock size={14} color={theme.colors.textSecondary} />
                  <Text
                    style={[
                      styles.metaText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {' '}
                    {storyData.readTime}
                  </Text>
                </View>
              )}
              {storyData.source === 'database' && (
                <View style={styles.metaItem}>
                  <BookOpen size={14} color={theme.colors.textSecondary} />
                  <Text
                    style={[
                      styles.metaText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {' '}
                    {t('story')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {coordinates && (
          <View style={styles.mapSection}>
            <MapView
              style={styles.map}
              initialRegion={{
                ...coordinates,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={coordinates}
                pinColor={theme.colors.primary}
              />
            </MapView>
          </View>
        )}
        <View style={styles.storySection}>
          <Text style={[styles.storyContent, { color: theme.colors.text }]}>
            {storyData.story}
          </Text>
        </View>

        {storyData.funFacts && storyData.funFacts.length > 0 && (
          <View style={styles.factsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('interestingFacts')}
            </Text>
            {storyData.funFacts.map((fact, index) => (
              <View key={index} style={styles.factItem}>
                <Star
                  size={16}
                  color={theme.colors.warning}
                  style={styles.factIcon}
                />
                <Text
                  style={[
                    styles.factText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {fact}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.interactionSection}>
          {storyData.source === 'database' ? (
            <View
              style={[
                styles.interactionCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.interactionRow}>
                <TouchableOpacity
                  style={styles.interactionButton}
                  onPress={handleLike}
                >
                  <Heart
                    size={20}
                    color={
                      isLiked ? theme.colors.error : theme.colors.textSecondary
                    }
                    fill={isLiked ? theme.colors.error : 'transparent'}
                  />
                  <Text
                    style={[
                      styles.interactionText,
                      {
                        color: isLiked
                          ? theme.colors.error
                          : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {likesCount}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.interactionButton}
                  onPress={() => setCommentModalVisible(true)}
                >
                  <MessageCircle size={20} color={theme.colors.textSecondary} />
                  <Text
                    style={[
                      styles.interactionText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {commentsCount}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.interactionButton}
                  onPress={handleShare}
                >
                  <Share2 size={20} color={theme.colors.textSecondary} />
                  <Text
                    style={[
                      styles.interactionText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {t('share')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.enhanceButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleEnhance}
              disabled={isEnhancing}
            >
              {isEnhancing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Zap size={20} color="#fff" />
                  <Text style={styles.enhanceButtonText}>
                    {t('enhanceCta')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        {storyData.relatedQuests && storyData.relatedQuests.length > 0 && (
          <View style={styles.questsSection}>...</View>
        )}
      </ScrollView>

      {/* Модальное окно для комментариев с KeyboardAvoidingView */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCommentModalVisible}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setCommentModalVisible(false)}
          >
            <TouchableOpacity
              style={[
                styles.modalContent,
                { backgroundColor: theme.colors.card },
              ]}
              activeOpacity={1}
            >
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {t('commentsTitle')}
              </Text>
              <TextInput
                ref={commentInputRef}
                style={[
                  styles.commentInput,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder={t('commentsPlaceholder')}
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity
                style={[
                  styles.postButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handlePostComment}
              >
                <Text style={styles.buttonText}>{t('commentsPost')}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flexContainer: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingBottom: 40 },
  titleSection: { paddingHorizontal: 20, marginBottom: 24, marginTop: 40 },
  titleCard: { padding: 24, borderRadius: 20, borderWidth: 1 },
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
  locationText: { fontSize: 16, fontWeight: '600' },
  storyMeta: { flexDirection: 'row', gap: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14, fontWeight: '600' },
  mapSection: { height: 200, marginVertical: 20 },
  map: { flex: 1 },
  storySection: { paddingHorizontal: 20, marginBottom: 32 },
  storyContent: { fontSize: 16, lineHeight: 26, fontWeight: '400' },
  factsSection: { paddingHorizontal: 20, marginBottom: 32 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  factItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingRight: 16,
  },
  factIcon: { marginRight: 12, marginTop: 4 },
  factText: { flex: 1, fontSize: 16, lineHeight: 24 },
  interactionSection: { paddingHorizontal: 20, marginBottom: 32 },
  interactionCard: {
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
  },
  interactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    flex: 1,
    justifyContent: 'center',
  },
  interactionText: { fontSize: 14, fontWeight: '600' },
  enhanceButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 16,
  },
  enhanceButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  questsSection: { paddingHorizontal: 20, marginBottom: 32 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: { padding: 20, borderRadius: 10, margin: 20 },
  modalTitle: { fontSize: 18, marginBottom: 10 },
  commentInput: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    minHeight: 100,
  },
  postButton: { padding: 10, borderRadius: 5, marginTop: 10 },
  buttonText: { color: '#fff', textAlign: 'center' },
});

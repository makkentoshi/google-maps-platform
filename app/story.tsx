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
  Linking,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  TabView,
  SceneMap,
  TabBar,
  SceneRendererProps,
  Route,
  NavigationState,
} from 'react-native-tab-view';
import {
  Zap,
  Heart,
  MessageCircle,
  Share2,
  Clock,
  BookOpen,
  MapPin,
  Star,
  Target,
  Play,
  Pause,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@clerk/clerk-expo';
import axios from 'axios';
import TextGenerationLoader from '@/app/components/TextGenerationLoader';
import CommentSection from '@/app/components/CommentSection';

const { width } = Dimensions.get('window');

type StoryData = {
  source: 'database' | 'generated';
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
  country?: string;
  city?: string;
  distance?: string;
  style?: string;
  sources?: string[];
  isEnhanced?: boolean;
};

type MyRoute = Route & {
  key: string;
  title: string;
};

const Tts = {
  setDefaultLanguage: (lang: string) =>
    console.log(`Mock TTS: Setting language to ${lang}`),
  speak: (text: string) =>
    console.log(`Mock TTS: Speaking - ${text.substring(0, 50)}...`),
  stop: () => console.log('Mock TTS: Stopped'),
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
  const [isPlayingTts, setIsPlayingTts] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('narrative');
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'story', title: t('story', 'Story') },
    { key: 'playground', title: t('playground', 'Playground') },
  ]);

  useEffect(() => {
    setIsLiked(storyData?.isLiked ?? false);
    setLikesCount(storyData?.likes ?? 0);
    setCommentsCount(storyData?.comments ?? 0);
    Tts.setDefaultLanguage('en-US');
    return () => {
      Tts.stop();
    };
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
    if (!storyData || storyData.source !== 'generated' || storyData.isEnhanced)
      return;
    setIsEnhancing(true);
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/enhance-story`,
        {
          placeName: storyData.location,
          initialText: storyData.story,
          coordinates: storyData.coordinates,
          style: selectedStyle,
        },
        { headers: { 'x-clerk-user-id': userId } }
      );
      setStoryData(response.data);
    } catch (error: any) {
      console.error(
        'Enhance story error:',
        error.response?.data || error.message
      );
      Alert.alert(
        t('errorTitle', 'Error'),
        t('errorEnhanceStory', 'Failed to generate story.')
      );
    } finally {
      setIsEnhancing(false);
    }
  }, [storyData, selectedStyle, t, userId]);

  const handleShare = async () => {
    if (!storyData) return;
    try {
      await Share.share({
        message: `Check out this story about ${storyData.title} in the Storytelling App!`,
      });
    } catch (error: any) {
      console.error('Share error:', error.message);
      Alert.alert(t('errorTitle', 'Error'), 'Sharing failed.');
    }
  };

  const handleLike = async () => {
    if (storyData?.source !== 'database' || !storyData.storyId || !userId) {
      Alert.alert(
        t('errorTitle', 'Error'),
        t('errorLikeUpdate', 'Cannot like this story.')
      );
      return;
    }
    const originalLiked = isLiked;
    setIsLiked(!originalLiked);
    setLikesCount((prev) => (originalLiked ? prev - 1 : prev + 1));
    try {
      const response = await axios({
        method: originalLiked ? 'DELETE' : 'POST',
        url: `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/stories/${storyData.storyId}/like`,
        data: { userClerkId: userId },
        headers: { 'x-clerk-user-id': userId },
      });
      if (response.status === 201 || response.status === 200) {
        setShowLikeAnimation(true);
        setTimeout(() => setShowLikeAnimation(false), 1000);
      }
    } catch (error: any) {
      console.error('Like error:', error.response?.data || error.message);
      setIsLiked(originalLiked);
      setLikesCount((prev) => (originalLiked ? prev + 1 : prev - 1));
      Alert.alert(
        t('errorTitle', 'Error'),
        error.response?.data?.message ||
          t('errorLikeUpdate', 'Failed to update like status.')
      );
    }
  };

  const handlePostComment = async () => {
    if (
      !storyData ||
      storyData.source !== 'database' ||
      !storyData.storyId ||
      !userId ||
      !commentText.trim()
    ) {
      Alert.alert(
        t('errorTitle', 'Error'),
        t('errorComment', 'Cannot post comment.')
      );
      return;
    }
    try {
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/stories/${storyData.storyId}/comment`,
        { userClerkId: userId, text: commentText },
        { headers: { 'x-clerk-user-id': userId } }
      );
      setCommentsCount((prev) => prev + 1);
      setCommentText('');
      setCommentModalVisible(false);
    } catch (error: any) {
      console.error('Comment error:', error.response?.data || error.message);
      Alert.alert(
        t('errorTitle', 'Error'),
        error.response?.data?.message ||
          t('errorComment', 'Failed to post comment.')
      );
    }
  };

  const handleSourcePress = async (url: string) => {
    try {
      const validUrl =
        url.startsWith('http://') || url.startsWith('https://')
          ? url
          : `https://${url}`;
      const supported = await Linking.canOpenURL(validUrl);
      if (supported) {
        await Linking.openURL(validUrl);
      } else {
        Alert.alert(
          t('errorTitle', 'Error'),
          t('errorInvalidUrl', 'Cannot open this URL.')
        );
      }
    } catch (error: any) {
      console.error('Source link error:', error.message);
      Alert.alert(
        t('errorTitle', 'Error'),
        t('errorInvalidUrl', 'Invalid URL.')
      );
    }
  };

  const handleTts = () => {
    if (!storyData?.story) return;
    if (isPlayingTts) {
      Tts.stop();
      setIsPlayingTts(false);
    } else {
      Tts.speak(storyData.story);
      setIsPlayingTts(true);
    }
  };

  const StoryTab = () => (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
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
            {storyData?.title}
          </Text>
          <View style={styles.locationInfo}>
            <MapPin size={16} color={theme.colors.primary} />
            <Text
              style={[styles.locationText, { color: theme.colors.primary }]}
            >
              {storyData?.location}
            </Text>
          </View>
          <View style={styles.storyMeta}>
            {storyData?.readTime && (
              <View style={styles.metaItem}>
                <Clock size={14} color={theme.colors.textSecondary} />
                <Text
                  style={[
                    styles.metaText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {storyData.readTime}
                </Text>
              </View>
            )}
            {storyData?.country && storyData.city && (
              <View style={styles.metaItem}>
                <MapPin size={14} color={theme.colors.textSecondary} />
                <Text
                  style={[
                    styles.metaText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Located: {storyData.country}, {storyData.city}
                </Text>
              </View>
            )}
            {storyData?.distance && (
              <View style={styles.metaItem}>
                <Target size={14} color={theme.colors.textSecondary} />
                <Text
                  style={[
                    styles.metaText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {storyData.distance} to {storyData.title}
                </Text>
              </View>
            )}
            {storyData?.source === 'database' && (
              <View style={styles.metaItem}>
                <BookOpen size={14} color={theme.colors.textSecondary} />
                <Text
                  style={[
                    styles.metaText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {storyData.isEnhanced
                    ? t('fullStory', 'Full Story')
                    : t('previewStory', 'Story Preview')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {coordinates && (
        <View style={styles.mapSection}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              ...coordinates,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker coordinate={coordinates} pinColor={theme.colors.primary} />
          </MapView>
        </View>
      )}

      <View style={styles.storySection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('story', 'Story')}
        </Text>
        <Text style={[styles.storyContent, { color: theme.colors.text }]}>
          {storyData?.story}
        </Text>
      </View>

      {storyData?.funFacts && storyData.funFacts.length > 0 && (
        <View style={styles.factsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('interestingFacts', 'Interesting Facts')}
          </Text>
          {storyData.funFacts.map((fact, index) => (
            <View key={index} style={styles.factItem}>
              <Star
                size={16}
                color={theme.colors.warning}
                style={styles.factIcon}
              />
              <Text
                style={[styles.factText, { color: theme.colors.textSecondary }]}
              >
                {fact}
              </Text>
            </View>
          ))}
        </View>
      )}

      {storyData?.sources && storyData.sources.length > 0 && (
        <View style={styles.sourcesSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('sources', 'Sources')}
          </Text>
          {storyData.sources.map((source, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.sourceButton,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => handleSourcePress(source)}
            >
              <Text
                style={[styles.sourceText, { color: theme.colors.primary }]}
              >
                {source}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <CommentSection
        storyId={storyData?.storyId}
        commentsCount={commentsCount}
        setCommentsCount={setCommentsCount}
      />
    </ScrollView>
  );

  const PlaygroundTab = () => (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, padding: 20 },
      ]}
    >
      {!storyData?.isEnhanced && (
        <>
          <View style={styles.stylePicker}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('textStyle', 'Text Style')}
            </Text>
            <Picker
              selectedValue={selectedStyle}
              style={[styles.picker, { color: theme.colors.text }]}
              onValueChange={(itemValue) => setSelectedStyle(itemValue)}
            >
              <Picker.Item label="Narrative" value="narrative" />
              <Picker.Item label="Fairy Tale" value="fairy_tale" />
              <Picker.Item label="Business" value="business" />
            </Picker>
          </View>
          <TouchableOpacity
            style={[
              styles.enhanceButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleEnhance}
            disabled={isEnhancing}
          >
            <Text style={[styles.enhanceButtonText, { color: '#fff' }]}>
              {t('generateStory', 'Generate Full Story')}
            </Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity style={styles.ttsButton} onPress={handleTts}>
        {isPlayingTts ? (
          <Pause size={20} color={theme.colors.text} />
        ) : (
          <Play size={20} color={theme.colors.text} />
        )}
        <Text style={[styles.buttonText, { color: theme.colors.text }]}>
          {isPlayingTts
            ? t('pauseStory', 'Pause Story')
            : t('playStory', 'Play Story')}
        </Text>
      </TouchableOpacity>
      {isEnhancing && (
        <View style={styles.loaderContainer}>
          <TextGenerationLoader visible={isEnhancing} />
        </View>
      )}
    </View>
  );

  const renderScene = SceneMap({
    story: StoryTab,
    playground: PlaygroundTab,
  });

  if (!storyData) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={{ color: theme.colors.text }}>
          {t('errorLoadStory', 'Failed to load story data.')}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flexContainer}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width }}
        renderTabBar={(
          props: SceneRendererProps & {
            navigationState: NavigationState<MyRoute>;
          }
        ) => (
          <TabBar
            {...props}
            style={{ backgroundColor: theme.colors.card }}
            indicatorStyle={{ backgroundColor: theme.colors.primary }}
            activeColor={theme.colors.primary}
            inactiveColor={theme.colors.text}
            // labelStyle={{ fontWeight: 'bold' }}
          />
        )}
      />
      {storyData.isEnhanced && (
        <View
          style={[
            styles.interactionSection,
            { paddingHorizontal: 20, backgroundColor: theme.colors.background },
          ]}
        >
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
                  {t('share', 'Share')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCommentModalVisible}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
                {t('commentsTitle', 'Leave a Comment')}
              </Text>
              <ScrollView
                style={styles.modalScroll}
                keyboardShouldPersistTaps="handled"
              >
                <TextInput
                  style={[
                    styles.commentInput,
                    {
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder={t(
                    'commentsPlaceholder',
                    'Share your thoughts...'
                  )}
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  value={commentText}
                  onChangeText={setCommentText}
                  autoFocus={true}
                />
              </ScrollView>
              <TouchableOpacity
                style={[
                  styles.postButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handlePostComment}
              >
                <Text style={styles.buttonText}>
                  {t('commentsPost', 'Post')}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLikeAnimation}
        onRequestClose={() => setShowLikeAnimation(false)}
      >
        <View style={styles.likeAnimationOverlay}>
          <Heart
            size={100}
            color={theme.colors.error}
            fill={theme.colors.error}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flexContainer: { flex: 1 },
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingTop: 60, paddingBottom: 40 },
  titleSection: { paddingHorizontal: 20, marginBottom: 24, marginTop: 40 },
  titleCard: { padding: 24, borderRadius: 20, borderWidth: 1 },
  storyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    lineHeight: 36,
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },

  locationText: { fontSize: 16, fontWeight: '600' },
  labelStyle: { fontSize: 16, fontWeight: '600', color: '#333' },
  storyMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    alignItems: 'center',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14, fontWeight: '600' },
  mapSection: {
    height: 200,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
  },
  map: { ...StyleSheet.absoluteFillObject },
  storySection: { paddingHorizontal: 20, marginBottom: 32 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  storyContent: { fontSize: 16, lineHeight: 26, fontWeight: '400' },
  factsSection: { paddingHorizontal: 20, marginBottom: 32 },
  factItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingRight: 16,
  },
  factIcon: { marginRight: 12, marginTop: 4 },
  factText: { flex: 1, fontSize: 16, lineHeight: 24 },
  sourcesSection: { paddingHorizontal: 20, marginBottom: 32 },
  sourceButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  sourceText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
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
    height: 52,
  },
  enhanceButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  ttsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  stylePicker: { marginBottom: 16 },
  picker: { height: 50, width: 200 },
  questsSection: { paddingHorizontal: 20, marginBottom: 32 },
  questItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingRight: 16,
  },
  questTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  questDescription: { fontSize: 14, lineHeight: 22 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalScroll: { maxHeight: 200 },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  commentInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  postButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  likeAnimationOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

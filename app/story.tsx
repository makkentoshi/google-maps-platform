import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Share,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Image,
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
  ArrowLeft,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@clerk/clerk-expo';
import axios from 'axios';
import TextGenerationLoader from '@/app/components/TextGenerationLoader';
import CommentSection from '@/app/components/CommentSection';
import { Linking } from 'react-native';

const { width } = Dimensions.get('window');

type StoryData = {
  source: 'database' | 'generated';
  storyId?: string;
  placeId?: string;
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
  photos?: string[];
  id?: string; // For database stories
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
  const [routes] = useState<MyRoute[]>([
    { key: 'story', title: t('story', 'Full Story') },
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

  // Fetch photos if we have a placeId
  useEffect(() => {
    const fetchPhotos = async () => {
      if (
        storyData?.placeId &&
        (!storyData.photos || storyData.photos.length === 0)
      ) {
        try {
          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/details/json`,
            {
              params: {
                place_id: storyData.placeId,
                fields: 'photos',
                key: process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY,
              },
            }
          );

          if (response.data.result?.photos) {
            const photoUrls = response.data.result.photos
              .slice(0, 5)
              .map(
                (photo: any) =>
                  `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY}`
              );
            setStoryData((prev) =>
              prev ? { ...prev, photos: photoUrls } : null
            );
          }
        } catch (error) {
          console.error('Failed to fetch photos:', error);
        }
      }
    };

    fetchPhotos();
  }, [storyData?.placeId]);

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
    if (!storyData || storyData.isEnhanced) {
      console.log(
        '[DEBUG] Выход из handleEnhance: нет данных или история уже полная.'
      );
      return;
    }

    if (
      !storyData.coordinates ||
      typeof storyData.coordinates !== 'string' ||
      !storyData.coordinates.includes(',')
    ) {
      console.error(
        'Invalid coordinates for enhancement:',
        storyData.coordinates
      );
      Alert.alert(
        t('errorTitle', 'Error'),
        t(
          'errorInvalidCoordinates',
          'Cannot enhance story without valid coordinates.'
        )
      );
      return;
    }

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
        t('errorEnhanceStory', 'Failed to enhance story.')
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
    console.log(
      '[DEBUG] Попытка лайка. Данные истории:',
      JSON.stringify(storyData, null, 2)
    );
    const storyId = storyData?.id || storyData?.storyId;
    if (storyData?.source !== 'database' || !storyId) {
      Alert.alert(
        t('errorTitle', 'Error'),
        t('errorLikeUpdate', 'Cannot like this story.')
      );
      return;
    }

    if (!userId) {
      Alert.alert(
        t('errorTitle', 'Error'),
        t('loginRequired', 'Please log in to like stories.')
      );
      return;
    }

    const originalLiked = isLiked;
    setIsLiked(!originalLiked);
    setLikesCount((prev) => (originalLiked ? prev - 1 : prev + 1));

    try {
      const response = await axios({
        method: originalLiked ? 'DELETE' : 'POST',
        url: `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/stories/${storyId}/like`,
        data: { userClerkId: userId },
        headers: {
          'x-clerk-user-id': userId,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 201 || response.status === 200) {
        setShowLikeAnimation(true);
        setTimeout(() => setShowLikeAnimation(false), 1000);
      }
    } catch (error: any) {
      console.error('Like error:', error.response?.data || error.message);
      setIsLiked(originalLiked);
      setLikesCount((prev) => (originalLiked ? prev + 1 : prev - 1));

      let errorMessage = t('errorLikeUpdate', 'Failed to update like status.');
      if (error.response?.status === 401) {
        errorMessage = t('loginRequired', 'Please log in to like stories.');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert(t('errorTitle', 'Error'), errorMessage);
    }
  };

  const handlePostComment = async () => {
    const storyId = storyData?.id || storyData?.storyId;
    if (storyData?.source !== 'database' || !storyId) {
      Alert.alert(
        t('errorTitle', 'Error'),
        t('errorComment', 'Cannot post comment.')
      );
      return;
    }

    if (!userId) {
      Alert.alert(
        t('errorTitle', 'Error'),
        t('loginRequired', 'Please log in to post comments.')
      );
      return;
    }

    if (!commentText.trim()) {
      Alert.alert(
        t('errorTitle', 'Error'),
        t('commentRequired', 'Please enter a comment.')
      );
      return;
    }

    try {
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/stories/${storyId}/comment`,
        { userClerkId: userId, text: commentText },
        {
          headers: {
            'x-clerk-user-id': userId,
            'Content-Type': 'application/json',
          },
        }
      );
      setCommentsCount((prev) => prev + 1);
      setCommentText('');
      setCommentModalVisible(false);
    } catch (error: any) {
      console.error('Comment error:', error.response?.data || error.message);

      let errorMessage = t('errorComment', 'Failed to post comment.');
      if (error.response?.status === 401) {
        errorMessage = t('loginRequired', 'Please log in to post comments.');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert(t('errorTitle', 'Error'), errorMessage);
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

  const StoryTab = () => {
    const data = [
      { type: 'title' },
      ...(storyData?.photos && storyData.photos.length > 0
        ? [{ type: 'photos' }]
        : []),
      ...(coordinates ? [{ type: 'map' }] : []),
      { type: 'story' },
      ...(storyData?.funFacts && storyData.funFacts.length > 0
        ? [{ type: 'facts' }]
        : []),
      ...(storyData?.sources && storyData.sources.length > 0
        ? [{ type: 'sources' }]
        : []),
      { type: 'comments' },
    ];

    const renderItem = ({ item }: { item: { type: string } }) => {
      switch (item.type) {
        case 'title':
          return (
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
                    style={[
                      styles.locationText,
                      { color: theme.colors.primary },
                    ]}
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
          );
        case 'photos':
          if (!storyData?.photos || storyData.photos.length === 0) return null;
          return (
            <View style={styles.photosSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                📸 {t('photos', 'Photos')}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.photosContainer}
              >
                {storyData.photos.map((photo, index) => (
                  <TouchableOpacity key={index} style={styles.photoContainer}>
                    <Image
                      source={{ uri: photo }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        case 'map':
          if (!coordinates) return null;
          return (
            <View style={styles.mapSection}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: coordinates.latitude,
                  longitude: coordinates.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                  }}
                  pinColor={theme.colors.primary}
                />
              </MapView>
            </View>
          );
        case 'story':
          return (
            <View style={styles.storySection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                📖 {t('story', 'Story')}
              </Text>
              <Text style={[styles.storyContent, { color: theme.colors.text }]}>
                {storyData?.story ||
                  t('noDescription', 'No description available')}
              </Text>
            </View>
          );
        case 'facts':
          if (!storyData?.funFacts) return null;
          return (
            <View style={styles.factsSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                🌟 {t('interestingFacts', 'Interesting Facts')}
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
          );
        case 'sources':
          if (!storyData?.sources) return null;
          return (
            <View style={styles.sourcesSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                🔗 {t('sources', 'Sources')}
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
          );
        case 'comments':
          return (
            <CommentSection
              storyId={storyData?.storyId}
              commentsCount={commentsCount}
              setCommentsCount={setCommentsCount}
            />
          );
        default:
          return null;
      }
    };

    return (
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={styles.scrollContent}
      />
    );
  };

  const PlaygroundTab = () => {
    /* */
    const [localStory, setLocalStory] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const storyStyles = ['narrative', 'fairy_tale', 'business'];
    /* */

    const handleGenerateStory = useCallback(async () => {
      if (!storyData) return;
      setIsGenerating(true);
      try {
        // Use your backend API instead of direct Google API call
        const response = await axios.post(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/generate-story`,
          {
            placeName: storyData.location,
            originalStory: storyData.story,
            style: selectedStyle,
            coordinates: storyData.coordinates,
          },
          {
            headers: {
              'x-clerk-user-id': userId,
              'Content-Type': 'application/json',
            },
          }
        );

        const generatedText =
          response.data.story || response.data.generatedText;
        setLocalStory(generatedText || 'Generated story unavailable');
      } catch (error: any) {
        console.error(
          'Generate story error:',
          error.response?.data || error.message
        );

        let errorMessage = t('errorGenerateStory', 'Failed to generate story.');
        if (error.response?.status === 503) {
          errorMessage = t(
            'serviceOverloaded',
            'Service is temporarily overloaded. Please try again later.'
          );
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }

        Alert.alert(t('errorTitle', 'Error'), errorMessage);
      } finally {
        setIsGenerating(false);
      }
    }, [storyData, selectedStyle, t, userId]);

    const handleCopyText = () => {
      if (localStory) {
        // Clipboard.setString(localStory); // Для этого нужен import { Clipboard } from 'react-native';
        Alert.alert(
          t('copied', 'Copied!'),
          t(
            'storyCopied',
            'The generated story has been copied to your clipboard.'
          )
        );
      }
    };

    return (
      <View
        style={[
          styles.playgroundContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ScrollView contentContainerStyle={styles.playgroundScrollContent}>
          {!storyData?.isEnhanced && (
            <>
              <TouchableOpacity
                style={[
                  styles.enhanceButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleEnhance}
                disabled={isEnhancing}
              >
                <Text style={[styles.enhanceButtonText, { color: '#fff' }]}>
                  🚀 {t('generateFullStory', 'Generate Full Story')}
                </Text>
              </TouchableOpacity>
              {isEnhancing && (
                <View style={styles.loaderContainer}>
                  <TextGenerationLoader visible={isEnhancing} />
                </View>
              )}
            </>
          )}
          <View style={styles.stylePicker}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              ✍️ {t('textStyle', 'Text Style')}
            </Text>
            {/* --- НАЧАЛО ИЗМЕНЕНИЙ: КНОПКИ ВМЕСТО PICKER --- */}
            <View style={styles.styleButtonsContainer}>
              {storyStyles.map((style) => (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.styleButton,
                    {
                      backgroundColor:
                        selectedStyle === style
                          ? theme.colors.primary
                          : theme.colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedStyle(style)}
                >
                  <Text
                    style={[
                      styles.styleButtonText,
                      {
                        color:
                          selectedStyle === style
                            ? '#FFFFFF'
                            : theme.colors.text,
                      },
                    ]}
                  >
                    {style.charAt(0).toUpperCase() +
                      style.slice(1).replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {localStory && (
            <View style={styles.generatedStory}>
              <View style={styles.generatedStoryHeader}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.text, marginBottom: 0 },
                  ]}
                >
                  📖 {t('generatedStory', 'Generated Story')}
                </Text>
                {/* --- НАЧАЛО ИЗМЕНЕНИЙ: КНОПКА КОПИРОВАТЬ --- */}
                <TouchableOpacity
                  onPress={handleCopyText}
                  style={styles.copyButton}
                >
                  <Text style={{ color: theme.colors.primary }}>
                    {t('copy', 'Copy')}
                  </Text>
                </TouchableOpacity>
                {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
              </View>
              <Text
                style={[
                  styles.storyContent,
                  { color: theme.colors.text, marginTop: 16 },
                ]}
              >
                {localStory}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Этот блок теперь находится вне ScrollView и будет прижат к низу */}
        <View style={styles.bottomActionsContainer}>
          <TouchableOpacity
            style={[
              styles.enhanceButton,
              { backgroundColor: theme.colors.primary, marginBottom: 10 }, // Убрали верхний отступ, добавили нижний
            ]}
            onPress={handleGenerateStory}
            disabled={isGenerating}
          >
            <Text style={[styles.enhanceButtonText, { color: '#fff' }]}>
              ✨ {t('generateStory', 'Generate Story')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ttsButton} onPress={handleTts}>
            {isPlayingTts ? (
              <Pause size={20} color={theme.colors.text} />
            ) : (
              <Play size={20} color={theme.colors.text} />
            )}
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>
              {isPlayingTts
                ? `⏸️ ${t('pauseStory', 'Pause Story')}`
                : `▶️ ${t('playStory', 'Play Story')}`}
            </Text>
          </TouchableOpacity>
        </View>

        {isGenerating && (
          <View style={styles.loaderContainer}>
            <TextGenerationLoader visible={isGenerating} />
          </View>
        )}
      </View>
    );
  };

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
    <SafeAreaView
      style={[
        styles.flexContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
          <Text style={[styles.backButtonText, { color: theme.colors.text }]}>
            {t('back', 'Back')}
          </Text>
        </TouchableOpacity>
      </View>

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
          />
        )}
      />

      {storyData?.isEnhanced && (
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

      {/* Comment Modal */}
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
              <TextInput
                style={[
                  styles.commentInput,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder={t('commentsPlaceholder', 'Share your thoughts...')}
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                value={commentText}
                onChangeText={setCommentText}
                autoFocus={true}
              />
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

      {/* Like Animation Modal */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flexContainer: { flex: 1 },
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: { paddingTop: 20, paddingBottom: 40 },
  titleSection: { paddingHorizontal: 20, marginBottom: 24, marginTop: 10 },
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
  storyMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    alignItems: 'center',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14, fontWeight: '600' },
  photosSection: { paddingHorizontal: 20, marginBottom: 32 },
  photosContainer: {
    marginTop: 16,
  },
  photoContainer: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
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
  playgroundContent: {
    padding: 20,
    paddingTop: 0,
  },
  playgroundContainer: {
    flex: 1, // Занимает все доступное пространство таба
  },
  playgroundScrollContent: {
    padding: 20,
    paddingBottom: 10, // Уменьшаем нижний отступ, т.к. кнопки теперь отдельно
  },
  bottomActionsContainer: {
    padding: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: 'transparent',
  },
  stylePicker: {
    marginBottom: 20,
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#000',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  styleButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  styleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  styleButtonText: {
    fontWeight: '600',
  },
  generatedStoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyButton: {
    padding: 8,
  },
  enhanceButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  enhanceButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ttsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  generatedStory: { marginBottom: 20 },
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
  likeAnimationOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

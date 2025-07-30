import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@clerk/clerk-expo';
import axios from 'axios';
import { MapPin } from 'lucide-react-native';
import { Alert } from 'react-native';

type Story = {
  storyId: string;
  title: string;
  location: string;
  likes: number;
  comments: number;
};

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

export default function SearchScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { userId } = useAuth();

  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Исправляем API endpoint - используем тот же что и в map.tsx
  const fetchStories = useCallback(async () => {
    try {
      // Используем places API вместо stories API
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/places/popular`
        // Убираем заголовки авторизации как в исправленном map.tsx
      );
      
      // Адаптируем данные places под формат stories
      const placesData = Array.isArray(response.data.places) 
        ? response.data.places 
        : [];
        
      const storiesData = placesData.map((place: any) => ({
        storyId: place.id,
        title: place.title || place.name,
        location: place.location || place.title || place.name,
        likes: place.likes || 0,
        comments: place.comments || 0,
      }));
      
      const sortedStories = storiesData.sort((a: Story, b: Story) =>
        a.title.localeCompare(b.title)
      );
      setStories(sortedStories);
      setFilteredStories(sortedStories);
    } catch (error) {
      console.error('Fetch stories error:', error);
      Alert.alert(
        t('errorTitle', 'Error'),
        t('errorFetchStories', 'Failed to fetch stories.')
      );
    }
  }, [t]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Добавляем функцию поиска
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStories(stories);
    } else {
      const filtered = stories.filter((story) =>
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStories(filtered);
    }
  }, [searchQuery, stories]);

  const handleStoryPress = (story: Story) => {
    // Используем тот же подход что и в map.tsx
    router.push({
      pathname: '/story',
      params: {
        data: JSON.stringify({
          id: story.storyId,
          source: 'database',
          title: story.title,
          location: story.location,
          story: `Story about ${story.title}...`,
          likes: story.likes,
          comments: story.comments,
          isLiked: false,
        }),
      },
    });
  };

  const renderStoryItem = ({ item }: { item: Story }) => (
    <TouchableOpacity
      style={[
        styles.storyItem,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() => handleStoryPress(item)}
    >
      <Text style={[styles.storyTitle, { color: theme.colors.text }]}>
        {item.title}
      </Text>
      <View style={styles.locationRow}>
        <MapPin size={16} color={theme.colors.primary} />
        <Text style={[styles.locationText, { color: theme.colors.primary }]}>
          {item.location}
        </Text>
      </View>
      <View style={styles.statsRow}>
        <Text style={[styles.statsText, { color: theme.colors.textSecondary }]}>
          {item.likes} likes • {item.comments} comments
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          },
        ]}
        placeholder={t('searchPlaceholder', 'Search stories...')}
        placeholderTextColor={theme.colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredStories}
        renderItem={renderStoryItem}
        keyExtractor={(item) => item.storyId}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  searchInput: {
    margin: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  storyItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
  },
});
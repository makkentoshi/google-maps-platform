import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Star } from 'lucide-react-native';

type Place = {
  id: string;
  placeId: string;
  name: string;
  description: string | null;
  location: string | null;
  coordinates: string | null;
  city: string | null;
  country: string | null;
  averageRating: number | null;
  funFact: string | null;
  style: string | null;
  createdAt: string;
  isEnhanced: boolean;
};

export default function SearchScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/search`,
          {
            params: {
              query: searchQuery,
              rating: minRating ? parseFloat(minRating) : undefined,
            },
          }
        );
        setPlaces(response.data.places || []);
      } catch (error: any) {
        console.error('Search error:', error);
        setPlaces([]);
      }
    };

    const debounce = setTimeout(() => {
      if (searchQuery || minRating) {
        fetchPlaces();
      } else {
        setPlaces([]);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, minRating]);

  const renderPlace = ({ item }: { item: Place }) => (
    <TouchableOpacity
      style={[
        styles.placeCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() =>
        router.push({
          pathname: '/story',
          params: {
            data: JSON.stringify({
              source: 'database',
              storyId: item.id,
              title: item.name,
              story: item.description || 'No description available',
              location:
                item.location || `${item.city || ''}, ${item.country || ''}`,
              coordinates: item.coordinates || null,
              funFacts: item.funFact ? [item.funFact] : [],
              city: item.city || '',
              country: item.country || '',
              style: item.style || 'narrative',
              isEnhanced: item.isEnhanced || false,
              likes: 0,
              comments: 0,
              isLiked: false,
            }),
          },
        })
      }
    >
      <Text style={[styles.placeName, { color: theme.colors.text }]}>
        {item.name}
      </Text>
      <Text
        style={[styles.placeDescription, { color: theme.colors.textSecondary }]}
      >
        {item.description || t('noDescription', 'No description available')}
      </Text>
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            color={
              star <= Math.round(item.averageRating || 0)
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
            fill={
              star <= Math.round(item.averageRating || 0)
                ? theme.colors.primary
                : 'none'
            }
          />
        ))}
        <Text
          style={[styles.ratingText, { color: theme.colors.textSecondary }]}
        >
          {item.averageRating?.toFixed(1) ?? '0.0'}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.viewButton, { backgroundColor: theme.colors.primary }]}
        onPress={() =>
          router.push({
            pathname: '/story',
            params: {
              data: JSON.stringify({
                source: 'database',
                storyId: item.id,
                title: item.name,
                story: item.description || 'No description available',
                location:
                  item.location || `${item.city || ''}, ${item.country || ''}`,
                coordinates: item.coordinates || null,
                funFacts: item.funFact ? [item.funFact] : [],
                city: item.city || '',
                country: item.country || '',
                style: item.style || 'narrative',
                isEnhanced: item.isEnhanced || false,
                likes: 0,
                comments: 0,
                isLiked: false,
              }),
            },
          })
        }
      >
        <Text style={styles.viewButtonText}>{t('view', 'View')}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('search', 'Search')}
        </Text>
        <Text
          style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}
        >
          {t('searchSubtitle', 'Find places and stories')}
        </Text>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            { color: theme.colors.text, borderColor: theme.colors.border },
          ]}
          placeholder={t('searchPlaces', 'Search places...')}
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TextInput
          style={[
            styles.ratingInput,
            { color: theme.colors.text, borderColor: theme.colors.border },
          ]}
          placeholder={t('minRating', 'Minimum Rating (1-5)')}
          placeholderTextColor={theme.colors.textSecondary}
          value={minRating}
          onChangeText={setMinRating}
          keyboardType="numeric"
        />
      </View>
      <FlatList
        data={places}
        renderItem={renderPlace}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.resultsContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  searchContainer: {
    padding: 20,
  },
  searchInput: {
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  ratingInput: {
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  placeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  placeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  placeDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    marginLeft: 8,
  },
  viewButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

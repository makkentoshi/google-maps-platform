import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Star, MapPin } from 'lucide-react-native';

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

export default function LeaderboardScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);

  useEffect(() => {
    const fetchTopPlaces = async () => {
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/search`,
          {
            params: {
              rating: 0, // Fetch all places, sorted by rating
            },
          }
        );
        setPlaces(response.data.places || []);
      } catch (error: any) {
        console.error('Fetch top places error:', error);
        setPlaces([]);
      }
    };
    fetchTopPlaces();
  }, []);

  const handlePlacePress = (item: Place) => {
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
    });
  };

  const handleMapPress = (item: Place) => {
    console.log('Map press item:', item); // Debug log
    if (
      item.coordinates &&
      typeof item.coordinates === 'string' &&
      item.coordinates.includes(',')
    ) {
      router.push({
        pathname: '/map',
        params: {
          coordinates: item.coordinates,
        },
      });
    } else {
      console.warn(
        'No valid coordinates for item:',
        item.name,
        item.coordinates
      );
      router.push('/map');
    }
  };

  const renderPlace = ({ item }: { item: Place }) => (
    <TouchableOpacity
      style={[
        styles.placeCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() => handlePlacePress(item)}
    >
      <Text style={[styles.placeName, { color: theme.colors.text }]}>
        {item.name}
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
          style={[styles.placeRating, { color: theme.colors.textSecondary }]}
        >
          {item.averageRating?.toFixed(1) ?? '0.0'}
        </Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.viewButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => handlePlacePress(item)}
        >
          <Text style={styles.viewButtonText}>{t('view', 'View')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mapButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => handleMapPress(item)}
        >
          <MapPin size={16} color={theme.colors.textSecondary} />
          <Text
            style={[
              styles.mapButtonText,
              { color: theme.colors.textSecondary },
            ]}
          >
            {t('onMap', 'On Map')}
          </Text>
        </TouchableOpacity>
      </View>
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
          {t('topPlaces', 'Top Places')}
        </Text>
        <Text
          style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}
        >
          {t('topPlacesSubtitle', 'Discover top-rated places')}
        </Text>
      </View>
      <FlatList
        data={places}
        renderItem={renderPlace}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
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
  listContainer: {
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  placeRating: {
    fontSize: 14,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    alignItems: 'center',
    textAlign: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
});

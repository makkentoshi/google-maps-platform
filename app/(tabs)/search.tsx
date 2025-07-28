import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDebounce } from 'use-debounce';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

type Place = {
  id: string;
  placeId: string;
  title: string;
  location: string;
  coordinates: string | null;
  city: string | null;
  country: string | null;
  description: string | null;
  funFact: string | null;
  likes: number;
  comments: number;
  style: string | null;
  createdAt: string;
  isEnhanced: boolean;
  averageRating?: number;
};

export default function SearchScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery] = useDebounce(searchQuery, 500);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    })();
  }, []);

  const searchPlaces = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (debouncedQuery) {
        params.query = debouncedQuery;
      }
      if (minRating) {
        params.rating = minRating;
      }
      if (userLocation) {
        params.latitude = userLocation.latitude;
        params.longitude = userLocation.longitude;
      }
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/search`, { params });
      setPlaces(response.data.places || []);
    } catch (error: any) {
      console.error('Search error:', error);
      Alert.alert(
        t('errorTitle', 'Error'),
        error.response?.data?.error || t('errorSearch', 'Failed to search places')
      );
      setPlaces([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, minRating, userLocation, t]);

  useEffect(() => {
    searchPlaces();
  }, [debouncedQuery, minRating, searchPlaces]);

  const renderPlace = ({ item }: { item: Place }) => (
    <View style={[styles.placeCard, { backgroundColor: theme.colors.card || '#fff', borderColor: theme.colors.border || '#ccc' }]}>
      <Text style={[styles.placeTitle, { color: theme.colors.text || '#000' }]}>{item.title}</Text>
      <Text style={[styles.placeDescription, { color: theme.colors.textSecondary || '#666' }]}>
        {item.description || 'No description'}
      </Text>
      <Text style={[styles.ratingText, { color: theme.colors.text || '#000' }]}>
        {t('rating', 'Rating')}: {item.averageRating?.toFixed(1) || 'N/A'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background || '#fff' }]}>
      <TextInput
        style={[styles.input, { borderColor: theme.colors.border || '#ccc', color: theme.colors.text || '#000' }]}
        placeholder={t('searchPlaceholder', 'Search places...')}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <TextInput
        style={[styles.input, { borderColor: theme.colors.border || '#ccc', color: theme.colors.text || '#000' }]}
        placeholder={t('minRating', 'Minimum Rating (1-5)')}
        value={minRating}
        onChangeText={setMinRating}
        keyboardType="numeric"
      />
      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary || '#007bff'} />
      ) : (
        <FlatList
          data={places}
          renderItem={renderPlace}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  placeCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  placeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  placeDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
});
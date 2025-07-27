import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import axios from 'axios';
import { MapPin, Filter } from 'lucide-react-native';
import { Linking } from 'react-native';
import MapView from 'react-native-map-clustering';
import { StarRating } from '@/app/components/StarRating';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type Place = {
  id: string;
  placeId: string;
  title: string; // Changed from name to match API
  location: string;
  coordinates: string | null; // Added to match API
  city: string | null;
  country: string | null;
  latitude: number | null; // Keep for fallback
  longitude: number | null; // Keep for fallback
  description: string | null;
  funFact: string | null;
  likes: number;
  comments: number;
  style: string | null;
  createdAt: string;
  isEnhanced: boolean;
  distance?: string;
  rating?: number; // Added for user rating
  averageRating?: number; // Added for average rating
  googleRating?: number; // Added for Google Places API
};

export default function MapScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [filter, setFilter] = useState<
    'popular' | 'recent' | 'historical' | 'nearby'
  >('popular');
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(15);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Animation
  const cardScale = useSharedValue(0);

  useEffect(() => {
    cardScale.value = selectedPlace ? withSpring(1) : withSpring(0);
  }, [selectedPlace]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardScale.value,
  }));

  // Request location permissions
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('errorTitle', 'Error'),
          t('locationPermission', 'Permission to access location was denied')
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, [t]);

  // Fetch places based on filter
  const fetchPlaces = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/places/popular`,
        {
          params: {
            sort: filter === 'recent' ? 'createdAt' : undefined,
            style: filter === 'historical' ? 'narrative' : undefined,
          },
        }
      );
      let fetchedPlaces = Array.isArray(response.data.places)
        ? response.data.places
        : [];
      // Fetch ratings
      fetchedPlaces = await Promise.all(
        fetchedPlaces.map(async (place: any) => {
          const [avgResponse, googleResponse] = await Promise.all([
            axios.get(
              `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/ratings/average?placeId=${place.placeId}`
            ),
            place.googlePlaceId
              ? axios.get(
                  `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/places/google-rating?placeId=${place.googlePlaceId}`
                )
              : Promise.resolve({ data: { googleRating: 0 } }),
          ]);
          return {
            ...place,
            averageRating: avgResponse.data.averageRating,
            googleRating: googleResponse.data.googleRating,
          };
        })
      );
      console.log('Fetched places:', fetchedPlaces);
      setPlaces(fetchedPlaces);
    } catch (error: any) {
      console.error('Fetch places error:', error);
      Alert.alert(
        t('errorTitle', 'Error'),
        error.response?.data?.message ||
          t('errorFetchPlaces', 'Failed to fetch places.')
      );
      setPlaces([]);
    } finally {
      setIsLoading(false);
    }
  }, [filter, t]);

  const fetchNearbyPlaces = useCallback(async () => {
    if (!userLocation) return;
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/places/nearby-places`,
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: 10000,
        }
      );
      let fetchedPlaces = Array.isArray(response.data.places)
        ? response.data.places
        : [];
      fetchedPlaces = await Promise.all(
        fetchedPlaces.map(async (place: any) => {
          const [avgResponse, googleResponse] = await Promise.all([
            axios.get(
              `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/ratings/average?placeId=${place.placeId}`
            ),
            place.googlePlaceId
              ? axios.get(
                  `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/places/google-rating?placeId=${place.googlePlaceId}`
                )
              : Promise.resolve({ data: { googleRating: 0 } }),
          ]);
          return {
            ...place,
            averageRating: avgResponse.data.averageRating,
            googleRating: googleResponse.data.googleRating,
          };
        })
      );
      console.log('Fetched nearby places:', fetchedPlaces);
      setPlaces(fetchedPlaces);
    } catch (error: any) {
      console.error('Fetch nearby places error:', error);
      Alert.alert(
        t('errorTitle', 'Error'),
        error.response?.data?.message ||
          t('errorFetchPlaces', 'Failed to fetch nearby places.')
      );
      setPlaces([]);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation, t]);

  useEffect(() => {
    if (filter === 'nearby') {
      fetchNearbyPlaces();
    } else {
      fetchPlaces();
    }
  }, [filter, fetchPlaces, fetchNearbyPlaces]);

  // Calculate zoom level
  const handleRegionChange = useCallback((region: Region) => {
    const zoom = Math.log2(360 * (width / 256 / region.longitudeDelta)) + 1;
    setZoomLevel(zoom);
  }, []);

  let isMarkerPressed = false;
  // Memoize markers
  const markers = useMemo(() => {
    // Guard against non-array or undefined places
    if (!Array.isArray(places)) {
      console.warn('Places is not an array:', places);
      return [];
    }
    const visiblePlaces = zoomLevel > 15 ? places : places.slice(0, 10);
    return visiblePlaces
      .filter((place) => place.coordinates) // Ensure coordinates exist
      .map((place) => {
        const [latitude, longitude] = place.coordinates!.split(',').map(Number);
        if (isNaN(latitude) || isNaN(longitude)) {
          console.warn('Invalid coordinates for place:', place);
          return null;
        }
        return (
          <Marker
            key={place.id}
            coordinate={{ latitude, longitude }}
            title={place.title}
            onPress={() => {
              console.log('Marker pressed:', place);
              isMarkerPressed = true;
              setSelectedPlace(place);
              setTimeout(() => {
                isMarkerPressed = false;
              }, 100); // Сбрасываем флаг через 100 мс
            }}
            pinColor={theme.colors.primary}
            opacity={zoomLevel > 15 ? 1 : 0.7}
          />
        );
      })
      .filter(Boolean);
  }, [places, zoomLevel, theme.colors.primary]);

  // Navigate to story
  const handleDetailsPress = useCallback(
    async (place: Place) => {
      console.log('Details press for place:', place); // Debug
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/stories/${place.id}`
        );
        console.log('Story response:', response.data); // Debug
        router.push({
          pathname: '/story',
          params: {
            data: JSON.stringify({
              id: response.data.storyId,
              placeId: response.data.placeId,
              source: response.data.source || 'database',
              isEnhanced: response.data.isEnhanced || true,
              title: response.data.title,
              location: response.data.location,
              story:
                response.data.story ||
                response.data.generatedText ||
                place.description ||
                'Preview story for ' + place.title,
              funFacts:
                response.data.funFacts || [place.funFact].filter(Boolean),
              sources: response.data.sources || [],
              city: response.data.city || '',
              country: response.data.country || '',
              coordinates: response.data.coordinates || place.coordinates || '',
              style: response.data.style || 'narrative',
              likes: response.data.likes || 0,
              comments: response.data.comments || 0,
              readTime: response.data.readTime || '',
              isLiked: response.data.isLiked || false,
            }),
          },
        });
      } catch (error: any) {
        console.error('Fetch story error:', error);
        Alert.alert(
          t('errorTitle', 'Error'),
          error.response?.data?.message ||
            t('errorFetchStory', 'Failed to fetch story.')
        );
        // Fallback to place data
        router.push({
          pathname: '/story',
          params: {
            data: JSON.stringify({
              id: place.id,
              placeId: place.placeId,
              source: 'database',
              isEnhanced: place.isEnhanced || false,
              title: place.title,
              location: place.title,
              story: place.description || 'Preview story for ' + place.title,
              funFacts: [place.funFact].filter(Boolean) || [],
              sources: [],
              city: place.city || '',
              country: place.country || '',
              coordinates: place.coordinates || '',
              style: place.style || 'narrative',
              likes: place.likes || 0,
              comments: place.comments || 0,
              readTime: '',
              isLiked: false,
            }),
          },
        });
      }
      setSelectedPlace(null);
    },
    [router, t]
  );

  // Open Google Maps for directions
  const handleDirections = useCallback(
    (place: Place) => {
      console.log('Directions press for place:', place); // Debug
      if (!place.coordinates) {
        Alert.alert(
          t('errorTitle', 'Error'),
          t('invalidCoordinates', 'Invalid coordinates for directions.')
        );
        return;
      }
      const [latitude, longitude] = place.coordinates.split(',').map(Number);
      if (isNaN(latitude) || isNaN(longitude)) {
        Alert.alert(
          t('errorTitle', 'Error'),
          t('invalidCoordinates', 'Invalid coordinates for directions.')
        );
        return;
      }
      const url = Platform.select({
        ios: `maps://?daddr=${latitude},${longitude}&directionsmode=walking`,
        android: `google.navigation:q=${latitude},${longitude}&mode=w`,
      });
      Linking.openURL(url!).catch(() =>
        Alert.alert(
          t('errorTitle', 'Error'),
          t('errorDirections', 'Unable to open Google Maps.')
        )
      );
    },
    [t]
  );

  // Rest of the component remains unchanged
  return (
    <GestureHandlerRootView style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: userLocation?.latitude || 51.5,
          longitude: userLocation?.longitude || -0.12,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onRegionChangeComplete={handleRegionChange}
        onPress={() => {
          if (!isMarkerPressed) {
            console.log('Map pressed');
            setSelectedPlace(null);
          }
        }}
        showsUserLocation={!!userLocation}
      >
        {markers}
      </MapView>

      {selectedPlace && (
        <Animated.View
          style={[
            styles.placeCard,
            {
              backgroundColor: theme.colors.card || '#ffffff',
              borderColor: theme.colors.border || '#ccc',
              zIndex: 1000,
              elevation: 20,
            },
          ]}
        >
          <Text
            style={[styles.placeTitle, { color: theme.colors.text || '#000' }]}
          >
            {selectedPlace.title}
          </Text>
          <Text
            style={[
              styles.placeDescription,
              { color: theme.colors.textSecondary || '#666' },
            ]}
          >
            {selectedPlace.description || 'No description available'}
          </Text>
          {selectedPlace.funFact && (
            <Text
              style={[
                styles.placeFunFact,
                { color: theme.colors.textSecondary || '#666' },
              ]}
            >
              {t('funFact', 'Fun Fact')}: {selectedPlace.funFact}
            </Text>
          )}
          <StarRating
            rating={selectedPlace.rating || 0}
            placeId={selectedPlace.placeId}
            editable={true}
            onRatingChange={(newRating) => {
              setPlaces((prev) =>
                prev.map((p) =>
                  p.id === selectedPlace.id ? { ...p, rating: newRating } : p
                )
              );
            }}
          />
          <Text
            style={[styles.ratingText, { color: theme.colors.text || '#000' }]}
          >
            {t('userRating', 'User Rating')}:{' '}
            {selectedPlace.averageRating?.toFixed(1) || 'N/A'}
          </Text>
          <Text
            style={[styles.ratingText, { color: theme.colors.text || '#000' }]}
          >
            {t('googleRating', 'Google Rating')}:{' '}
            {selectedPlace.googleRating?.toFixed(1) || 'N/A'}
          </Text>
          <View style={styles.placeCardButtons}>
            <TouchableOpacity
              style={[
                styles.cardButton,
                { backgroundColor: theme.colors.primary || '#007bff' },
              ]}
              onPress={() => handleDetailsPress(selectedPlace)}
            >
              <Text style={styles.cardButtonText}>
                {t('details', 'Details')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.cardButton,
                { backgroundColor: theme.colors.primary || '#007bff' },
              ]}
              onPress={() => handleDirections(selectedPlace)}
            >
              <Text style={styles.cardButtonText}>
                {t('directions', 'Directions')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Sidebar and other UI elements remain unchanged */}
      <View style={styles.topBar}>
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setSidebarOpen(true)}
          >
            <Filter size={24} color={theme.colors.text} />
          </TouchableOpacity>
          {isLoading && <ActivityIndicator color={theme.colors.primary} />}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, width: '100%', height: '100%' },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topBar: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  filterBar: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  filterButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  placeCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10, // Для Android
    zIndex: 100, // Для iOS
  },
  ratingText: { fontSize: 14, marginTop: 8 },

  placeTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  placeDescription: { fontSize: 14, marginBottom: 8 },
  placeFunFact: { fontSize: 14, fontStyle: 'italic', marginBottom: 12 },
  placeCardButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  cardButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

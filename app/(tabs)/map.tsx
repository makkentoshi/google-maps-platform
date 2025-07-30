import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import axios from 'axios';
import { MapPin, Filter, Search, X } from 'lucide-react-native';
import { Linking } from 'react-native';
import ClusteredMapView from 'react-native-map-clustering';
import { StarRating } from '@/app/components/StarRating';
import { useLocalSearchParams } from 'expo-router';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type Place = {
  id: string;
  placeId: string;
  title: string;
  location: string;
  coordinates: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  funFact: string | null;
  likes: number;
  comments: number;
  style: string | null;
  createdAt: string;
  isEnhanced: boolean;
  distance?: string;
  rating?: number;
  averageRating?: number;
  googleRating?: number;
  photos?: string[];
};

type GooglePlace = {
  place_id: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  formatted_address?: string;
  types: string[];
  price_level?: number;
  opening_hours?: {
    open_now: boolean;
  };
};

export default function MapScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [googlePlaces, setGooglePlaces] = useState<GooglePlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedGooglePlace, setSelectedGooglePlace] =
    useState<GooglePlace | null>(null);
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<GooglePlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimeout = useRef<number | null>(null);

  // Animation
  const cardScale = useSharedValue(0);

  useEffect(() => {
    console.log(
      '[DEBUG] Выбранное место из нашего приложения:',
      selectedPlace ? selectedPlace.title : 'null'
    );
    console.log(
      '[DEBUG] Выбранное место из Google:',
      selectedGooglePlace ? selectedGooglePlace.name : 'null'
    );
  }, [selectedPlace, selectedGooglePlace]);

  useEffect(() => {
    cardScale.value =
      selectedPlace || selectedGooglePlace ? withSpring(1) : withSpring(0);
  }, [selectedPlace, selectedGooglePlace]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardScale.value,
  }));

  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);

  const initialCoordinates = params.coordinates
    ? typeof params.coordinates === 'string'
      ? params.coordinates.split(',').map(Number)
      : Array.isArray(params.coordinates) && params.coordinates[0]
      ? params.coordinates[0].split(',').map(Number)
      : null
    : null;

  const initialRegion =
    initialCoordinates &&
    !isNaN(initialCoordinates[0]) &&
    !isNaN(initialCoordinates[1])
      ? {
          latitude: initialCoordinates[0],
          longitude: initialCoordinates[1],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      : {
          latitude: userLocation?.latitude || 51.5,
          longitude: userLocation?.longitude || -0.12,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };

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

  useEffect(() => {
    if (
      initialCoordinates &&
      mapRef.current &&
      !isNaN(initialCoordinates[0]) &&
      !isNaN(initialCoordinates[1])
    ) {
      mapRef.current.animateToRegion(
        {
          latitude: initialCoordinates[0],
          longitude: initialCoordinates[1],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  }, [initialCoordinates]);

  // Search Google Places
  const searchGooglePlaces = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      console.log('[DEBUG] Starting search for:', query);
      console.log(process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY);

      setIsSearching(true);
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/place/textsearch/json`,
          {
            params: {
              query: query,
              key: process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY,
              language: 'en',
              region: 'us',
            },
          }
        );

        console.log(
          '[DEBUG] Google Places API response status:',
          response.data.status
        );

        if (response.data.results) {
          console.log(`[DEBUG] Found ${response.data.results.length} results.`);
          setSearchResults(response.data.results.slice(0, 10)); // Limit to 10 results
          setShowSearchResults(true);
        }
      } catch (error: any) {
        console.error(
          'Google Places search error:',
          error.response?.data || error.message
        );
        Alert.alert(
          t('errorTitle', 'Error'),
          t('searchError', 'Failed to search places')
        );
      } finally {
        setIsSearching(false);
      }
    },
    [t]
  );

  // Debounced search
  useEffect(() => {
    const debounce = setTimeout(() => {
      searchGooglePlaces(searchQuery);
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchQuery, searchGooglePlaces]);

  // Fetch nearby Google Places
  const fetchNearbyGooglePlaces = useCallback(
    async (region: Region) => {
      if (!userLocation) return;

      const earthRadius = 6371000; // в метрах
      const latDeltaRad = (region.latitudeDelta * Math.PI) / 180;
      const radius = (latDeltaRad * earthRadius) / 2; // Примерный радиус видимой области

      // ОГРАНИЧЕНИЕ: Не запрашиваем места, если радиус слишком большой (карта отдалена)
      // 10000 метров = 10 км. Можете настроить это значение.
      if (radius > 10000) {
        setGooglePlaces([]); // Очищаем маркеры Google, если пользователь слишком отдалил карту
        return;
      }

      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
          {
            params: {
              location: `${region.latitude},${region.longitude}`,
              radius: Math.min(radius, 10000),
              type: 'tourist_attraction|museum|park|restaurant|point_of_interest',
              key: process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY,
            },
          }
        );

        if (response.data.results) {
          setGooglePlaces(response.data.results);
        }
      } catch (error: any) {
        console.error('Fetch Google Places error:', error);
      }
    },
    [userLocation]
  );

  // Fetch app places based on filter
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

      // Fetch ratings and add photos
      fetchedPlaces = await Promise.all(
        fetchedPlaces.map(async (place: any) => {
          const [avgResponse, googleResponse] = await Promise.all([
            axios.get(
              `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/ratings?placeId=${place.placeId}`
            ),
            place.placeId
              ? axios.get(
                  `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/places?placeId=${place.placeId}`
                )
              : Promise.resolve({ data: { googleRating: 0, photos: [] } }),
          ]);
          return {
            ...place,
            averageRating: parseFloat(avgResponse.data.averageRating) || 0.0,
            googleRating: parseFloat(googleResponse.data.googleRating) || 0.0,
            photos: googleResponse.data.photos || [],
          };
        })
      );

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
              `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/ratings?placeId=${place.placeId}`
            ),
            place.placeId
              ? axios.get(
                  `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/places?placeId=${place.placeId}`
                )
              : Promise.resolve({ data: { googleRating: 0, photos: [] } }),
          ]);
          return {
            ...place,
            averageRating: parseFloat(avgResponse.data.averageRating) || 0.0,
            googleRating: parseFloat(googleResponse.data.googleRating) || 0.0,
            photos: googleResponse.data.photos || [],
          };
        })
      );
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

  // Calculate zoom level and fetch Google Places
  const handleRegionChange = useCallback(
    (region: Region) => {
      const zoom = Math.log2(360 * (width / 256 / region.longitudeDelta)) + 1;
      setZoomLevel(zoom);

      // Логика Debounce
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      // Fetch Google Places when zoomed in enough
      debounceTimeout.current = setTimeout(() => {
        if (zoom > 12) {
          // Проверяем зум внутри debounced вызова
          fetchNearbyGooglePlaces(region);
        } else {
          setGooglePlaces([]); // Очищаем маркеры, если зум слишком низкий
        }
      }, 500); // Задержка в 500 мс. Можете настроить.
    },
    [fetchNearbyGooglePlaces] // Добавляем зависимость
  );

  let isMarkerPressed = false;

  // App places markers
  const appMarkers = useMemo(() => {
    if (!Array.isArray(places)) {
      return [];
    }
    const visiblePlaces = zoomLevel > 15 ? places : places.slice(0, 10);
    return visiblePlaces
      .filter((place) => place.coordinates)
      .map((place) => {
        const [latitude, longitude] = place.coordinates!.split(',').map(Number);
        if (isNaN(latitude) || isNaN(longitude)) {
          return null;
        }
        return (
          <Marker
            key={`app-${place.id}`}
            coordinate={{ latitude, longitude }}
            title={place.title}
            onPress={() => {
              console.log('[DEBUG] App Marker pressed:', place.title);
              isMarkerPressed = true;
              setSelectedPlace(place);
              setSelectedGooglePlace(null);
              setTimeout(() => {
                isMarkerPressed = false;
              }, 100);
            }}
            pinColor={theme.colors.primary}
            opacity={1}
          />
        );
      })
      .filter(Boolean);
  }, [places, zoomLevel, theme.colors.primary]);

  // Google Places markers
  const googleMarkers = useMemo(() => {
    if (zoomLevel < 13) return []; // Only show when zoomed in

    return googlePlaces
      .slice(0, 20)
      .filter((place) => {
        // Don't show Google place if we already have it in our app
        return !places.some(
          (appPlace) =>
            appPlace.placeId === place.place_id ||
            (appPlace.title.toLowerCase() === place.name.toLowerCase() &&
              appPlace.coordinates &&
              Math.abs(
                parseFloat(appPlace.coordinates.split(',')[0]) -
                  place.geometry.location.lat
              ) < 0.001 &&
              Math.abs(
                parseFloat(appPlace.coordinates.split(',')[1]) -
                  place.geometry.location.lng
              ) < 0.001)
        );
      })
      .map((place) => (
        <Marker
          key={`google-${place.place_id}`}
          coordinate={{
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          }}
          title={place.name}
          onPress={() => {
            console.log('[DEBUG] Google Marker pressed:', place.name);
            isMarkerPressed = true;
            setSelectedGooglePlace(place);
            setSelectedPlace(null);
            setTimeout(() => {
              isMarkerPressed = false;
            }, 100);
          }}
          pinColor="#2B9F44FF" // Google green
          opacity={0.8}
        />
      ));
  }, [googlePlaces, places, zoomLevel]);

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Handle search result selection
  const handleSearchResultPress = (place: GooglePlace) => {
    setShowSearchResults(false);
    setSearchQuery('');
    mapRef.current?.animateToRegion(
      {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000
    );
    setSelectedGooglePlace(place);
    setSelectedPlace(null);
  };

  // Navigate to story for app places
  const handleDetailsPress = useCallback(
    async (place: Place) => {
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/stories/${place.id}`
        );
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
        // Fallback
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
    (place: Place | GooglePlace) => {
      let latitude: number, longitude: number;

      if ('coordinates' in place) {
        // App place
        if (!place.coordinates) {
          Alert.alert(
            t('errorTitle', 'Error'),
            t('invalidCoordinates', 'Invalid coordinates for directions.')
          );
          return;
        }
        [latitude, longitude] = place.coordinates.split(',').map(Number);
      } else {
        // Google place
        latitude = place.geometry.location.lat;
        longitude = place.geometry.location.lng;
      }

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

  // Get photo URL from Google Places
  const getPhotoUrl = (photoReference: string, maxWidth: number = 400) => {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY}`;
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      {/* Search Bar */}
      <View
        style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}
      >
        <View style={styles.searchInputContainer}>
          <Search size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder={t('searchPlaces', 'Search places...')}
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
            >
              <X size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        {isSearching && <ActivityIndicator color={theme.colors.primary} />}
      </View>

      {/* Search Results */}
      {showSearchResults && (
        <View
          style={[styles.searchResults, { backgroundColor: theme.colors.card }]}
        >
          <ScrollView style={styles.searchResultsList}>
            {searchResults.map((place) => (
              <TouchableOpacity
                key={place.place_id}
                style={[
                  styles.searchResultItem,
                  { borderBottomColor: theme.colors.border },
                ]}
                onPress={() => handleSearchResultPress(place)}
              >
                <MapPin size={16} color={theme.colors.primary} />
                <View style={styles.searchResultText}>
                  <Text
                    style={[
                      styles.searchResultName,
                      { color: theme.colors.text },
                    ]}
                  >
                    {place.name}
                  </Text>
                  <Text
                    style={[
                      styles.searchResultAddress,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {place.formatted_address}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ClusteredMapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion as Region}
        onRegionChangeComplete={handleRegionChange}
        onPress={(e) => {
          // Новая, надежная проверка.
          // Мы закрываем карточку, только если нажатие было на саму карту,
          // а не на маркер.
          if (e.nativeEvent.action !== 'marker-press') {
            setSelectedPlace(null);
            setSelectedGooglePlace(null);
          }
        }}
        showsUserLocation={!!userLocation}
      >
        {initialCoordinates &&
          !isNaN(initialCoordinates[0]) &&
          !isNaN(initialCoordinates[1]) && (
            <Marker
              coordinate={{
                latitude: initialCoordinates[0],
                longitude: initialCoordinates[1],
              }}
              pinColor={theme.colors.primary}
            />
          )}
        {appMarkers}
        {googleMarkers}
      </ClusteredMapView>

      {/* App Place Card */}

      {selectedPlace && (
        <Animated.View
          style={[
            styles.placeCard,
            animatedCardStyle,
            {
              backgroundColor: theme.colors.card || '#ffffff',
              borderColor: theme.colors.border || '#ccc',
            },
          ]}
        >
          <Text
            style={[styles.placeTitle, { color: theme.colors.text || '#000' }]}
          >
            {selectedPlace.title}
          </Text>

          {/* Photos */}
          {selectedPlace.photos && selectedPlace.photos.length > 0 && (
            <ScrollView
              horizontal
              style={styles.photosContainer}
              showsHorizontalScrollIndicator={false}
            >
              {selectedPlace.photos.slice(0, 5).map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.placePhoto}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          )}

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
            {typeof selectedPlace.averageRating === 'number' &&
            selectedPlace.averageRating > 0
              ? selectedPlace.averageRating.toFixed(1)
              : t('noReviews', 'No reviews')}
          </Text>

          <Text
            style={[styles.ratingText, { color: theme.colors.text || '#000' }]}
          >
            {t('googleRating', 'Google Rating')}:{' '}
            {typeof selectedPlace.googleRating === 'number' &&
            selectedPlace.googleRating > 0
              ? selectedPlace.googleRating.toFixed(1)
              : t('noReviews', 'No reviews')}
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

      {/* Google Place Card */}
      {selectedGooglePlace && (
        <Animated.View
          style={[
            styles.placeCard,
            animatedCardStyle,
            {
              backgroundColor: theme.colors.card || '#ffffff',
              borderColor: '#4285F4',
              borderWidth: 2,
            },
          ]}
        >
          <Text
            style={[styles.placeTitle, { color: theme.colors.text || '#000' }]}
          >
            {selectedGooglePlace.name}
          </Text>

          {/* Google Photos */}
          {selectedGooglePlace.photos &&
            selectedGooglePlace.photos.length > 0 && (
              <ScrollView
                horizontal
                style={styles.photosContainer}
                showsHorizontalScrollIndicator={false}
              >
                {selectedGooglePlace.photos.slice(0, 5).map((photo, index) => (
                  <Image
                    key={index}
                    source={{ uri: getPhotoUrl(photo.photo_reference) }}
                    style={styles.placePhoto}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            )}

          <Text
            style={[
              styles.placeDescription,
              { color: theme.colors.textSecondary || '#666' },
            ]}
          >
            {selectedGooglePlace.formatted_address || 'Google Place'}
          </Text>

          <Text
            style={[styles.ratingText, { color: theme.colors.text || '#000' }]}
          >
            {t('googleRating', 'Google Rating')}:{' '}
            {selectedGooglePlace.rating
              ? selectedGooglePlace.rating.toFixed(1)
              : t('noReviews', 'No reviews')}
          </Text>

          <View style={styles.placeCardButtons}>
            <TouchableOpacity
              style={[styles.cardButton, { backgroundColor: '#4285F4' }]}
              onPress={() => handleDirections(selectedGooglePlace)}
            >
              <Text style={styles.cardButtonText}>
                {t('directions', 'Directions')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.cardButton,
                { backgroundColor: theme.colors.surface || '#f0f0f0' },
              ]}
              onPress={() => {
                setSelectedGooglePlace(null);
                Alert.alert(
                  t('addPlace', 'Add Place'),
                  t(
                    'addPlaceMessage',
                    'Would you like to add this place to our app by taking a photo?'
                  ),
                  [
                    { text: t('cancel', 'Cancel'), style: 'cancel' },
                    {
                      text: t('addPhoto', 'Add Photo'),
                      onPress: () => {
                        // Navigate to camera or photo picker
                        router.push('/');
                      },
                    },
                  ]
                );
              }}
            >
              <Text
                style={[styles.cardButtonText, { color: theme.colors.text }]}
              >
                {t('addToApp', 'Add to App')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Filter Button */}
      <View style={styles.topBar}>
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: theme.colors.card },
            ]}
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
    zIndex: 1000,
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  searchResults: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 20,
    maxHeight: 200,
    zIndex: 999,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchResultText: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  searchResultAddress: {
    fontSize: 14,
  },
  topBar: {
    position: 'absolute',
    top: 130,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 998,
  },
  filterBar: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  filterButton: {
    padding: 10,
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
    elevation: 10,
    zIndex: 100,
    maxHeight: '60%',
  },
  placeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  photosContainer: {
    marginBottom: 12,
    maxHeight: 120,
  },
  placePhoto: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  placeDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  placeFunFact: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 20,
  },
  ratingText: {
    fontSize: 14,
    marginTop: 8,
  },
  placeCardButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  cardButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cardButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

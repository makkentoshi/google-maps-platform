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
  Modal,
} from 'react-native';
import { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import axios from 'axios';
import { MapPin, Filter, Navigation, Menu } from 'lucide-react-native';
import MapView from 'react-native-map-clustering';
import { Linking } from 'react-native';

const { width, height } = Dimensions.get('window');

type Place = {
  id: string;
  placeId: string;
  title: string;
  location: string;
  coordinates: string | null;
  description: string;
  funFact: string;
  city: string | null;
  country: string | null;
  likes: number;
  comments: number;
  style: string | null;
  createdAt: string;
  isEnhanced: boolean;
  distance?: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(15);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<'minimal' | 'detailed'>(
    'detailed'
  );

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
      setPlaces(response.data?.places || []);
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

  // Fetch nearby places
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
      setPlaces(response.data?.places || []);
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

  // Memoize markers
  const markers = useMemo(() => {
    const visiblePlaces = zoomLevel > 15 ? places : places.slice(0, 10);
    return visiblePlaces
      .filter((place) => place.coordinates)
      .map((place) => {
        const [latitude, longitude] = place.coordinates!.split(',').map(Number);
        if (isNaN(latitude) || isNaN(longitude)) return null;
        return (
          <Marker
            key={place.id}
            coordinate={{ latitude, longitude }}
            title={place.title}
            onPress={() => setSelectedPlace(place)}
            pinColor={theme.colors.primary}
            opacity={zoomLevel > 15 ? 1 : 0.7}
          />
        );
      })
      .filter(Boolean);
  }, [places, zoomLevel, theme.colors.primary]);

  // Handle map press (fix crash)
  const handleMapPress = useCallback(() => {
    setSelectedPlace(null); // Clear selected place on empty tap
  }, []);

  // Navigate to story.tsx or generate screen
  const handleDetailsPress = useCallback(
    async (place: Place) => {
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/stories/${place.id}`
        );
        if (response.data?.generatedText) {
          router.push({
            pathname: '/story',
            params: {
              data: JSON.stringify({
                id: place.id,
                placeId: place.placeId,
                source: 'database',
                isEnhanced: place.isEnhanced,
                title: place.title,
                location: place.location,
                generatedText: response.data.generatedText,
                funFacts: response.data.funFacts,
                sources: response.data.sources,
                city: place.city,
                country: place.country,
                coordinates: place.coordinates,
                style: place.style,
                likes: place.likes,
                comments: place.comments,
                readTime: response.data.readTime,
              }),
            },
          });
        } else {
          // Fallback to generate screen
          router.push({
            pathname: '/story', // generate screen
            params: {
              placeId: place.placeId,
              placeName: place.title,
              coordinates: place.coordinates,
            },
          });
        }
      } catch (error: any) {
        console.error('Fetch story error:', error);
        Alert.alert(
          t('errorTitle', 'Error'),
          error.response?.data?.message ||
            t('errorFetchStory', 'Failed to fetch story.')
        );
        // Fallback to generate screen
        router.push({
          pathname: '/story', // generate screen
          params: {
            placeId: place.placeId,
            placeName: place.title,
            coordinates: place.coordinates,
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

  // Handle style selection and generate
  const handleGenerate = useCallback(() => {
    if (selectedPlace) {
      router.push({
        pathname: '/story', // generate screen
        params: {
          placeId: selectedPlace.placeId,
          placeName: selectedPlace.title,
          coordinates: selectedPlace.coordinates,
          style: selectedStyle,
        },
      });
      setStyleMenuOpen(false);
    }
  }, [selectedPlace, selectedStyle, router]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: userLocation?.latitude || 51.5007,
          longitude: userLocation?.longitude || -0.1246,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onRegionChangeComplete={handleRegionChange}
        onPress={handleMapPress}
        showsUserLocation={!!userLocation}
      >
        {markers}
      </MapView>

      {selectedPlace && (
        <View
          style={[
            styles.placeCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.placeTitle, { color: theme.colors.text }]}>
            {selectedPlace.title}
          </Text>
          <Text
            style={[
              styles.placeDescription,
              { color: theme.colors.textSecondary },
            ]}
          >
            {selectedPlace.description}
          </Text>
          {selectedPlace.funFact && (
            <Text
              style={[
                styles.placeFunFact,
                { color: theme.colors.textSecondary },
              ]}
            >
              {t('funFact', 'Fun Fact')}: {selectedPlace.funFact}
            </Text>
          )}
          <View style={styles.placeCardButtons}>
            <TouchableOpacity
              style={[
                styles.cardButton,
                { backgroundColor: theme.colors.primary },
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
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => handleDirections(selectedPlace)}
            >
              <Navigation size={20} color="#fff" />
              <Text style={styles.cardButtonText}>
                {t('directions', 'Directions')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal
        visible={sidebarOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSidebarOpen(false)}
      >
        <View style={styles.sidebarOverlay}>
          <View
            style={[styles.sidebar, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.sidebarTitle, { color: theme.colors.text }]}>
              {t('categories', 'Categories')}
            </Text>
            {['popular', 'recent', 'historical', 'nearby'].map((f) => (
              <TouchableOpacity
                key={f}
                style={styles.sidebarItem}
                onPress={() => {
                  setFilter(f as any);
                  setSidebarOpen(false);
                }}
              >
                <Text
                  style={[styles.sidebarText, { color: theme.colors.text }]}
                >
                  {t(f, f.charAt(0).toUpperCase() + f.slice(1))}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.sidebarItem}
              onPress={() => setSidebarOpen(false)}
            >
              <Text style={[styles.sidebarText, { color: theme.colors.error }]}>
                {t('close', 'Close')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={styleMenuOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStyleMenuOpen(false)}
      >
        <View style={styles.sidebarOverlay}>
          <View
            style={[styles.sidebar, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.sidebarTitle, { color: theme.colors.text }]}>
              {t('generateStory', 'Generate Story')}
            </Text>
            {['minimal', 'detailed'].map((style) => (
              <TouchableOpacity
                key={style}
                style={styles.sidebarItem}
                onPress={() => setSelectedStyle(style as any)}
              >
                <Text
                  style={[
                    styles.sidebarText,
                    {
                      color:
                        selectedStyle === style
                          ? theme.colors.primary
                          : theme.colors.text,
                    },
                  ]}
                >
                  {t(style, style.charAt(0).toUpperCase() + style.slice(1))}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.sidebarItem,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: 8,
                  padding: 12,
                },
              ]}
              onPress={handleGenerate}
            >
              <Text style={[styles.sidebarText, { color: '#fff' }]}>
                {t('generateFullStory', 'Generate Full Story')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sidebarItem}
              onPress={() => setStyleMenuOpen(false)}
            >
              <Text style={[styles.sidebarText, { color: theme.colors.error }]}>
                {t('close', 'Close')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.topBar}>
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setSidebarOpen(true)}
          >
            <Filter size={20} color={theme.colors.text} />
          </TouchableOpacity>
          {isLoading && <ActivityIndicator color={theme.colors.primary} />}
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setStyleMenuOpen(true)}
        >
          <Menu size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterBar: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  filterButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  menuButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  sidebarOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sidebar: {
    width: '100%',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sidebarTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  sidebarItem: { paddingVertical: 12 },
  sidebarText: { fontSize: 16, fontWeight: '600' },
  placeCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  placeTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  placeDescription: { fontSize: 14, marginBottom: 8 },
  placeFunFact: { fontSize: 14, fontStyle: 'italic', marginBottom: 12 },
  placeCardButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  cardButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

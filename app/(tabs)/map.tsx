import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView, {
  Marker,
  Callout,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';
import { Star, MessageCircle, ArrowRight } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { router } from 'expo-router';
import axios from 'axios';

// Тип данных для одного места на карте, который мы ожидаем от API
type PlaceOnMap = {
  placeId: string;
  name: string;
  latitude: number;
  longitude: number;
  storyId: string;
  likes: number;
  comments: number;
};

const { width } = Dimensions.get('window');

export default function MapScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [places, setPlaces] = useState<PlaceOnMap[]>([]);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Анонимная асинхронная функция для инициализации
    (async () => {
      try {
        // 1. Запрашиваем разрешение на геолокацию
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg(t('locationPermissionDenied')); // Предполагаем, что есть такой ключ в переводах
          setIsLoading(false);
          // Устанавливаем регион по умолчанию, если нет доступа (например, центр Москвы)
          setInitialRegion({
            latitude: 55.7558,
            longitude: 37.6176,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          });
        } else {
          // 2. Получаем текущую позицию
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setInitialRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        }

        // 3. Загружаем популярные места с нашего нового эндпоинта
        const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
        if (!API_BASE_URL) throw new Error('API URL is not configured');

        const response = await axios.get(`${API_BASE_URL}/api/places/popular`);
        setPlaces(response.data);
      } catch (error: any) {
        console.error('Initialization Error:', error);
        setErrorMsg(t('failedToLoadMap')); // Предполагаем, что есть такой ключ
        // Не перезаписываем ошибку о геолокации, если она была первой
        if (!errorMsg) {
          setErrorMsg('Failed to load places.');
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Навигация на страницу истории по ее ID
  const handleNavigateToStory = (storyId: string) => {
    router.push({
      pathname: '/story',
      params: { storyId: storyId }, // Отправляем только ID истории
    });
  };

  // Пока данные не загружены, показываем индикатор
  if (!initialRegion) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          style={[styles.loadingText, { color: theme.colors.textSecondary }]}
        >
          {t('loadingMap')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE} // Обязательно для кастомных Callout
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {places.map((place) => (
          <Marker
            key={place.placeId}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            pinColor={theme.colors.primary}
          >
            {/* Всплывающее окно при нажатии на маркер */}
            <Callout
              tooltip
              onPress={() => handleNavigateToStory(place.storyId)}
            >
              <View
                style={[
                  styles.calloutContainer,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.calloutTitle, { color: theme.colors.text }]}
                >
                  {place.name}
                </Text>

                <View style={styles.calloutStats}>
                  <Star size={14} color={theme.colors.warning} />
                  <Text
                    style={[
                      styles.calloutText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {place.likes}
                  </Text>
                  <MessageCircle
                    size={14}
                    color={theme.colors.textSecondary}
                    style={{ marginLeft: 12 }}
                  />
                  <Text
                    style={[
                      styles.calloutText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {place.comments}
                  </Text>
                </View>

                <View
                  style={[
                    styles.calloutAction,
                    { borderTopColor: theme.colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.calloutActionText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {t('learnStory')}
                  </Text>
                  <ArrowRight size={16} color={theme.colors.primary} />
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Верхний заголовок поверх карты */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.background + 'E6' },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('map')}
        </Text>
      </View>

      {/* Сообщение об ошибке, если оно есть */}
      {errorMsg && (
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: theme.colors.error + '40' },
          ]}
        >
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            {errorMsg}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent', // Убираем границу, так как фон полупрозрачный
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  // Стили для кастомного инфо-окна
  calloutContainer: {
    width: width * 0.6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  calloutStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  calloutText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  calloutAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
  },
  calloutActionText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
  },
  errorText: {
    textAlign: 'center',
    fontWeight: '600',
  },
});

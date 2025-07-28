import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Star } from 'lucide-react-native';
import axios from 'axios';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'expo-router';

type Place = {
  id: string;
  name: string;
  averageRating: number;
};

export default function LeaderboardScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTopPlaces();
  }, []);

  const fetchTopPlaces = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/places`
      );
      setPlaces(response.data.places || []);
    } catch (error: any) {
      console.error('Fetch top places error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlacePress = (place: Place) => {
    // Предполагаем, что у места есть связанная история
    router.push({
      pathname: '/story',
      params: {
        data: JSON.stringify({ title: place.name, source: 'database' }),
      },
    });
  };

  if (isLoading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text style={[styles.text, { color: theme.colors.text }]}>
          {t('loading', 'Loading...')}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {t('topPlaces', 'Top Places')}
      </Text>
      <FlatList
        data={places}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.placeCard, { backgroundColor: theme.colors.card }]}
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
                    star <= Math.round(item.averageRating)
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                  fill={
                    star <= Math.round(item.averageRating)
                      ? theme.colors.primary
                      : 'none'
                  }
                />
              ))}
              <Text
                style={[
                  styles.placeRating,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {item.averageRating.toFixed(1)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  placeCard: { padding: 12, borderRadius: 8, marginBottom: 12 },
  placeName: { fontSize: 18, fontWeight: '600' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  placeRating: { fontSize: 14, marginLeft: 8 },
  text: { fontSize: 16, textAlign: 'center' },
});

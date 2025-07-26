import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import axios from 'axios';
import { BookOpen } from 'lucide-react-native';

export default function GenerateScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('narrative');

  const { placeId, placeName, coordinates, initialText, source } = params;

  const handleGenerateFullStory = useCallback(async () => {
    if (!placeId || !placeName || !initialText) {
      Alert.alert(
        t('errorTitle', 'Error'),
        t('errorGenerateStory', 'Missing required data to generate story.')
      );
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/enhance-story`,
        {
          placeId,
          placeName,
          coordinates,
          initialText,
          style: selectedStyle,
        }
      );

      const {
        id,
        generatedText,
        funFacts,
        sources,
        readTime,
        style,
        isEnhanced,
      } = response.data;

      router.push({
        pathname: '/story',
        params: {
          data: JSON.stringify({
            id,
            placeId,
            title: placeName,
            location: placeName,
            story: generatedText,
            funFacts: funFacts || [],
            sources: sources || [],
            readTime: readTime || '',
            style,
            isEnhanced,
            coordinates: coordinates || '',
            source: 'database',
            likes: 0,
            comments: 0,
            isLiked: false,
          }),
        },
      });
    } catch (error: any) {
      console.error(
        'Enhance story error:',
        error.response?.data || error.message
      );
      Alert.alert(
        t('errorTitle', 'Error'),
        error.response?.data?.message ||
          t('errorGenerateStory', 'Failed to generate full story.')
      );
    } finally {
      setIsEnhancing(false);
    }
  }, [placeId, placeName, coordinates, initialText, selectedStyle, router, t]);

  if (!placeName || !initialText) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text style={[styles.errorText, { color: theme.colors.text }]}>
          {t('errorLoadData', 'Failed to load place data.')}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {placeName}
        </Text>
        <Text
          style={[styles.description, { color: theme.colors.textSecondary }]}
        >
          {String(initialText).slice(0, 100)}...
        </Text>
        <TouchableOpacity
          style={[
            styles.fullStoryButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={handleGenerateFullStory}
          disabled={isEnhancing}
        >
          {isEnhancing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <BookOpen size={20} color="#fff" />
              <Text style={styles.buttonText}>
                {t('fullStory', 'Full Story')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  description: { fontSize: 14, marginBottom: 16 },
  fullStoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorText: { fontSize: 16, textAlign: 'center' },
});

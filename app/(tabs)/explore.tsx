import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Star, MessageSquare } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter, useFocusEffect } from 'expo-router';

export default function ExploreScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { userId } = useAuth();
  const router = useRouter();

  const [locations, setLocations] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'places' | 'forums'>('places');
  const [selectedCategory, setSelectedCategory] = useState('popular');

  const [isModalVisible, setModalVisible] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');

  const fetchPlaces = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/places?filter=${selectedCategory}`
      );
      setLocations(response.data.places || []);
    } catch (error) {
      console.error('Failed to fetch places:', error);
      Alert.alert('Error', 'Could not load places.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  const fetchThreads = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/threads`
      );
      setThreads(response.data || []);
    } catch (error) {
      console.error('Failed to fetch threads:', error);
      Alert.alert('Error', 'Could not load forum threads.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (viewMode === 'places') {
        fetchPlaces();
      } else {
        fetchThreads();
      }
    }, [viewMode, fetchPlaces, fetchThreads])
  );

  const handleCreateThread = async () => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to create a thread.');
      return;
    }
    if (!newThreadTitle.trim()) {
      Alert.alert('Error', 'Title is required.');
      return;
    }
    try {
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/threads`,
        { title: newThreadTitle, content: newThreadContent },
        { headers: { 'x-clerk-user-id': userId } }
      );
      setModalVisible(false);
      setNewThreadTitle('');
      setNewThreadContent('');
      fetchThreads(); // Обновляем только треды
    } catch (error) {
      console.error('Failed to create thread:', error);
      Alert.alert('Error', 'Could not create thread.');
    }
  };

  const handleLearnStory = (location: any) => {
    router.push({
      pathname: '/story',
      params: { data: JSON.stringify(location) },
    });
  };

  const handleThreadPress = (thread: any) => {
    router.push({ pathname: '/thread', params: { threadId: thread.id } });
  };

  const placeCategories = [
    { key: 'popular', label: t('popular', 'Popular') },
    { key: 'recent', label: t('recent', 'Recent') },
    { key: 'historical', label: t('historical', 'Historical') },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('explore', '🌏 Explore')}
        </Text>
        <Text
          style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}
        >
          {t('exploreSubtitle', 'Discover new places and stories')}
        </Text>
      </View>

      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'places' && {
              borderBottomColor: theme.colors.primary,
            },
          ]}
          onPress={() => setViewMode('places')}
        >
          <Text
            style={[
              styles.viewModeText,
              {
                color:
                  viewMode === 'places'
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
              },
            ]}
          >
            📍 {t('places', 'Places')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'forums' && {
              borderBottomColor: theme.colors.primary,
            },
          ]}
          onPress={() => setViewMode('forums')}
        >
          <Text
            style={[
              styles.viewModeText,
              {
                color:
                  viewMode === 'forums'
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
              },
            ]}
          >
            💬 {t('forums', 'Forums')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginTop: 50 }}
          />
        ) : (
          <>
            {viewMode === 'places' && (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesContainer}
                >
                  {placeCategories.map((category) => (
                    <TouchableOpacity
                      key={category.key}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor:
                            selectedCategory === category.key
                              ? theme.colors.primary
                              : theme.colors.card,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() => setSelectedCategory(category.key)}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          {
                            color:
                              selectedCategory === category.key
                                ? '#FFFFFF'
                                : theme.colors.textSecondary,
                          },
                        ]}
                      >
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {locations.map((location) => (
                  <View
                    key={location.id}
                    style={[
                      styles.card,
                      {
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardInfo}>
                        <Text
                          style={[
                            styles.cardTitle,
                            { color: theme.colors.text },
                          ]}
                        >
                          {location.title}
                        </Text>
                        <Text
                          style={[
                            styles.cardDescription,
                            { color: theme.colors.textSecondary },
                          ]}
                          numberOfLines={2}
                        >
                          {location.description}
                        </Text>
                        <View style={styles.cardMeta}>
                          <View style={styles.metaItem}>
                            <Star size={14} color={theme.colors.warning} />
                            <Text
                              style={[
                                styles.metaText,
                                { color: theme.colors.textSecondary },
                              ]}
                            >
                              {location.averageRating.toFixed(1)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          { backgroundColor: theme.colors.primary },
                        ]}
                        onPress={() => handleLearnStory(location)}
                      >
                        <Text style={styles.primaryButtonText}>
                          {t('learnStory', 'Learn Story')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {viewMode === 'forums' && (
              <>
                <View style={styles.sectionHeader}>
                  <Text
                    style={[styles.sectionTitle, { color: theme.colors.text }]}
                  >
                    {t('latestThreads', 'Latest Threads')}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Text
                      style={[
                        styles.seeAllText,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {t('create', 'Create')}
                    </Text>
                  </TouchableOpacity>
                </View>
                {threads.map((thread) => (
                  <TouchableOpacity
                    key={thread.id}
                    style={[
                      styles.card,
                      {
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={() => handleThreadPress(thread)}
                  >
                    <Text
                      style={[styles.cardTitle, { color: theme.colors.text }]}
                    >
                      {thread.title}
                    </Text>
                    {thread.content && (
                      <Text
                        style={[
                          styles.cardDescription,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {thread.content}
                      </Text>
                    )}
                    <View style={styles.cardMeta}>
                      <View style={styles.metaItem}>
                        <MessageSquare
                          size={14}
                          color={theme.colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.metaText,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {thread._count.comments} comments
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView
          style={[
            styles.container,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <View style={{ padding: 20 }}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {t('newThread', 'New Thread')}
            </Text>
            <TextInput
              placeholder={t('title', 'Title')}
              value={newThreadTitle}
              onChangeText={setNewThreadTitle}
              style={[
                styles.modalInput,
                { color: theme.colors.text, borderColor: theme.colors.border },
              ]}
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TextInput
              placeholder={t('content', 'Content (optional)')}
              value={newThreadContent}
              onChangeText={setNewThreadContent}
              style={[
                styles.modalInput,
                {
                  height: 120,
                  textAlignVertical: 'top',
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              multiline
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.primary, marginTop: 20 },
              ]}
              onPress={handleCreateThread}
            >
              <Text style={styles.primaryButtonText}>{t('post', 'Post')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.surface, marginTop: 10 },
              ]}
              onPress={() => setModalVisible(false)}
            >
              <Text
                style={[styles.actionButtonText, { color: theme.colors.text }]}
              >
                {t('cancel', 'Cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  headerSubtitle: { fontSize: 16 },
  content: { flex: 1, paddingHorizontal: 20 },
  viewModeContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  viewModeButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  viewModeText: { fontSize: 16, fontWeight: '600' },
  categoriesContainer: { paddingVertical: 16, gap: 12 },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: { fontSize: 14, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  seeAllText: { fontSize: 16, fontWeight: '600' },
  card: { marginBottom: 16, borderRadius: 20, padding: 20, borderWidth: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardInfo: { flex: 1, marginRight: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  cardDescription: { fontSize: 14, marginBottom: 12, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontWeight: '600' },
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: { fontSize: 14, fontWeight: '600' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    fontSize: 16,
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MapPin, Clock, Star, Users, Navigation } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

const { width } = Dimensions.get('window');

const mockLocations = [
  {
    id: 1,
    name: 'Red Square',
    description: 'Main square of Moscow',
    distance: '1.2 km',
    rating: 4.8,
    stories: 12,
    visitors: 2847,
    image: 'https://images.pexels.com/photos/753339/pexels-photo-753339.jpeg',
  },
  {
    id: 2,
    name: 'Christ the Savior Cathedral',
    description: 'Orthodox cathedral',
    distance: '2.1 km',
    rating: 4.7,
    stories: 8,
    visitors: 1563,
    image: 'https://images.pexels.com/photos/208701/pexels-photo-208701.jpeg',
  },
  {
    id: 3,
    name: 'Gorky Park',
    description: 'Central park of culture',
    distance: '3.5 km',
    rating: 4.6,
    stories: 15,
    visitors: 3241,
    image: 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg',
  },
];

export default function ExploreScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { key: 'all', label: t('all') },
    { key: 'architecture', label: t('architecture') },
    { key: 'parks', label: t('parks') },
    { key: 'museums', label: t('museums') },
    { key: 'temples', label: t('temples') },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('explore')}</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>{t('exploreSubtitle')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryChip,
                { 
                  backgroundColor: selectedCategory === category.key ? theme.colors.primary : theme.colors.card,
                  borderColor: theme.colors.border 
                }
              ]}
              onPress={() => setSelectedCategory(category.key)}>
              <Text style={[
                styles.categoryText,
                { color: selectedCategory === category.key ? '#FFFFFF' : theme.colors.textSecondary }
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <MapPin size={20} color={theme.colors.primary} />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>47</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('placesNearby')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Star size={20} color={theme.colors.warning} />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>156</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('stories')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Users size={20} color={theme.colors.success} />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>1.2K</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{t('travelers')}</Text>
          </View>
        </View>

        {/* Locations List */}
        <View style={styles.locationsHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('popularPlaces')}</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>{t('all')}</Text>
          </TouchableOpacity>
        </View>

        {mockLocations.map((location) => (
          <TouchableOpacity key={location.id} style={[styles.locationCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              
              <View style={styles.locationHeader}>
                <View style={styles.locationInfo}>
                  <Text style={[styles.locationName, { color: theme.colors.text }]}>{location.name}</Text>
                  <Text style={[styles.locationDescription, { color: theme.colors.textSecondary }]}>{location.description}</Text>
                  
                  <View style={styles.locationMeta}>
                    <View style={styles.metaItem}>
                      <Navigation size={14} color={theme.colors.primary} />
                      <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{location.distance}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Star size={14} color={theme.colors.warning} />
                      <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{location.rating}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.locationStats}>
                  <View style={[styles.statBadge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.statBadgeText}>{location.stories} {t('stories')}</Text>
                  </View>
                  <View style={styles.visitorCount}>
                    <Users size={12} color={theme.colors.textSecondary} />
                    <Text style={[styles.visitorText, { color: theme.colors.textSecondary }]}>{location.visitors}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}>
                  <MapPin size={16} color={theme.colors.primary} />
                  <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>{t('route')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.primaryButtonText}>{t('learnStory')}</Text>
                </TouchableOpacity>
              </View>

          </TouchableOpacity>
        ))}
      </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categoriesContainer: {
    paddingVertical: 16,
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  locationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationCard: {
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  locationInfo: {
    flex: 1,
    marginRight: 16,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  locationMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationStats: {
    alignItems: 'flex-end',
  },
  statBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  statBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  visitorCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visitorText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
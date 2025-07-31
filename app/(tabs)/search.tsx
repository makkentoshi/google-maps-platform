import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Star, ChevronDown, ChevronUp } from 'lucide-react-native';

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

type SortOption = 'rating' | 'name' | 'date' | 'relevance';
type OrderOption = 'asc' | 'desc';

export default function SearchScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [order, setOrder] = useState<OrderOption>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPlaces = async () => {
      if (!searchQuery && !minRating) {
        setPlaces([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/search`,
          {
            params: {
              query: searchQuery,
              rating: minRating ? parseFloat(minRating) : undefined,
              sortBy,
              order,
            },
          }
        );

        let fetchedPlaces = response.data.places || [];

        // Client-side sorting if API doesn't handle it
        fetchedPlaces = sortPlaces(fetchedPlaces, sortBy, order);

        setPlaces(fetchedPlaces);
      } catch (error: any) {
        console.error('Search error:', error);
        setPlaces([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchPlaces();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, minRating, sortBy, order]);

  const sortPlaces = (
    places: Place[],
    sortBy: SortOption,
    order: OrderOption
  ) => {
    const sortedPlaces = [...places].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'rating':
          comparison = (a.averageRating || 0) - (b.averageRating || 0);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'relevance':
        default:
          // For relevance, prioritize exact matches, then partial matches
          const aExact = a.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
            ? 1
            : 0;
          const bExact = b.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
            ? 1
            : 0;
          comparison = bExact - aExact;
          break;
      }

      return order === 'desc' ? -comparison : comparison;
    });

    return sortedPlaces;
  };

  const renderSortOption = (option: SortOption, label: string) => (
    <TouchableOpacity
      key={option}
      style={[
        styles.sortOption,
        {
          backgroundColor:
            sortBy === option ? theme.colors.primary : theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() => setSortBy(option)}
    >
      <Text
        style={[
          styles.sortOptionText,
          {
            color: sortBy === option ? '#FFFFFF' : theme.colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderPlace = ({ item }: { item: Place }) => (
    <TouchableOpacity
      style={[
        styles.placeCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() =>
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
        })
      }
    >
      <Text style={[styles.placeName, { color: theme.colors.text }]}>
        {item.name}
      </Text>
      <Text
        style={[styles.placeDescription, { color: theme.colors.textSecondary }]}
      >
        {item.description || t('noDescription', 'No description available')}
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
          style={[styles.ratingText, { color: theme.colors.textSecondary }]}
        >
          {item.averageRating && item.averageRating > 0
            ? item.averageRating.toFixed(1)
            : t('noReviews', 'No reviews')}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.viewButton, { backgroundColor: theme.colors.primary }]}
        onPress={() =>
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
          })
        }
      >
        <Text style={styles.viewButtonText}>{t('view', 'View')}</Text>
      </TouchableOpacity>
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
          {t('search', '🔎 Search')}
        </Text>
        <Text
          style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}
        >
          {t('searchSubtitle', 'Find places and stories')}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            { color: theme.colors.text, borderColor: theme.colors.border },
          ]}
          placeholder={t('searchPlaces', 'Search places...')}
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.filterRow}>
          <TextInput
            style={[
              styles.ratingInput,
              { color: theme.colors.text, borderColor: theme.colors.border },
            ]}
            placeholder={t('minRating', 'Min Rating (1-5)')}
            placeholderTextColor={theme.colors.textSecondary}
            value={minRating}
            onChangeText={setMinRating}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[
              styles.filterToggle,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text
              style={[styles.filterToggleText, { color: theme.colors.text }]}
            >
              {t('filters', 'Filters')}
            </Text>
            {showFilters ? (
              <ChevronUp size={16} color={theme.colors.text} />
            ) : (
              <ChevronDown size={16} color={theme.colors.text} />
            )}
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={[styles.filterLabel, { color: theme.colors.text }]}>
              {t('sortBy', 'Sort by')}:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.sortOptions}
            >
              {renderSortOption('relevance', t('relevance', 'Relevance'))}
              {renderSortOption('rating', t('rating', 'Rating'))}
              {renderSortOption('name', t('name', 'Name'))}
              {renderSortOption('date', t('date', 'Date'))}
            </ScrollView>

            <View style={styles.orderContainer}>
              <Text style={[styles.filterLabel, { color: theme.colors.text }]}>
                {t('order', 'Order')}:
              </Text>
              <View style={styles.orderButtons}>
                <TouchableOpacity
                  style={[
                    styles.orderButton,
                    {
                      backgroundColor:
                        order === 'desc'
                          ? theme.colors.primary
                          : theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => setOrder('desc')}
                >
                  <Text
                    style={[
                      styles.orderButtonText,
                      {
                        color: order === 'desc' ? '#FFFFFF' : theme.colors.text,
                      },
                    ]}
                  >
                    {t('descending', 'High to Low')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.orderButton,
                    {
                      backgroundColor:
                        order === 'asc'
                          ? theme.colors.primary
                          : theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => setOrder('asc')}
                >
                  <Text
                    style={[
                      styles.orderButtonText,
                      {
                        color: order === 'asc' ? '#FFFFFF' : theme.colors.text,
                      },
                    ]}
                  >
                    {t('ascending', 'Low to High')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            {t('searching', 'Searching...')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={places}
          renderItem={renderPlace}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsContainer}
          ListEmptyComponent={
            searchQuery || minRating ? (
              <View style={styles.emptyContainer}>
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {t('noResults', 'No places found')}
                </Text>
              </View>
            ) : null
          }
        />
      )}
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
  searchContainer: {
    padding: 20,
  },
  searchInput: {
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  ratingInput: {
    flex: 1,
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filtersContainer: {
    marginTop: 8,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sortOptions: {
    marginBottom: 16,
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderContainer: {
    marginTop: 8,
  },
  orderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  orderButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  orderButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  resultsContainer: {
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
  placeDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    marginLeft: 8,
  },
  viewButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

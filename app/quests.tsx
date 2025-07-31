// Создайте файл app/quests.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import axios from 'axios';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@clerk/clerk-expo';
import { Award, Star, ArrowLeft } from 'lucide-react-native';

export default function QuestsScreen() {
  const { theme } = useTheme();
  const { userId } = useAuth();
  const router = useRouter();

  const [quests, setQuests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        if (!userId) {
          setIsLoading(false);
          return;
        }
        setIsLoading(true);
        try {
          const response = await axios.get(
            `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/profile`,
            {
              headers: { 'x-clerk-user-id': userId },
            }
          );
          setQuests(response.data || []);
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          Alert.alert('Error', 'Could not load profile data.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchProfile();
    }, [userId])
  );

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Quests
        </Text>
      </View>
      <ScrollView style={styles.content}>
        {quests.length > 0 ? (
          quests.map((quest: any) => {
            const questProgress = (quest.progress / quest.goal) * 100;
            return (
              <View
                key={quest.id}
                style={[
                  styles.questCard,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.questIcon,
                    { backgroundColor: `${theme.colors.warning}20` },
                  ]}
                >
                  <Award size={24} color={theme.colors.warning} />
                </View>
                <View style={styles.questInfo}>
                  <Text
                    style={[styles.questTitle, { color: theme.colors.text }]}
                  >
                    {quest.title}
                  </Text>
                  <Text
                    style={[
                      styles.questDescription,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {quest.description}
                  </Text>
                  <Text
                    style={[
                      styles.questProgressText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Progress: {quest.progress} / {quest.goal}
                  </Text>
                  <View
                    style={[
                      styles.questProgressBar,
                      { backgroundColor: theme.colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.questProgressFill,
                        {
                          backgroundColor: theme.colors.warning,
                          width: `${questProgress}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
                {quest.isCompleted && (
                  <View
                    style={[
                      styles.questBadge,
                      { backgroundColor: `${theme.colors.success}20` },
                    ]}
                  >
                    <Star size={16} color={theme.colors.success} />
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <Text
            style={{
              color: theme.colors.textSecondary,
              textAlign: 'center',
              marginTop: 40,
            }}
          >
            No active quests. Go explore!
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    padding: 20,
  },
  questCard: {
    marginBottom: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
  },
  questIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  questDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  questProgressText: {
    fontSize: 12,
    marginBottom: 4,
  },
  questBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  questProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
});

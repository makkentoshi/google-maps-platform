import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@clerk/clerk-expo';
import { Dispatch, SetStateAction } from 'react';

type Comment = {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
};

type CommentsSectionProps = {
  storyId?: string;
  commentsCount: number;
  setCommentsCount: Dispatch<SetStateAction<number>>;
};

export default function CommentSection({
  storyId,
  commentsCount,
  setCommentsCount,
}: CommentsSectionProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { userId } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (storyId) {
      fetchComments();
    }
  }, [storyId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/stories/${storyId}/comment`,
        { headers: { 'x-clerk-user-id': userId } }
      );
      setComments(response.data.comments || []);
      setCommentsCount(response.data.comments?.length || 0);
    } catch (error: any) {
      console.error(
        'Fetch comments error:',
        error.response?.data || error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color={theme.colors.primary} />;
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {t('comments', 'Comments')} ({commentsCount})
      </Text>
      <FlatList
        data={comments}
        renderItem={({ item }) => (
          <View style={[styles.comment, { borderColor: theme.colors.border }]}>
            <Text style={[styles.commentText, { color: theme.colors.text }]}>
              {item.content}
            </Text>
            <Text
              style={[
                styles.commentDate,
                { color: theme.colors.textSecondary },
              ]}
            >
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, marginBottom: 32 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  comment: { padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 8 },
  commentText: { fontSize: 14 },
  commentDate: { fontSize: 12, marginTop: 4 },
});

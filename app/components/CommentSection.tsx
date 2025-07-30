import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

type Comment = {
  id: string;
  text: string;
  userId: string;
  createdAt: string;
};

type CommentSectionProps = {
  storyId?: string;
  commentsCount: number;
  setCommentsCount: React.Dispatch<React.SetStateAction<number>>;
};

export default function CommentSection({
  storyId,
  commentsCount,
  setCommentsCount,
}: CommentSectionProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (storyId) {
      const fetchComments = async () => {
        setLoading(true);
        try {
          const response = await axios.get(
            `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/stories/${storyId}/comment`
          );
          setComments(response.data.comments || []);
          setCommentsCount(response.data.comments?.length || 0);
        } catch (error: any) {
          console.error('Fetch comments error:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchComments();
    }
  }, [storyId, setCommentsCount]);

  const renderComment = ({ item }: { item: Comment }) => (
    <View
      style={[styles.commentContainer, { borderColor: theme.colors.border }]}
    >
      <Text style={[styles.commentText, { color: theme.colors.text }]}>
        {item.text}
      </Text>
      <Text style={[styles.commentMeta, { color: theme.colors.textSecondary }]}>
        {t('postedBy', 'Posted by')} {item.userId} {t('on', 'on')}{' '}
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {t('comments', 'Comments')} ({commentsCount})
      </Text>
      {loading ? (
        <Text style={{ color: theme.colors.textSecondary }}>
          {t('loading', 'Loading...')}
        </Text>
      ) : comments.length === 0 ? (
        <Text style={{ color: theme.colors.textSecondary }}>
          {t('noComments', 'No comments yet')}
        </Text>
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          style={styles.commentList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, marginBottom: 32 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  commentContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  commentText: { fontSize: 16, marginBottom: 4 },
  commentMeta: { fontSize: 12 },
  commentList: { flexGrow: 0 },
});

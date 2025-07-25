import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Image } from 'react-native';

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: {
    clerkId: string;
    username?: string;
    avatar?: string;
  };
}

interface CommentsSectionProps {
  comments: Comment[];
  isLoading: boolean;
  onAddComment?: () => void; // Опциональный callback
}

export default function CommentsSection({ 
  comments, 
  isLoading,
  onAddComment 
}: CommentsSectionProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {t('comments')} ({comments.length})
      </Text>
      
      {isLoading && comments.length === 0 ? (
        <Text style={{ color: theme.colors.text }}>{t('loading')}...</Text>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[
              styles.commentContainer,
              { backgroundColor: theme.colors.card }
            ]}>
              <View style={styles.commentHeader}>
                {/* Аватарка пользователя */}
                {item.user.avatar ? (
                  <Image 
                    source={{ uri: item.user.avatar }} 
                    style={styles.avatar}

                  />
                ) : (
                  <View style={[
                    styles.avatarPlaceholder, 
                    { backgroundColor: theme.colors.primary }
                  ]}>
                    <Text style={styles.avatarText}>
                      {item.user.username?.charAt(0) || 'U'}
                    </Text>
                  </View>
                )}
                
                <View style={styles.userInfo}>
                  <Text style={[styles.username, { color: theme.colors.primary }]}>
                    {item.user.username || t('anonymous')}
                  </Text>
                  <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
                    {formatDate(item.createdAt)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.commentText, { color: theme.colors.text }]}>
                {item.text}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ color: theme.colors.textSecondary }}>
              {t('noComments')}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  commentContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  date: {
    fontSize: 12,
    marginTop: 2,
  },
  commentText: {
    lineHeight: 20,
    fontSize: 15,
  },
});
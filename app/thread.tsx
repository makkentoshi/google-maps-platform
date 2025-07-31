import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import axios from 'axios';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@clerk/clerk-expo';
import { ArrowLeft, Send } from 'lucide-react-native';

export default function ThreadDetailScreen() {
  const { theme } = useTheme();
  const { userId } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const threadId = params.threadId as string;

  const [thread, setThread] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const fetchThread = useCallback(async () => {
    if (!threadId) return;
    // Не устанавливаем isLoading(true) здесь, чтобы избежать мигания при ре-фокусе
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/threads?threadId=${threadId}`
      );
      setThread(response.data);
    } catch (error) {
      console.error('Failed to load thread:', error);
      Alert.alert('Error', 'Could not load thread details.');
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  // --- НАЧАЛО ИСПРАВЛЕНИЙ ---
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true); // Устанавливаем загрузку только при первом фокусе
      fetchThread();
    }, [fetchThread])
  );
  // --- КОНЕЦ ИСПРАВЛЕНИЙ ---

  const handlePostComment = async () => {
    if (!userId) return Alert.alert('Error', 'Please log in to comment.');
    if (!comment.trim()) return;
    setIsPosting(true);
    try {
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/threads?threadId=${threadId}`,
        { content: comment },
        { headers: { 'x-clerk-user-id': userId } }
      );
      setComment('');
      fetchThread(); // Обновляем комментарии после успешной отправки
    } catch (error) {
      console.error('Failed to post comment:', error);
      Alert.alert('Error', 'Failed to post comment.');
    } finally {
      setIsPosting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Thread</Text>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView style={styles.content}>
          <View style={styles.threadContent}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{thread?.title}</Text>
            {thread?.content && (
              <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{thread?.content}</Text>
            )}
          </View>
          <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
          <Text style={[styles.commentsTitle, { color: theme.colors.text }]}>Comments ({thread?.comments?.length || 0})</Text>
          {thread?.comments.map((c: any) => (
            <View key={c.id} style={[styles.comment, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.commentText, { color: theme.colors.text }]}>{c.content}</Text>
              <Text style={[styles.commentAuthor, { color: theme.colors.textSecondary }]}>
                By user {c.userClerkId.slice(-4)}
              </Text>
            </View>
          ))}
        </ScrollView>
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Add a comment..."
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          />
          <TouchableOpacity onPress={handlePostComment} style={[styles.button, { backgroundColor: theme.colors.primary }]} disabled={isPosting}>
            {isPosting ? <ActivityIndicator size="small" color="#fff" /> : <Send size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
  },
  threadContent: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  separator: {
    height: 1,
    marginVertical: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  comment: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  commentText: {
    fontSize: 15,
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
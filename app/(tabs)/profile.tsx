import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import axios from 'axios';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [username, setUsername] = useState(
    user?.username || user?.firstName || ''
  );
  const [email, setEmail] = useState(
    user?.primaryEmailAddress?.emailAddress || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const response = await axios.put(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/user/profile`,
        { username },
        {
          headers: {
            'x-clerk-user-id': user?.id,
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await user?.update({ username });
      setUsername(response.data.username);
      setIsEditing(false);
      Alert.alert(
        t('success', 'Success'),
        t('profileUpdated', 'Profile updated successfully')
      );
    } catch (error: any) {
      console.error('Update profile error:', error);
      Alert.alert(
        t('errorTitle', 'Error'),
        error.response?.data?.error ||
          t('errorUpdateProfile', 'Failed to update profile')
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text
          style={[styles.errorText, { color: theme.colors.text || '#000' }]}
        >
          {t('errorFetchProfile', 'Failed to load profile')}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background || '#fff' },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.text || '#000' }]}>
        {t('profile', 'Profile')}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: theme.colors.border || '#ccc',
            color: theme.colors.text || '#000',
          },
        ]}
        value={username}
        onChangeText={setUsername}
        placeholder={t('username', 'Username')}
        editable={isEditing}
      />
      <TextInput
        style={[
          styles.input,
          {
            borderColor: theme.colors.border || '#ccc',
            color: theme.colors.text || '#000',
          },
        ]}
        value={email}
        editable={false} // Email managed by Clerk
        placeholder={t('email', 'Email')}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.colors.primary || '#007bff' },
          ]}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Text style={styles.buttonText}>
            {isEditing ? t('cancel', 'Cancel') : t('edit', 'Edit')}
          </Text>
        </TouchableOpacity>
        {isEditing && (
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: theme.colors.primary || '#007bff',
                marginTop: 16,
              },
            ]}
            onPress={handleSave}
          >
            <Text style={styles.buttonText}>{t('save', 'Save')}</Text>
          </TouchableOpacity>
        )}
      </View>
      {isLoading && (
        <ActivityIndicator
          size="large"
          color={theme.colors.primary || '#007bff'}
          style={styles.loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  loading: {
    marginTop: 16,
  },
});

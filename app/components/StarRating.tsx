import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import axios from 'axios';
import { useTheme } from '@/contexts/ThemeContext';

type StarRatingProps = {
  rating: number;
  editable?: boolean;
  placeId: string;
  onRatingChange?: (rating: number) => void;
};

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  editable = false,
  placeId,
  onRatingChange,
}) => {
  const { theme } = useTheme();
  const [tempRating, setTempRating] = useState(rating);

  const handleRatingPress = async (newRating: number) => {
    if (!editable) return;
    setTempRating(newRating);
    try {
      await axios.post(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/ratings`, {
        placeId,
        rating: newRating,
      });
      if (onRatingChange) onRatingChange(newRating);
    } catch (error: any) {
      console.error('Error submitting rating:', error);
    }
  };

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => handleRatingPress(star)}
          disabled={!editable}
        >
          <Star
            size={20}
            color={
              star <= tempRating
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
            fill={star <= tempRating ? theme.colors.primary : 'none'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
  },
});

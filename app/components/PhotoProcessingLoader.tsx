import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming,
  interpolate,
  Easing
} from 'react-native-reanimated';
import LoadingOverlay from './LoadingOverlay';

interface PhotoProcessingLoaderProps {
  visible: boolean;
}

const photoSteps = [
  { emoji: '📸', message: "Hold tight! We're analyzing your photo 📱" },
  { emoji: '🔍', message: "Don't go anywhere! Finding the perfect spot 🗺️" },
  { emoji: '✨', message: "Almost there! Adding some magic ✨" },
  { emoji: '🎯', message: "Final touches! Getting everything ready 🚀" },
];

export default function PhotoProcessingLoader({ visible }: PhotoProcessingLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Start animations
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      rotation.value = withRepeat(
        withTiming(360, { duration: 4000, easing: Easing.linear }),
        -1,
        false
      );

      // Change steps every 5 seconds
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % photoSteps.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [visible]);

  const animatedEmojiStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${interpolate(rotation.value, [0, 360], [0, 15])}deg` }
      ],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <LoadingOverlay visible={visible}>
      <View style={styles.content}>
        <Animated.Text style={[styles.emoji, animatedEmojiStyle]}>
          {photoSteps[currentStep].emoji}
        </Animated.Text>
        
        <Animated.Text style={[styles.message, animatedTextStyle]}>
          {photoSteps[currentStep].message}
        </Animated.Text>
        
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  opacity: withRepeat(
                    withSequence(
                      withTiming(0.3, { duration: 600 }),
                      withTiming(1, { duration: 600 })
                    ),
                    -1,
                    false
                  ),
                },
              ]}
            />
          ))}
        </View>
      </View>
    </LoadingOverlay>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 80,
    marginBottom: 30,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 40,
    lineHeight: 24,
    maxWidth: 280,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginHorizontal: 4,
  },
});
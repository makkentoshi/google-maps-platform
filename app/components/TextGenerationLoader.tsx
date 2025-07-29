import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import LoadingOverlay from './LoadingOverlay';

const { height } = Dimensions.get('window');

interface TextGenerationLoaderProps {
  visible: boolean;
}

const textSteps = [
  { emoji: '🤖', message: 'Brewing some digital magic 🎭' },
  { emoji: '✍️', message: 'Crafting words just for you 📝' },
  { emoji: '🧠', message: 'Thinking really hard right now 💭' },
  { emoji: '🚀', message: 'Launching your content into orbit 🌟' },
];

export default function TextGenerationLoader({
  visible,
}: TextGenerationLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Floating animation
      translateY.value = withRepeat(
        withSequence(
          withTiming(-10, {
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(10, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Pulsing animation
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      // Change steps every 5 seconds
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % textSteps.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [visible]);

  const animatedEmojiStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { translateY: translateY.value }],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <LoadingOverlay visible={visible}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Animated.Text style={[styles.emoji, animatedEmojiStyle]}>
            {textSteps[currentStep].emoji}
          </Animated.Text>

          <Animated.Text style={[styles.message, animatedTextStyle]}>
            {textSteps[currentStep].message}
          </Animated.Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: withRepeat(
                      withSequence(
                        withTiming('20%', { duration: 1200 }),
                        withTiming('80%', { duration: 1200 }),
                        withTiming('40%', { duration: 1200 })
                      ),
                      -1,
                      false
                    ),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>Generating...</Text>
          </View>
        </View>
      </View>
    </LoadingOverlay>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    minHeight: height,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 20,
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
  progressContainer: {
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
});

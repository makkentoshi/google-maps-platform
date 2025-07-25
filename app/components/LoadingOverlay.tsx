import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface LoadingOverlayProps {
  visible: boolean;
  children: React.ReactNode;
}

const { width, height } = Dimensions.get('window');

export default function LoadingOverlay({ visible, children }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <Animated.View 
      style={styles.overlay}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
    >
      <View style={styles.container}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    width,
    height,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
});
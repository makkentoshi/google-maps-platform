import React from 'react';
import Animated from 'react-native-reanimated';

type AnimationProviderProps = {
  children: React.ReactNode;
};

export const AnimationProvider: React.FC<AnimationProviderProps> = ({
  children,
}) => {
  return <Animated.View style={{ flex: 1 }}>{children}</Animated.View>;
};

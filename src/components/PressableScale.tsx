
import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface PressableScaleProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  scale?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PressableScale({ 
  children, 
  onPress, 
  style,
  scale = 0.95 
}: PressableScaleProps) {
  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(pressed.value ? scale : 1, {
            damping: 15,
            stiffness: 150,
          }),
        },
      ],
    };
  });

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPressIn={() => {
        pressed.value = true;
      }}
      onPressOut={() => {
        pressed.value = false;
      }}
      onPress={onPress}
    >
      {children}
    </AnimatedPressable>
  );
}

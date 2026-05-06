import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue, LayoutChangeEvent } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing,
  interpolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const Skeleton = ({ width, height, borderRadius = 8, style }: SkeletonProps) => {
  const [viewWidth, setViewWidth] = React.useState(0);
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { 
        duration: 1500, 
        easing: Easing.bezier(0.4, 0, 0.6, 1) 
      }),
      -1,
      false
    );
  }, []);

  const onLayout = (event: LayoutChangeEvent) => {
    setViewWidth(event.nativeEvent.layout.width);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            translateX.value,
            [-1, 1],
            [-viewWidth, viewWidth]
          ),
        },
      ],
    };
  });

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        { width, height, borderRadius },
        style,
      ]}
    >
      <AnimatedLinearGradient
        colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, animatedStyle]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
});

export default Skeleton;

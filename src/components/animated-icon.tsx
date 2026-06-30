import { Image } from 'expo-image';
import { useState, useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
// @ts-ignore
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming, runOnJS, withRepeat, interpolate } from 'react-native-reanimated';

const DURATION = 600;

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(Dimensions.get('screen').height / 90);

  useEffect(() => {
    scale.value = withTiming(1, {
      duration: DURATION,
      easing: Easing.elastic(0.7),
    });
    opacity.value = withTiming(0, {
      duration: DURATION,
      easing: Easing.inOut(Easing.ease),
    }, (finished?: boolean) => {
      if (finished) {
        runOnJS(setVisible)(false);
      }
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.backgroundSolidColor, animatedStyle]}
    />
  );
}

export function AnimatedIcon() {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(Dimensions.get('screen').height / 90);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
    scale.value = withTiming(1, {
      duration: DURATION,
      easing: Easing.elastic(0.7),
    });
    contentOpacity.value = withTiming(1, {
      duration: DURATION,
    });
  }, []);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }],
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.glow, rotationStyle]}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View style={[styles.background, backgroundStyle]} />
      <Animated.View style={[styles.imageContainer, contentStyle]}>
        <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    position: 'absolute',
    width: 76,
    height: 71,
  },
  background: {
    borderRadius: 40,
    backgroundColor: '#FF3B30',
    width: 128,
    height: 128,
    position: 'absolute',
  },
  backgroundSolidColor: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FF3B30',
    zIndex: 1000,
  },
});

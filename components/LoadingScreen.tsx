import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface LoadingScreenProps {
  message: string;
  submessage?: string;
  visible: boolean;
}

export default function LoadingScreen({ message, submessage, visible }: LoadingScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start fade in animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Start continuous rotation for loading spinner
      const rotationAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      rotationAnimation.start();

      return () => {
        rotationAnimation.stop();
      };
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View 
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        }
      ]}
    >
      <LinearGradient
        colors={['#0F0F23', '#1A1A3A', '#0F0F23']}
        style={styles.container}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Loading Spinner */}
          <Animated.View 
            style={[
              styles.spinner,
              {
                transform: [{ rotate: rotation }]
              }
            ]}
          >
            <View style={styles.spinnerDot1} />
            <View style={styles.spinnerDot2} />
            <View style={styles.spinnerDot3} />
          </Animated.View>

          {/* Main Message */}
          <Text style={styles.message}>{message}</Text>
          
          {/* Submessage if provided */}
          {submessage && (
            <Text style={styles.submessage}>{submessage}</Text>
          )}
        </Animated.View>
      </LinearGradient>
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
    zIndex: 1000,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 40,
  },
  spinner: {
    width: 60,
    height: 60,
    marginBottom: 30,
    position: 'relative',
  },
  spinnerDot1: {
    position: 'absolute',
    top: 0,
    left: 25,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B6B',
  },
  spinnerDot2: {
    position: 'absolute',
    top: 15,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ECDC4',
  },
  spinnerDot3: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#45B7D1',
  },
  message: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  submessage: {
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

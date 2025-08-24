import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  // Animation values for the 'S' letter
  const sLetterY = useRef(new Animated.Value(100)).current; // Start below center
  const sLetterX = useRef(new Animated.Value(0)).current; // Will move left when penza arrives
  const sLetterOpacity = useRef(new Animated.Value(0)).current;
  const sLetterScale = useRef(new Animated.Value(0.5)).current;
  
  // Animation values for 'penza' text
  const penzaX = useRef(new Animated.Value(200)).current; // Start from right
  const penzaOpacity = useRef(new Animated.Value(0)).current;
  
  // Animation values for tagline (after logo animation)
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Complex cartoonish animation sequence
    Animated.sequence([
      // Step 1: 'S' jumps up with reduced cartoon bounce (1.5 seconds)
      Animated.parallel([
        // S appears with opacity
        Animated.timing(sLetterOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // S jumps up with reduced cartoon bounce
        Animated.spring(sLetterY, {
          toValue: 0, // Center position
          tension: 80,  // Increased tension for less bounce
          friction: 7,  // Increased friction for less oscillation
          useNativeDriver: true,
        }),
        // S scales up with reduced cartoon effect
        Animated.sequence([
          Animated.spring(sLetterScale, {
            toValue: 1.2, // Reduced overshoot from 1.4 to 1.2
            tension: 100, // Increased tension
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(sLetterScale, {
            toValue: 1, // Settle back to normal
            tension: 140, // Increased tension for faster settle
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]),
      
      // Step 2: 'penza' slides in immediately after first bounce (1 second)
      Animated.parallel([
        // 'penza' slides in from right with overshoot
        Animated.sequence([
          Animated.timing(penzaX, {
            toValue: -20, // Overshoot to the left
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(penzaX, {
            toValue: 0, // Bounce back to final position
            tension: 120,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        // 'penza' fades in
        Animated.timing(penzaOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        // 'S' moves WITH penza - synchronized movement with proper timing
        Animated.sequence([
          Animated.delay(300), // Longer delay for S to wait for penza to arrive first
          // First, S moves with penza's initial slide
          Animated.timing(sLetterX, {
            toValue: -28, // Moves further left with penza's overshoot (-20 + -8)
            duration: 300, // Faster to catch up with penza
            useNativeDriver: true,
          }),
          // Then S settles back with penza to final position
          Animated.spring(sLetterX, {
            toValue: -8, // Final position for S
            tension: 120, // Same spring settings as penza
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        // Quote appears when both letters settle into final position
        Animated.sequence([
          Animated.delay(600), // After initial movement completes
          Animated.parallel([
            Animated.timing(taglineOpacity, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.spring(taglineY, {
              toValue: 0,
              tension: 120,
              friction: 8,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),
    ]).start();

    // Check auth status and navigate accordingly after animation (2.8 seconds total)
    const timer = setTimeout(async () => {
      try {
        // Complete fade out before navigation to prevent flash
        Animated.parallel([
          Animated.timing(sLetterOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(penzaOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(taglineOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(async () => {
          // Navigate after fade out completes
          const token = await AsyncStorage.getItem('authToken');
          const hasLoggedIn = await AsyncStorage.getItem('hasLoggedIn');
          
          if (token && hasLoggedIn === 'true') {
            // Validate token with server
            try {
              const response = await fetch('http://10.77.221.151:3002/api/auth/validate', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                const data = await response.json();
                if (data.status === 'success') {
                  // Token is valid and user exists on server, go to main app
                  router.replace('/(tabs)');
                  return;
                }
              }
              
              // Token is invalid or user doesn't exist on server
              // Clear local storage and go to login
              await AsyncStorage.multiRemove(['authToken', 'hasLoggedIn', 'userData']);
              router.replace('/(tabs)/LoginPage');
            } catch (error) {
              console.error('Token validation error:', error);
              // Network error or server down, clear storage and go to login
              await AsyncStorage.multiRemove(['authToken', 'hasLoggedIn', 'userData']);
              router.replace('/(tabs)/LoginPage');
            }
          } else {
            // No token or hasn't logged in, go directly to login
            router.replace('/(tabs)/LoginPage');
          }
        });
      } catch (error) {
        console.error('Auth check error:', error);
        // On error, clear storage and go to login page
        await AsyncStorage.multiRemove(['authToken', 'hasLoggedIn', 'userData']);
        router.replace('/(tabs)/LoginPage');
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F23' }}>
      <LinearGradient
        colors={['#0F0F23', '#1A1A3A', '#0F0F23']}
        style={styles.container}
      >
      {/* Animated Logo Container */}
      <View style={styles.logoContainer}>
        {/* Animated 'S' letter */}
        <Animated.Text
          style={[
            styles.logoS,
            {
              opacity: sLetterOpacity,
              transform: [
                { translateY: sLetterY },
                { translateX: sLetterX },
                { scale: sLetterScale },
              ],
            },
          ]}
        >
          S
        </Animated.Text>
        
        {/* Animated 'penza' text */}
        <Animated.Text
          style={[
            styles.logoText,
            {
              opacity: penzaOpacity,
              transform: [{ translateX: penzaX }],
            },
          ]}
        >
          penza
        </Animated.Text>
      </View>

      {/* Animated Tagline */}
      <Animated.View
        style={[
          styles.taglineContainer,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineY }],
          },
        ]}
      >
        <Text style={styles.tagline}>Your finances, simplified.</Text>
        <Text style={styles.subtitle}>Track • Budget • Save</Text>
      </Animated.View>

      {/* Background decorative elements */}
      <View style={styles.backgroundCircle1} />
      <View style={styles.backgroundCircle2} />
      <View style={styles.backgroundCircle3} />
    </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F23',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100, // Fixed height to prevent layout shifts
    marginBottom: 40,
    width: '100%', // Ensure full width for proper centering
  },
  logoS: {
    color: '#FF6B6B',
    fontSize: 72,
    fontWeight: '900',
    textShadowColor: 'rgba(255, 107, 107, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    textAlign: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 64,
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    // Position it right next to the S with minimal gap
    marginLeft: 0, // Reduced from 2 to 0 for tighter spacing
  },
  taglineContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  tagline: {
    fontSize: 20, // Increased from 18
    color: '#E0E0E0', // Brighter color from #B0B0B0
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
    fontWeight: '500', // Added weight for better visibility
    textShadowColor: 'rgba(224, 224, 224, 0.5)', // Added text shadow
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 14,
    color: '#8A8A8A',
    textAlign: 'center',
    fontWeight: '300',
  },
  // Background decorative elements
  backgroundCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    top: -50,
    right: -50,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 195, 0, 0.08)',
    bottom: -30,
    left: -40,
  },
  backgroundCircle3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(138, 43, 226, 0.08)',
    top: height * 0.3,
    left: -20,
  },
});

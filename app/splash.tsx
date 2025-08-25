import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const navigation = useNavigation();
  
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
          console.log('🔄 Splash - Checking authentication...');
          const token = await AsyncStorage.getItem('authToken');
          const hasLoggedIn = await AsyncStorage.getItem('hasLoggedIn');
          
          console.log('🔍 Splash - Auth check:', { 
            hasToken: !!token, 
            hasLoggedIn: hasLoggedIn === 'true' 
          });
          
          // For now, skip server validation and just use local storage
          // TODO: Add server validation later when needed
          if (token && hasLoggedIn === 'true') {
            console.log('✅ Splash - User authenticated, going to Main (Home)');
          } else {
            console.log('❌ Splash - User not authenticated, going to Main (Login)');
          }
          
          // Always navigate to Main - let MainNavigator handle auth routing
          console.log('🎯 Splash - Navigating to Main...');
          navigation.navigate('Main' as never);
        });
      } catch (error) {
        console.error('Auth check error:', error);
        // On error, clear storage and go to login page
        await AsyncStorage.multiRemove(['authToken', 'hasLoggedIn', 'userData']);
        navigation.navigate('Main' as never);
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      <StatusBar style="light" backgroundColor="#0F0F23" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
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
    marginBottom: 120, // Increased from 80 to push it higher up
    marginTop: -20, // Added negative margin to move it closer to logo
  },
  tagline: {
    fontSize: 20,
    color: '#E0E0E0',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
    fontWeight: '500',
    textShadowColor: 'rgba(224, 224, 224, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 14,
    color: '#8A8A8A',
    textAlign: 'center',
    fontWeight: '300',
  },
  // Background decorative elements - more subtle and professional
  backgroundCircle1: {
    position: 'absolute',
    width: 160, // Reduced size
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 107, 107, 0.06)', // More subtle opacity
    top: -30,
    right: -40,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: 120, // Reduced size
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 195, 0, 0.05)', // More subtle
    bottom: -20,
    left: -30,
  },
  backgroundCircle3: {
    position: 'absolute',
    width: 100, // Reduced size
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(138, 43, 226, 0.05)', // More subtle
    top: height * 0.25, // Adjusted position
    left: -15,
  },
});

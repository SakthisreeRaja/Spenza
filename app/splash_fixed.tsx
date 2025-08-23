import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
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
        // 'S' moves left ONLY when penza is arriving (delayed start)
        Animated.sequence([
          Animated.delay(300), // Reduced delay for faster response
          Animated.spring(sLetterX, {
            toValue: -8, // Reduced movement for less spacing
            tension: 150, // Increased tension for faster movement
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        // Quote appears RIGHT when penza hits (at 300ms into this step)
        Animated.sequence([
          Animated.delay(300), // Same timing as when penza hits
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
      
      // Step 3: Final celebration wiggle (0.3 seconds)
      Animated.parallel([
        // Both letters do a small celebration wiggle
        Animated.sequence([
          Animated.timing(sLetterScale, {
            toValue: 1.1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(sLetterScale, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        // Penza also wiggles
        Animated.sequence([
          Animated.timing(penzaX, {
            toValue: 5,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(penzaX, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // Check auth status and navigate accordingly after animation (3.1 seconds total)
    const timer = setTimeout(async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const hasLoggedIn = await AsyncStorage.getItem('hasLoggedIn');
        
        if (token && hasLoggedIn === 'true') {
          // User is authenticated, go to main app
          router.replace('/(tabs)');
        } else {
          // User not authenticated, go directly to login
          router.replace('/(tabs)/LoginPage');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // On error, go to login page
        router.replace('/(tabs)/LoginPage');
      }
    }, 3100);

    return () => clearTimeout(timer);
  }, []);

  return (
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

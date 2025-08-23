import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { authAPI, handleApiError } from "../../services/api";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Error states
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  // Bouncing animation for S letter and penza movement
  const sBounceAnim = useRef(new Animated.Value(1)).current;
  const penzaMoveAnim = useRef(new Animated.Value(0)).current;
  
  // Bubble animation values
  const bubble1X = useRef(new Animated.Value(0)).current;
  const bubble1Y = useRef(new Animated.Value(0)).current;
  const bubble1Rotate = useRef(new Animated.Value(0)).current;
  const bubble2X = useRef(new Animated.Value(0)).current;
  const bubble2Y = useRef(new Animated.Value(0)).current;
  const bubble2Rotate = useRef(new Animated.Value(0)).current;
  const bubble3X = useRef(new Animated.Value(0)).current;
  const bubble3Y = useRef(new Animated.Value(0)).current;
  const bubble3Rotate = useRef(new Animated.Value(0)).current;
  const bubble4X = useRef(new Animated.Value(0)).current;
  const bubble4Y = useRef(new Animated.Value(0)).current;
  const bubble4Rotate = useRef(new Animated.Value(0)).current;

  // Validation functions
  const validateEmail = (email: string) => {
    if (!email) return isSignUp ? "Email is required" : "Email or username is required";
    
    if (isSignUp) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return "Please enter a valid email address";
    }
    
    return "";
  };

  const validatePassword = (password: string) => {
    if (!password) return "Password is required";
    
    // Only apply detailed validation for signup
    if (isSignUp) {
      if (password.length < 8) return "Password must be at least 8 characters";
      if (!/(?=.*[a-zA-Z])/.test(password)) return "Password must contain letters";
      if (!/(?=.*\d)/.test(password)) return "Password must contain numbers";
    }
    
    return "";
  };

  const validateUsername = (username: string) => {
    if (!username) return "Username is required";
    if (username.length < 3) return "Username must be at least 3 characters";
    return "";
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword && isSignUp) return "Please confirm your password";
    if (confirmPassword !== password && isSignUp) return "Passwords do not match";
    return "";
  };

  // Handle input changes without validation
  const handleEmailChange = (text: string) => {
    setEmail(text);
    // Clear error when user starts typing again
    if (emailError) setEmailError("");
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    // Clear error when user starts typing again
    if (passwordError) setPasswordError("");
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    // Clear error when user starts typing again
    if (usernameError) setUsernameError("");
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    // Clear error when user starts typing again
    if (confirmPasswordError) setConfirmPasswordError("");
  };

  // Form submission
  const handleSubmit = async () => {
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const usernameErr = isSignUp ? validateUsername(username) : "";
    const confirmPasswordErr = isSignUp ? validateConfirmPassword(password, confirmPassword) : "";

    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setUsernameError(usernameErr);
    setConfirmPasswordError(confirmPasswordErr);

    if (!emailErr && !passwordErr && (!isSignUp || (!usernameErr && !confirmPasswordErr))) {
      // Clear any existing errors before making API call
      setEmailError("");
      setPasswordError("");
      setUsernameError("");
      setConfirmPasswordError("");
      
      try {
        if (isSignUp) {
          console.log('🔄 Starting registration process...');
          // Register new user
          const response = await authAPI.register({
            username,
            email,
            password,
            firstName: "", // You can add firstName/lastName fields if needed
            lastName: ""
          });

          console.log('📝 Registration response:', response);

          if (response.status === 'success') {
            console.log('✅ Registration successful, saving auth data...');
            // Save auth data
            await AsyncStorage.setItem('authToken', response.data?.token || '');
            await AsyncStorage.setItem('userData', JSON.stringify(response.data?.user || {}));
            await AsyncStorage.setItem('hasLoggedIn', 'true');
            
            console.log('🔄 Navigating to main app...');
            // Navigate directly to main app after successful signup
            router.replace("/(tabs)");
          }
        } else {
          console.log('🔄 Starting login process...');
          // Login existing user
          const response = await authAPI.login({
            emailOrUsername: email, // Using email field for email or username
            password
          });

          console.log('📝 Login response:', response);

          if (response.status === 'success') {
            console.log('✅ Login successful, saving auth data...');
            // Save auth data
            await AsyncStorage.setItem('authToken', response.data?.token || '');
            await AsyncStorage.setItem('userData', JSON.stringify(response.data?.user || {}));
            await AsyncStorage.setItem('hasLoggedIn', 'true');
            
            console.log('🔄 Navigating to main app...');
            router.replace("/(tabs)");
          }
          // Note: Error responses are handled in the catch block
        }
      } catch (error) {
        // Removed console.error to prevent "Auth error" message display
        const errorMessage = handleApiError(error);
        
        // Show only custom error message for login failures, no auth system messages
        if (!isSignUp && (errorMessage.includes('Invalid credentials') || errorMessage.includes('invalid') || errorMessage.includes('password') || errorMessage.includes('credential'))) {
          setPasswordError("Invalid username/password");
        } else {
          // For other errors, log silently - no auth system messages
          console.log('🔕 Auth error (silenced):', errorMessage);
        }
      }
    }
  };

  const handleForgotPassword = () => {
    console.log('🔕 Forgot password requested (feature not implemented)');
    // Silent handling - no alert popup
  };

  useEffect(() => {
    // Start logo animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Start bouncing effect for S letter after 3 seconds (reduced for testing)
    const bounceTimer = setTimeout(() => {
      const createBounceEffect = () => {
        // Simple single bounce - no parallel, just one at a time
        Animated.sequence([
          Animated.timing(sBounceAnim, {
            toValue: 1.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(sBounceAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();

        // Simple single move for penza
        Animated.sequence([
          Animated.timing(penzaMoveAnim, {
            toValue: 10,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(penzaMoveAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Continue bouncing every 7 seconds
          setTimeout(createBounceEffect, 7000);
        });
      };
      createBounceEffect();
    }, 3000); // Reduced from 5000 to 3000 for faster testing

    // Enhanced random movement animations for bubbles (slower)
    const createContinuousMovement = () => {
      const moveToNewPosition = (animX: Animated.Value, animY: Animated.Value, animRotate: Animated.Value, duration: number) => {
        const randomX = (Math.random() - 0.5) * 80; // Reduced from 100 to 80
        const randomY = (Math.random() - 0.5) * 80; // Reduced from 100 to 80
        
        Animated.parallel([
          Animated.timing(animX, {
            toValue: randomX,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animY, {
            toValue: randomY,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animRotate, {
            toValue: Math.random() * 360,
            duration: duration * 2, // Slower rotation
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Immediately start new movement when current one finishes
          moveToNewPosition(animX, animY, animRotate, duration + Math.random() * 2000); // Added more random delay
        });
      };

      // Start movement for each bubble with slower, different timings
      moveToNewPosition(bubble1X, bubble1Y, bubble1Rotate, 4000); // Increased from 2000
      setTimeout(() => moveToNewPosition(bubble2X, bubble2Y, bubble2Rotate, 5000), 1000); // Increased from 2500
      setTimeout(() => moveToNewPosition(bubble3X, bubble3Y, bubble3Rotate, 3500), 2000); // Increased from 1800
      setTimeout(() => moveToNewPosition(bubble4X, bubble4Y, bubble4Rotate, 4500), 3000); // Increased from 2200
    };

    createContinuousMovement();
    
    // Cleanup timers when component unmounts
    return () => {
      clearTimeout(bounceTimer);
    };
  }, []);

  // Clear form fields when navigating back to login page (e.g., after logout)
  useFocusEffect(
    useCallback(() => {
      // Clear all form fields and errors when the screen comes into focus
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setUsernameError("");
      setEmailError("");
      setPasswordError("");
      setConfirmPasswordError("");
    }, [])
  );

  // Check if form is valid
  // Check if form has required content (not validation)
  const isFormValid = () => {
    if (isSignUp) {
      return username.trim() !== "" && email.trim() !== "" && password.trim() !== "" && confirmPassword.trim() !== "";
    }
    return email.trim() !== "" && password.trim() !== "";
  };

  return (
    <LinearGradient
      colors={['#0F0F23', '#1A1A3A', '#0F0F23']} // Soft gradient background
      style={styles.container}
    >
      {/* Animated Background Bubbles - Behind everything */}
      <Animated.View 
        style={[
          styles.backgroundCircle1,
          {
            transform: [
              { translateX: bubble1X },
              { translateY: bubble1Y },
              { rotate: bubble1Rotate.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg']
              })}
            ]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.backgroundCircle2,
          {
            transform: [
              { translateX: bubble2X },
              { translateY: bubble2Y },
              { rotate: bubble2Rotate.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg']
              })}
            ]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.backgroundCircle3,
          {
            transform: [
              { translateX: bubble3X },
              { translateY: bubble3Y },
              { rotate: bubble3Rotate.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg']
              })}
            ]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.backgroundCircle4,
          {
            transform: [
              { translateX: bubble4X },
              { translateY: bubble4Y },
              { rotate: bubble4Rotate.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg']
              })}
            ]
          }
        ]} 
      />

      {/* Main Content - Above bubbles */}
      <View style={styles.contentContainer}>
        {/* Animated Spenza Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <View style={styles.logoRow}>
            <Animated.Text style={[styles.logoS, { transform: [{ scale: sBounceAnim }] }]}>S</Animated.Text>
            <Animated.Text style={[styles.logoText, { transform: [{ translateX: penzaMoveAnim }] }]}>penza</Animated.Text>
          </View>
          <Text style={styles.tagline}>Your finances, simplified.</Text>
        </Animated.View>

        {/* Professional Login/Signup Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={styles.formSubtitle}>
            {isSignUp ? 'Sign up to get started' : 'Sign in to your account'}
          </Text>

          {/* Username field (only for signup) */}
          {isSignUp && (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, usernameError ? styles.inputError : null]}
                placeholder="Username"
                placeholderTextColor="#aaa"
                value={username}
                onChangeText={handleUsernameChange}
                autoCapitalize="none"
              />
              {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
            </View>
          )}

          {/* Email field */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder={isSignUp ? "Email" : "Email or Username"}
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType={isSignUp ? "email-address" : "default"}
              autoCapitalize="none"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          {/* Password field */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, passwordError ? styles.inputError : null]}
              placeholder="Password"
              placeholderTextColor="#aaa"
              secureTextEntry
              value={password}
              onChangeText={handlePasswordChange}
              autoCapitalize="none"
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          {/* Confirm Password field (only for signup) */}
          {isSignUp && (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, confirmPasswordError ? styles.inputError : null]}
                placeholder="Confirm Password"
                placeholderTextColor="#aaa"
                secureTextEntry
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                autoCapitalize="none"
              />
              {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
            </View>
          )}

          {/* Forgot Password Link (only for login) */}
          {!isSignUp && (
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.button, !isFormValid() ? styles.buttonDisabled : null]} 
            onPress={handleSubmit}
            disabled={!isFormValid()}
          >
            <Text style={styles.buttonText}>
              {isSignUp ? 'Sign Up' : 'Login'}
            </Text>
          </TouchableOpacity>

          {/* Toggle between Login/Signup */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            </Text>
            <TouchableOpacity onPress={() => {
              setIsSignUp(!isSignUp);
              // Clear all form fields when switching
              setUsername("");
              setEmail("");
              setPassword("");
              setConfirmPassword("");
              // Clear errors when switching
              setUsernameError("");
              setEmailError("");
              setPasswordError("");
              setConfirmPasswordError("");
            }}>
              <Text style={styles.toggleLink}>
                {isSignUp ? 'Login' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    overflow: 'hidden', // Hide overflowing bubbles
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10, // Ensure content is above bubbles
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logoS: {
    color: '#FF6B6B', // Bright red for 'S'
    fontSize: 56,
    fontWeight: '900',
    textShadowColor: 'rgba(255, 107, 107, 0.5)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 20,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#B0B0B0',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    width: '100%',
  },
  inputError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // Light red background for errors
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
    paddingLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#6B7280',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    color: '#A1A1AA',
    fontSize: 14,
  },
  toggleLink: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
  },
  // Background bubble styles
  backgroundCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 107, 107, 0.15)', // Semi-transparent red
    top: 120,
    right: -50,
    zIndex: 1, // Behind content
  },
  backgroundCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 195, 0, 0.12)', // Semi-transparent yellow
    bottom: 80,
    left: -40,
    zIndex: 1,
  },
  backgroundCircle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(138, 43, 226, 0.1)', // Semi-transparent purple
    top: 300,
    left: 50,
    zIndex: 1,
  },
  backgroundCircle4: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 191, 255, 0.12)', // Semi-transparent blue
    bottom: 50,
    right: -30,
    zIndex: 1,
  },
});

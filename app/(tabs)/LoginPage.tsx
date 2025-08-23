import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations when component mounts
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

    // Continuous rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  function onLoginSuccess() {
    // Here you can add validation or API check
    if (email && password) {
      router.replace("/(tabs)"); // Go to tabs after login
    } else {
      alert("Please enter email and password");
    }
  }

  return (
    <View style={styles.container}>
      {/* Animated Background Elements */}
      <Animated.View 
        style={[
          styles.backgroundCircle1,
          {
            transform: [{ rotate: rotateInterpolate }]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.backgroundCircle2,
          {
            transform: [{ rotate: rotateInterpolate }]
          }
        ]} 
      />

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
        <Text style={styles.logo}>
          <Text style={styles.logoS}>S</Text>
          <Text style={styles.logoText}>penza</Text>
        </Text>
        <Text style={styles.tagline}>Your Smart Finance Partner</Text>
      </Animated.View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={onLoginSuccess}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F23", // Deep dark blue background
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    overflow: 'hidden',
  },
  backgroundCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 107, 107, 0.1)', // Semi-transparent red
    top: -50,
    right: -50,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 195, 0, 0.1)', // Semi-transparent yellow
    bottom: -30,
    left: -30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    fontSize: 48,
    fontWeight: "900",
    marginBottom: 10,
    textAlign: 'center',
  },
  logoS: {
    color: "#FF6B6B", // Bright red for 'S'
    fontSize: 52,
    textShadowColor: 'rgba(255, 107, 107, 0.5)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 20,
  },
  logoText: {
    color: "#FFFFFF", // White for 'penza'
    fontSize: 48,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 16,
    color: "#B0B0B0",
    fontStyle: 'italic',
    textAlign: 'center',
  },
  input: {
    width: "100%",
    height: 55,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#fff",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  button: {
    backgroundColor: "#FF6B6B", // Spenza brand color
    width: "100%",
    height: 55,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: "#FF6B6B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});

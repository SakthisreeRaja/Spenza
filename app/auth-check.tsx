import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function AuthCheck() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if user has logged in before
      const hasLoggedIn = await AsyncStorage.getItem('hasLoggedIn');
      const authToken = await AsyncStorage.getItem('authToken');

      // Small delay to show the check is happening
      setTimeout(() => {
        if (hasLoggedIn && authToken) {
          // User has logged in before and has a token - go to home
          router.replace('/(tabs)' as any);
        } else {
          // First time user or no token - go to tabs (will redirect to login automatically)
          router.replace('/(tabs)' as any);
        }
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Auth check error:', error);
      // On error, go to tabs
      router.replace('/(tabs)' as any);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F23',
  },
});

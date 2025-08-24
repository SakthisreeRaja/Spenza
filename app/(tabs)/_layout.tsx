import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import LoginPage from './LoginPage';
import AIChatPage from './aichat';
import HomePage from './index';

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  const navigation = useNavigation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check authentication state only once when component mounts
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const hasLoggedIn = await AsyncStorage.getItem('hasLoggedIn');
        
        console.log('🔍 Main Navigator - Checking auth:', { 
          hasToken: !!token, 
          hasLoggedIn: hasLoggedIn === 'true' 
        });

        if (token && hasLoggedIn === 'true') {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ Main Navigator - Auth check error:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuthStatus();
  }, []); // Empty dependency array - only run once on mount

  // Show loading spinner while checking authentication
  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F23' }}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={{ color: '#FFFFFF', marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F0F23' },
        animation: 'slide_from_right',
      }}
      initialRouteName={isAuthenticated ? "Home" : "Login"}
    >
      {/* Authentication Screens */}
      <Stack.Screen 
        name="Login" 
        component={LoginPage}
        options={{
          animation: 'fade',
        }}
      />
      
      {/* Main App Screens */}
      <Stack.Screen 
        name="Home" 
        component={HomePage}
        options={{
          animation: 'slide_from_left',
        }}
      />
      <Stack.Screen 
        name="AIChat" 
        component={AIChatPage}
        options={{
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
    </Stack.Navigator>
  );
}

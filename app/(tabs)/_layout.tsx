import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import AIChatPage from './aichat';
import HomePage from './index';
import LoginPage from './LoginPage';
import ProfilePage from './ProfilePage';

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  const navigation = useNavigation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check authentication state only once when component mounts
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('🔄 MainNavigator - Starting auth check...');
        
        const token = await AsyncStorage.getItem('authToken');
        const hasLoggedIn = await AsyncStorage.getItem('hasLoggedIn');
        const userData = await AsyncStorage.getItem('userData');
        
        console.log('🔍 MainNavigator - Auth values:', { 
          token: token ? 'exists' : 'null',
          hasLoggedIn: hasLoggedIn,
          hasUserData: !!userData
        });

        if (token && hasLoggedIn === 'true' && userData) {
          console.log('✅ MainNavigator - User is authenticated - going to Home');
          setIsAuthenticated(true);
        } else {
          console.log('❌ MainNavigator - User not authenticated - going to Login');
          // Clear any orphaned profile images when not authenticated
          if (!token || hasLoggedIn !== 'true') {
            console.log('🧹 MainNavigator - Clearing any orphaned data...');
            await AsyncStorage.multiRemove(['authToken', 'userData', 'hasLoggedIn']);
          }
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ MainNavigator - Auth check error:', error);
        console.log('🔄 MainNavigator - Defaulting to Login due to error');
        setIsAuthenticated(false);
      }
    };

    checkAuthStatus();
  }, []); // Empty dependency array - only run once on mount

  // Show loading spinner while checking authentication
  if (isAuthenticated === null) {
    console.log('🔄 Showing loading screen...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F23' }}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={{ color: '#FFFFFF', marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  console.log('🎯 Navigator will render with isAuthenticated:', isAuthenticated);
  const initialRoute = isAuthenticated ? "Home" : "Login";
  console.log('🎯 Initial route will be:', initialRoute);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F0F23' },
        animation: 'slide_from_right',
      }}
      initialRouteName={initialRoute}
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
      <Stack.Screen 
        name="Profile" 
        component={ProfilePage}
        options={{
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
    </Stack.Navigator>
  );
}

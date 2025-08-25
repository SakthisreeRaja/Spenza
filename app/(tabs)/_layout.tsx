import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Text, View } from 'react-native';

import AIChatPage from './aichat';
import HomePage from './index';
import LoginPage from './LoginPage';
import ProfilePage from './ProfilePage';

const Stack = createStackNavigator();

export default function MainNavigator() {
  const navigation = useNavigation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Function to handle logout
  const handleLogout = async () => {
    try {
      console.log('🚪 Performing logout...');
      // Clear authentication data but keep profile images for future logins
      await AsyncStorage.multiRemove([
        'authToken', 
        'hasLoggedIn', 
        'userData'
      ]);
      
      console.log('✅ Logout completed - keeping profile images for future logins');
      setIsAuthenticated(false);
    } catch (error) {
      console.error('❌ Error during logout:', error);
      setIsAuthenticated(false);
    }
  };

  // Make logout function available globally
  React.useEffect(() => {
    (global as any).appLogout = handleLogout;
    return () => {
      delete (global as any).appLogout;
    };
  }, []);

  // Function to check authentication status
  const checkAuthStatus = async () => {
    try {
      console.log('🔄 MainNavigator - Starting auth check...');
      
      let shouldClearAuth = false;
      
      try {
        console.log('🔍 Checking server health...');
        const response = await fetch('http://172.16.13.183:3002/health');
        const healthData = await response.json();
        const currentSessionId = healthData.sessionId;
        
        console.log('🔍 Current server session ID:', currentSessionId);
        
        const lastSessionId = await AsyncStorage.getItem('serverSessionId');
        console.log('🔍 Last stored session ID:', lastSessionId);
        
        if (lastSessionId && lastSessionId !== currentSessionId) {
          console.log('🚨 Server restart detected - will clear all cached data');
          shouldClearAuth = true;
          
          const keys = await AsyncStorage.getAllKeys();
          const userDataKeys = keys.filter(key => 
            key.startsWith('profileImage_') || 
            key === 'authToken' || 
            key === 'userData' || 
            key === 'hasLoggedIn'
          );
          console.log('🧹 Clearing keys:', userDataKeys);
          await AsyncStorage.multiRemove(userDataKeys);
        }
        
        await AsyncStorage.setItem('serverSessionId', currentSessionId);
      } catch (healthError) {
        console.log('⚠️ Could not check server health:', healthError);
        console.log('⚠️ Proceeding with normal auth check');
      }
      
      if (shouldClearAuth) {
        console.log('❌ Server restart - forcing logout');
        setIsAuthenticated(false);
        return;
      }
      
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
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ MainNavigator - Error checking auth status:', error);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('📱 App became active - rechecking auth');
        checkAuthStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    const authCheckInterval = setInterval(() => {
      if (AppState.currentState === 'active') {
        checkAuthStatus();
      }
    }, 2000);

    return () => {
      subscription?.remove();
      clearInterval(authCheckInterval);
    };
  }, []);

  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading...</Text>
      </View>
    );
  }

  console.log('🎯 Navigator will render with isAuthenticated:', isAuthenticated);

  return (
    <Stack.Navigator 
      key={isAuthenticated ? 'authenticated' : 'unauthenticated'}
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS, // 👈 smooth slide transition
        gestureEnabled: true,
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 400,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 400,
            },
          },
        },
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Home" component={HomePage} />
          <Stack.Screen name="Profile" component={ProfilePage} />
          <Stack.Screen name="AIChat" component={AIChatPage} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginPage} />
      )}
    </Stack.Navigator>
  );
}

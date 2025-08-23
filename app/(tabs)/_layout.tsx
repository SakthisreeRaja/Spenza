import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check authentication state only once when component mounts
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const hasLoggedIn = await AsyncStorage.getItem('hasLoggedIn');
        
        console.log('🔍 Tab Layout - Checking auth:', { 
          hasToken: !!token, 
          hasLoggedIn: hasLoggedIn === 'true' 
        });

        if (token && hasLoggedIn === 'true') {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          // Only redirect if we're not already on the login page
          setTimeout(() => {
            router.push('/(tabs)/LoginPage');
          }, 100);
        }
      } catch (error) {
        console.error('❌ Tab Layout - Auth check error:', error);
        setIsAuthenticated(false);
        setTimeout(() => {
          router.push('/(tabs)/LoginPage');
        }, 100);
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
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#8A8A8A',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A3A',
          borderTopColor: 'rgba(255, 107, 107, 0.2)',
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          paddingTop: 5,
          height: Platform.OS === 'ios' ? 85 : 60,
          // Hide tabs when not authenticated
          display: isAuthenticated ? 'flex' : 'none',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      
      {/* Login Page - Hidden from tabs but accessible */}
      <Tabs.Screen
        name="LoginPage"
        options={{
          title: "Login",
          tabBarButton: () => null, // Hide from tab bar but keep route accessible
          tabBarStyle: { display: 'none' }, // Hide tab bar on this screen
        }}
      />

      {/* Home Screen - Main tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size || 24, color }}>🏠</Text>
          ),
        }}
      />

      {/* Expenses Screen */}
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size || 24, color }}>💳</Text>
          ),
        }}
      />

      {/* Budget Screen */}
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size || 24, color }}>📊</Text>
          ),
        }}
      />

      {/* Profile Screen */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size || 24, color }}>👤</Text>
          ),
        }}
      />

      {/* Test Screen - Completely hidden */}
      <Tabs.Screen
        name="TestScreen"
        options={{
          href: null, // This completely removes it from the router
        }}
      />

    </Tabs>
  );
}

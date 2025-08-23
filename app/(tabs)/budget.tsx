import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BudgetScreen() {
  return (
    <LinearGradient
      colors={['#0F0F23', '#1A1A3A', '#0F0F23']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.emoji}>📊</Text>
          <Text style={styles.title}>Budget</Text>
          <Text style={styles.subtitle}>Plan and manage your monthly budgets</Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => Alert.alert('Coming Soon', 'Budget management features will be added here!')}
          >
            <Text style={styles.buttonText}>Create Budget</Text>
          </TouchableOpacity>
          
          <View style={styles.features}>
            <Text style={styles.featureTitle}>Coming Features:</Text>
            <Text style={styles.feature}>• Set monthly budgets</Text>
            <Text style={styles.feature}>• Category-wise budgeting</Text>
            <Text style={styles.feature}>• Budget vs actual spending</Text>
            <Text style={styles.feature}>• Budget alerts and notifications</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 40,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  features: {
    alignItems: 'flex-start',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  feature: {
    fontSize: 16,
    color: '#B0B0B0',
    marginBottom: 8,
  },
});

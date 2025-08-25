import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface User {
  username: string;
  email: string;
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export default function HomePage() {
  const navigation = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Animation for the S icon bounce
  const bounceAnim = useRef(new Animated.Value(1)).current;
  // Animation for the arrow movement (left-right-left)
  const arrowMoveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserData();
    
    // Add focus listener to reload profile image when returning from profile screen
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Bounce animation every 7 seconds
    const bounceInterval = setInterval(() => {
      // S bounce animation
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, 7000);

    // Arrow slide animation every 2 seconds (independent)
    const arrowInterval = setInterval(() => {
      Animated.sequence([
        // Move right
        Animated.timing(arrowMoveAnim, {
          toValue: 8,
          duration: 200,
          useNativeDriver: true,
        }),
        // Move left
        Animated.timing(arrowMoveAnim, {
          toValue: -5,
          duration: 200,
          useNativeDriver: true,
        }),
        // Return to center
        Animated.timing(arrowMoveAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(timeInterval);
      clearInterval(bounceInterval);
      clearInterval(arrowInterval);
    };
  }, [bounceAnim, arrowMoveAnim, navigation]);

  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    
    if (hour >= 5 && hour < 12) {
      return {
        greeting: "Good Morning",
        icon: "🌅",
        color: "#FFB347" // Orange
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: "Good Afternoon",
        icon: "☀️",
        color: "#FFC107" // Yellow
      };
    } else if (hour >= 17 && hour < 22) {
      return {
        greeting: "Good Evening",
        icon: "🌆",
        color: "#FF7043" // Orange-red
      };
    } else {
      return {
        greeting: "Good Night",
        icon: "🌙",
        color: "#9C27B0" // Purple
      };
    }
  };

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      
      if (userData) {
        const user = JSON.parse(userData);
        setUser(user);
        
        // Load profile image specific to this user ONLY
        const userProfileKey = `profileImage_${user.email}`;
        const savedProfileImage = await AsyncStorage.getItem(userProfileKey);
        
        if (savedProfileImage) {
          console.log(`✅ Loading profile image for user: ${user.email}`);
          setProfileImage(savedProfileImage);
        } else {
          console.log(`🔄 No profile image found for user: ${user.email}`);
          setProfileImage(null);
        }
      } else {
        // Critical: Clear ALL user-related state if no user data
        console.log('🧹 No user data found - clearing all user state');
        setUser(null);
        setProfileImage(null);
      }
      
      // Load sample data for now with better categorization
      setTotalExpenses(1250.50);
      setRecentExpenses([
        { id: 1, description: 'Groceries at Walmart', amount: 45.50, category: 'Food', date: 'Today' },
        { id: 2, description: 'Gas Station Fill-up', amount: 60.00, category: 'Transport', date: 'Yesterday' },
        { id: 3, description: 'Starbucks Coffee', amount: 5.25, category: 'Food', date: 'Yesterday' },
        { id: 4, description: 'Netflix Subscription', amount: 15.99, category: 'Entertainment', date: '2 days ago' },
        { id: 5, description: 'Uber Ride', amount: 12.75, category: 'Transport', date: '3 days ago' },
      ]);
    } catch (error) {
      console.error('Error loading user data:', error);
      // Critical: Clear state on any error
      setUser(null);
      setProfileImage(null);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['authToken', 'userData', 'hasLoggedIn']);
              navigation.navigate('Login' as never);
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const QuickActionCard = ({ title, icon, onPress, color = '#FF6B6B' }: {
    title: string;
    icon: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity style={[styles.actionCard, { borderColor: color }]} onPress={onPress}>
      <Text style={[styles.actionIcon, { color }]}>{icon}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food': return '🍽️';
      case 'transport': return '🚗';
      case 'entertainment': return '🎬';
      case 'shopping': return '🛍️';
      case 'bills': return '📄';
      case 'health': return '⚕️';
      case 'education': return '📚';
      default: return '💰';
    }
  };

  const ExpenseItem = ({ expense }: { expense: Expense }) => (
    <View style={styles.expenseItem}>
      <View style={styles.expenseLeft}>
        <View style={styles.expenseIconContainer}>
          <Text style={styles.expenseIcon}>{getCategoryIcon(expense.category)}</Text>
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDescription}>{expense.description}</Text>
          <Text style={styles.expenseCategory}>{expense.category} • {expense.date}</Text>
        </View>
      </View>
      <Text style={styles.expenseAmount}>-₹{expense.amount}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      <StatusBar style="light" backgroundColor="#0F0F23" />
      <LinearGradient
        colors={['#0F0F23', '#1A1A3A', '#0F0F23']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.greetingContainer}>
              <Text style={[styles.greeting, { color: getTimeBasedGreeting().color }]}>
                {getTimeBasedGreeting().greeting}!
              </Text>
              <Text style={styles.userName}>{user?.username || 'User'}</Text>
              <Text style={styles.currentTime}>
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
            <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile' as never)}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.defaultProfileIcon}>
                  <Text style={styles.profileIconText}>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.profileDot} />
            </TouchableOpacity>
          </View>

          {/* Enhanced Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Total Expenses This Month</Text>
              <Text style={styles.balanceIcon}>💰</Text>
            </View>
            <Text style={styles.balanceAmount}>₹{totalExpenses.toFixed(2)}</Text>
            <View style={styles.balanceStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>23</Text>
                <Text style={styles.statLabel}>Transactions</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>₹41.85</Text>
                <Text style={styles.statLabel}>Avg per day</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>8%</Text>
                <Text style={styles.statLabel}>vs last month</Text>
              </View>
            </View>
            <View style={styles.balanceActions}>
              <TouchableOpacity style={styles.balanceButton}>
                <Text style={styles.balanceButtonText}>📊 View Details</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Speak with Spenza */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.spenzaChatButton}
              onPress={() => navigation.navigate('AIChat' as never)}
              activeOpacity={0.8}
            >
              <View style={styles.spenzaHeader}>
                <View style={styles.spenzaIcon}>
                  <Animated.Text style={[styles.spenzaIconText, { transform: [{ scale: bounceAnim }] }]}>
                    S
                  </Animated.Text>
                </View>
                <View style={styles.spenzaContent}>
                  <Text style={styles.spenzaTitle}>Speak with Spenza</Text>
                  <Text style={styles.spenzaSubtitle}>Your Personal Finance Assistant</Text>
                </View>
                <Animated.Text style={[styles.spenzaArrow, { transform: [{ translateX: arrowMoveAnim }] }]}>
                  →
                </Animated.Text>
              </View>
              
              <Text style={styles.spenzaDescription}>
                Get smart financial advice and spending insights.
              </Text>
              
              <View style={styles.spenzaFeatures}>
                <Text style={styles.spenzaFeature}>💰 Expense Analysis</Text>
                <Text style={styles.spenzaFeature}>📊 Budget Planning</Text>
                <Text style={styles.spenzaFeature}>💡 Smart Tips</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Enhanced Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <QuickActionCard
                title="Add Expense"
                icon="💸"
                color="#FF6B6B"
                onPress={() => Alert.alert('Coming Soon', 'Add Expense feature coming soon!')}
              />
              <QuickActionCard
                title="View Budget"
                icon="📊"
                color="#4ECDC4"
                onPress={() => Alert.alert('Coming Soon', 'Budget feature coming soon!')}
              />
              <QuickActionCard
                title="Categories"
                icon="🏷️"
                color="#45B7D1"
                onPress={() => Alert.alert('Coming Soon', 'Categories feature coming soon!')}
              />
              <QuickActionCard
                title="Reports"
                icon="📈"
                color="#96CEB4"
                onPress={() => Alert.alert('Coming Soon', 'Reports feature coming soon!')}
              />
            </View>
          </View>

          {/* Recent Expenses */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Expenses</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.expensesList}>
              {recentExpenses.map((expense) => (
                <ExpenseItem key={expense.id} expense={expense} />
              ))}
            </View>
          </View>
        </ScrollView>
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
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 20, // Reduced since SafeAreaView handles status bar
    marginBottom: 30,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  greetingIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  currentTime: {
    fontSize: 14,
    color: '#B0B0B0',
    fontStyle: 'italic',
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    overflow: 'hidden',
  },
  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    resizeMode: 'cover',
  },
  defaultProfileIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  profileIconText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  profileDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#0F0F23',
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceIcon: {
    fontSize: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#B0B0B0',
    flex: 1,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  balanceActions: {
    flexDirection: 'row',
  },
  balanceButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  balanceButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  expensesList: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 4,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseIcon: {
    fontSize: 18,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  expenseAmount: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  // Spenza Chat Button styles
  spenzaChatButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  spenzaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  spenzaIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  spenzaIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  spenzaContent: {
    flex: 1,
  },
  spenzaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  spenzaSubtitle: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  spenzaArrow: {
    fontSize: 20,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  spenzaDescription: {
    fontSize: 14,
    color: '#B0B0B0',
    lineHeight: 20,
    marginBottom: 16,
  },
  spenzaFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  spenzaFeature: {
    fontSize: 12,
    color: '#B0B0B0',
    fontWeight: '500',
  },
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      // Load sample data for now
      setTotalExpenses(1250.50);
      setRecentExpenses([
        { id: 1, description: 'Groceries', amount: 45.50, category: 'Food', date: 'Today' },
        { id: 2, description: 'Gas', amount: 60.00, category: 'Transport', date: 'Yesterday' },
        { id: 3, description: 'Coffee', amount: 5.25, category: 'Food', date: 'Yesterday' },
      ]);
    } catch (error) {
      console.error('Error loading user data:', error);
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
              await AsyncStorage.multiRemove(['authToken', 'userData']);
              router.replace('/(tabs)/LoginPage');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const QuickActionCard = ({ title, icon, onPress, color = '#FF6B6B' }) => (
    <TouchableOpacity style={[styles.actionCard, { borderColor: color }]} onPress={onPress}>
      <Text style={[styles.actionIcon, { color }]}>{icon}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const ExpenseItem = ({ expense }) => (
    <View style={styles.expenseItem}>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseDescription}>{expense.description}</Text>
        <Text style={styles.expenseCategory}>{expense.category} • {expense.date}</Text>
      </View>
      <Text style={styles.expenseAmount}>-₹{expense.amount}</Text>
    </View>
  );

  return (
    <LinearGradient
      colors={['#0F0F23', '#1A1A3A', '#0F0F23']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Good Morning!</Text>
              <Text style={styles.userName}>{user?.username || 'User'}</Text>
            </View>
            <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Expenses This Month</Text>
            <Text style={styles.balanceAmount}>₹{totalExpenses.toFixed(2)}</Text>
            <View style={styles.balanceActions}>
              <TouchableOpacity style={styles.balanceButton}>
                <Text style={styles.balanceButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
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
                icon="📁"
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  greeting: {
    fontSize: 16,
    color: '#B0B0B0',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 24,
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
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
});

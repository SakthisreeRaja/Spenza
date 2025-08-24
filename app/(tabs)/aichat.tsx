import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    BackHandler,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface UserFinancialData {
  totalExpenses: number;
  monthlyBudget: number;
  recentTransactions: Array<{
    description: string;
    amount: number;
    category: string;
    date: string;
  }>;
  categories: Record<string, number>;
}

export default function AIChatPage() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userFinancialData, setUserFinancialData] = useState<UserFinancialData | null>(null);
  const flatListRef = useRef<FlatList>(null);
  
  // Animation for the S icon bounce (same as home screen)
  const bounceAnim = useRef(new Animated.Value(1)).current;

  // Handle navigation back with proper direction
  const handleGoBack = () => {
    (navigation as any).navigate('Home');
  };

  useEffect(() => {
    loadUserFinancialData();
    addWelcomeMessage();
    
    // Handle Android back button
    const backAction = () => {
      handleGoBack();
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    
    // Bounce animation every 7 seconds (same as home screen)
    const bounceInterval = setInterval(() => {
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

    return () => {
      clearInterval(bounceInterval);
      backHandler.remove();
    };
  }, [bounceAnim]);

  const loadUserFinancialData = async () => {
    try {
      // Load user's actual financial data
      const userData = await AsyncStorage.getItem('userData');
      
      // Mock financial data - in a real app, this would come from your backend/storage
      const financialData: UserFinancialData = {
        totalExpenses: 1250.50,
        monthlyBudget: 2000.00,
        recentTransactions: [
          { description: 'Groceries at Walmart', amount: 45.50, category: 'Food', date: 'Today' },
          { description: 'Gas Station Fill-up', amount: 60.00, category: 'Transport', date: 'Yesterday' },
          { description: 'Starbucks Coffee', amount: 5.25, category: 'Food', date: 'Yesterday' },
          { description: 'Netflix Subscription', amount: 15.99, category: 'Entertainment', date: '2 days ago' },
          { description: 'Uber Ride', amount: 12.75, category: 'Transport', date: '3 days ago' },
        ],
        categories: {
          'Food': 285.75,
          'Transport': 142.50,
          'Entertainment': 95.30,
          'Shopping': 210.45,
          'Bills': 516.50
        }
      };
      
      setUserFinancialData(financialData);
    } catch (error) {
      console.error('Error loading financial data:', error);
    }
  };

  const addWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: "Hello! I'm your AI financial assistant. I'm currently running in demo mode with sample responses. In the full version, I would analyze your real spending data and provide personalized financial advice. Feel free to ask me about budgeting, savings, or investments!",
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse = generateSimulatedResponse(currentInput);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500); // 1.5 second delay to simulate API response
  };

  const generateSimulatedResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Sample financial responses based on keywords
    if (input.includes('budget') || input.includes('spending')) {
      return "Based on your current spending patterns, you're using about 62.5% of your monthly budget. I recommend setting aside 20% for savings and keeping entertainment expenses under ₹100 per month.";
    }
    
    if (input.includes('save') || input.includes('saving')) {
      return "Great question about savings! With your current income, I suggest following the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings. You could potentially save ₹400-500 more per month by reducing dining out expenses.";
    }
    
    if (input.includes('investment') || input.includes('invest')) {
      return "For investment advice, consider starting with a diversified portfolio. Based on your spending habits, you might have ₹750 available for monthly investments. Consider SIPs in mutual funds or index funds for long-term growth.";
    }
    
    if (input.includes('expense') || input.includes('transaction')) {
      return "Looking at your recent transactions, your highest spending categories are Food (₹285.75) and Bills (₹516.50). Consider meal planning to reduce food costs and review your subscription services.";
    }
    
    if (input.includes('hello') || input.includes('hi')) {
      return "Hello! I'm here to help you with your finances. I can provide insights about your spending, budgeting tips, and help you plan your financial goals. What would you like to know?";
    }
    
    // Default response
    return "I understand you're asking about your finances. While I'd love to give you personalized advice, I'm currently in demo mode. In a full version, I would analyze your actual spending data and provide specific recommendations based on your financial situation.";
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setMessages([]);
            addWelcomeMessage();
          },
        },
      ]
    );
  };

  const MessageItem = ({ message }: { message: Message }) => (
    <View style={[styles.messageContainer, message.isUser ? styles.userMessage : styles.aiMessage]}>
      <View style={[styles.messageBubble, message.isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.messageText, message.isUser ? styles.userText : styles.aiText]}>
          {message.text}
        </Text>
        <Text style={[styles.timestamp, message.isUser ? styles.userTimestamp : styles.aiTimestamp]}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      <StatusBar style="light" backgroundColor="#0F0F23" />
      <LinearGradient
        colors={['#0F0F23', '#1A1A3A', '#0F0F23']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.aiIconContainer}>
              <Animated.Text style={[styles.aiIcon, { transform: [{ scale: bounceAnim }] }]}>
                S
              </Animated.Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Spenza AI</Text>
              <Text style={styles.headerSubtitle}>Your Financial Assistant</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.clearButton} onPress={clearChat}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item }) => <MessageItem message={item} />}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />

          {isLoading && (
            <View style={styles.loadingContainer}>
              <View style={styles.typingIndicator}>
                <Text style={styles.typingText}>AI is typing</Text>
                <View style={styles.loadingDots}>
                  <View style={[styles.dot, styles.dot1]} />
                  <View style={[styles.dot, styles.dot2]} />
                  <View style={[styles.dot, styles.dot3]} />
                </View>
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask me about your finances..."
                placeholderTextColor="#8E8E93"
                multiline
                maxLength={500}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLoading) && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <Text style={styles.sendButtonText}>
                  {isLoading ? '⏳' : '➤'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: -6,
  },
  backButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 28,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#B0B0B0',
    marginTop: 2,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#FF6B6B',
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 6,
    opacity: 0.7,
  },
  userTimestamp: {
    color: '#FFFFFF',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#B0B0B0',
  },
  loadingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    alignSelf: 'flex-start',
    maxWidth: '60%',
  },
  typingText: {
    fontSize: 14,
    color: '#B0B0B0',
    marginRight: 8,
  },
  loadingDots: {
    flexDirection: 'row',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B0B0B0',
    marginHorizontal: 1,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.8,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    maxHeight: 100,
    marginRight: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sendButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

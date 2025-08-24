import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Alert,
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
  profileImage?: string;
}

interface ProfileOption {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  action: () => void;
  showArrow?: boolean;
}

export default function ProfilePage() {
  const navigation = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      
      if (userData) {
        const user = JSON.parse(userData);
        setUser(user);
        
        // Load profile image specific to this user
        const userProfileKey = `profileImage_${user.email}`;
        const savedProfileImage = await AsyncStorage.getItem(userProfileKey);
        
        if (savedProfileImage) {
          setProfileImage(savedProfileImage);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleImagePicker = async () => {
    Alert.alert(
      'Select Profile Photo',
      'Choose your photo source. You can crop and adjust the image after selection.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: handleCameraPhoto },
        { text: 'Gallery', onPress: handleGalleryPhoto },
      ]
    );
  };

  const handleCameraPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        
        // Save to AsyncStorage with user-specific key
        if (user?.email) {
          const userProfileKey = `profileImage_${user.email}`;
          await AsyncStorage.setItem(userProfileKey, imageUri);
        }
        
        Alert.alert('Success', 'Profile photo updated successfully!');
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo.');
    }
  };

  const handleGalleryPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Photo library permission is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        
        // Save to AsyncStorage with user-specific key
        if (user?.email) {
          const userProfileKey = `profileImage_${user.email}`;
          await AsyncStorage.setItem(userProfileKey, imageUri);
        }
        
        Alert.alert('Success', 'Profile photo updated successfully!');
      }
    } catch (error: any) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo.');
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
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('hasLoggedIn');
              (navigation as any).navigate('Login');
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
        },
      ]
    );
  };

  const profileOptions: ProfileOption[] = [
    {
      id: 'personal-details',
      title: 'Personal Details',
      subtitle: 'Update your personal information',
      icon: '👤',
      action: () => Alert.alert('Coming Soon', 'Personal details editing will be available soon.'),
      showArrow: true,
    },
    {
      id: 'change-password',
      title: 'Change Password',
      subtitle: 'Update your account password',
      icon: '🔒',
      action: () => Alert.alert('Coming Soon', 'Password change will be available soon.'),
      showArrow: true,
    },
    {
      id: 'language',
      title: 'Language',
      subtitle: 'English',
      icon: '🌐',
      action: () => Alert.alert('Language', 'Language selection will be available soon.'),
      showArrow: true,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage your notification preferences',
      icon: '🔔',
      action: () => Alert.alert('Coming Soon', 'Notification settings will be available soon.'),
      showArrow: true,
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      subtitle: 'Manage your privacy settings',
      icon: '🛡️',
      action: () => Alert.alert('Coming Soon', 'Privacy settings will be available soon.'),
      showArrow: true,
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: '❓',
      action: () => Alert.alert('Help & Support', 'Contact us at support@spenza.com'),
      showArrow: true,
    },
    {
      id: 'about',
      title: 'About Spenza',
      subtitle: 'Version 1.0.0',
      icon: 'ℹ️',
      action: () => Alert.alert('About Spenza', 'Spenza - Your Smart Financial Assistant\nVersion 1.0.0'),
      showArrow: true,
    },
    {
      id: 'logout',
      title: 'Logout',
      subtitle: 'Sign out of your account',
      icon: '🚪',
      action: handleLogout,
      showArrow: false,
    },
  ];

  const ProfileOptionItem = ({ option }: { option: ProfileOption }) => (
    <TouchableOpacity style={styles.optionItem} onPress={option.action}>
      <View style={styles.optionLeft}>
        <View style={styles.optionIconContainer}>
          <Text style={styles.optionIcon}>{option.icon}</Text>
        </View>
        <View style={styles.optionTextContainer}>
          <Text style={styles.optionTitle}>{option.title}</Text>
          {option.subtitle && (
            <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
          )}
        </View>
      </View>
      {option.showArrow && (
        <Text style={styles.optionArrow}>→</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      <StatusBar style="light" backgroundColor="#0F0F23" />
      <LinearGradient
        colors={['#0F0F23', '#1A1A3A', '#0F0F23']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => (navigation as any).navigate('Home')}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <TouchableOpacity style={styles.avatarContainer} onPress={handleImagePicker}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.defaultAvatar}>
                  <Text style={styles.defaultAvatarText}>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            <Text style={styles.userName}>{user?.username || 'User Name'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            
            <TouchableOpacity style={styles.editProfileButton} onPress={handleImagePicker}>
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Options Section */}
          <View style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            <View style={styles.optionsList}>
              {profileOptions.slice(0, 2).map((option) => (
                <ProfileOptionItem key={option.id} option={option} />
              ))}
            </View>
          </View>

          <View style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.optionsList}>
              {profileOptions.slice(2, 5).map((option) => (
                <ProfileOptionItem key={option.id} option={option} />
              ))}
            </View>
          </View>

          <View style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>Support</Text>
            <View style={styles.optionsList}>
              {profileOptions.slice(5, 7).map((option) => (
                <ProfileOptionItem key={option.id} option={option} />
              ))}
            </View>
          </View>

          <View style={styles.optionsSection}>
            <View style={styles.optionsList}>
              <ProfileOptionItem option={profileOptions[7]} />
            </View>
          </View>

          <View style={styles.bottomPadding} />
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
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -6,
  },
  backButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FF6B6B',
    resizeMode: 'cover',
  },
  defaultAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FF6B6B',
  },
  defaultAvatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#B0B0B0',
    marginBottom: 20,
  },
  editProfileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  editProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  optionsSection: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  optionsList: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIcon: {
    fontSize: 20,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  optionArrow: {
    fontSize: 18,
    color: '#B0B0B0',
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 40,
  },
});

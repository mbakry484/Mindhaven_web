import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator, Platform, Modal } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from 'expo-image-picker';
import { API_URLS } from "../../utils/config/apiConfig";
import { useUser } from "../../utils/UserContext";
import { Ionicons } from '@expo/vector-icons';
import '../i18n';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage } from '../i18n';

const DEFAULT_AVATAR = require("../../assets/images/no-profile.png");

const ProfileScreen = () => {
  const { user, loading, updateProfileImage } = useUser();
  const { t, i18n } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const router = useRouter();
  const [language, setLanguage] = useState('en');
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const languageOptions = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  ];

  // Initialize language state with stored language
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem('selected_language');
        if (storedLanguage) {
          setLanguage(storedLanguage);
        } else {
          setLanguage(getCurrentLanguage());
        }
      } catch (error) {
        console.error('Error getting stored language:', error);
        setLanguage(getCurrentLanguage());
      }
    };

    initializeLanguage();

    const handleLanguageChange = (lng) => {
      setLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  const handleLanguageSelect = async (code) => {
    setLanguage(code);
    setDropdownVisible(false);
    await changeLanguage(code);
  };

  // Function to get CSRF token from cookies
  const getCSRFToken = () => {
    if (Platform.OS === 'web') {
      const name = 'csrftoken';
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    }
    return null;
  };

  const pickImageAndUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Permission to access media library is required!');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (pickerResult.canceled) {
        return;
      }

      setUploading(true);
      const userId = await AsyncStorage.getItem('user_id');

      if (!userId) {
        throw new Error('User ID not found');
      }

      const uri = pickerResult.assets[0].uri;
      const fileName = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(fileName);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('user_id', userId.toString());

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type });
        formData.append('profile_image', file);
      } else {
        formData.append('profile_image', {
          uri: uri,
          name: fileName,
          type: type
        });
      }

      const csrfToken = getCSRFToken();
      const headers = {
        'Accept': 'application/json',
      };

      if (Platform.OS === 'web') {
        if (csrfToken) {
          headers['X-CSRFToken'] = csrfToken;
        }
      }

      const uploadResponse = await fetch(API_URLS.UPDATE_PROFILE_IMAGE(userId), {
        method: 'POST',
        headers: headers,
        body: formData,
        credentials: 'include',
      });

      const responseText = await uploadResponse.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid response from server');
      }

      if (!uploadResponse.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      const imageUrl = data.profile_image;
      if (typeof updateProfileImage === 'function') {
        updateProfileImage(imageUrl);
      }
      setImageError(false);
      Alert.alert('Success', 'Profile image updated!');
    } catch (err) {
      console.error('Error uploading image:', err);
      Alert.alert('Error', err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLogoutConfirm = async () => {
    try {
      await AsyncStorage.removeItem('user_id');
      await AsyncStorage.removeItem('token');
      router.replace('/login');
    } catch (err) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
    setShowLogoutModal(false);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      setShowLogoutModal(true);
    } else {
      Alert.alert(
        t('profile.logoutConfirmTitle') || 'Confirm Logout',
        t('profile.logoutConfirmMessage') || 'Are you sure you want to logout?',
        [
          {
            text: t('profile.no') || 'No',
            style: 'cancel',
          },
          {
            text: t('profile.yes') || 'Yes',
            style: 'destructive',
            onPress: handleLogoutConfirm,
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5100F3" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Please log in to view your profile</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: imageError ? DEFAULT_AVATAR : (user.profile_image || DEFAULT_AVATAR) }}
              style={styles.profileImage}
              onError={() => setImageError(true)}
            />
            <TouchableOpacity
              style={styles.editImageButton}
              onPress={pickImageAndUpload}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>

          {/* Language Setting */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="language" size={24} color="#5100F3" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Language</Text>
                <Text style={styles.settingValue}>
                  {languageOptions.find(opt => opt.code === language)?.label}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setDropdownVisible(!dropdownVisible)}
            >
              <Ionicons
                name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#64748b"
              />
            </TouchableOpacity>
          </View>

          {/* Language Dropdown */}
          {dropdownVisible && (
            <View style={styles.languageDropdown}>
              {languageOptions.map(option => (
                <TouchableOpacity
                  key={option.code}
                  style={[
                    styles.languageOption,
                    language === option.code && styles.languageOptionActive
                  ]}
                  onPress={() => handleLanguageSelect(option.code)}
                >
                  <Text style={styles.languageFlag}>{option.flag}</Text>
                  <Text style={[
                    styles.languageText,
                    language === option.code && styles.languageTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Logout Option */}
          <TouchableOpacity
            style={[styles.settingItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="log-out-outline" size={24} color="#dc2626" />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, styles.logoutText]}>{t('profile.logout')}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Confirmation Modal for Web */}
      {Platform.OS === 'web' && (
        <Modal
          visible={showLogoutModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {t('profile.logoutConfirmTitle') || 'Confirm Logout'}
              </Text>
              <Text style={styles.modalMessage}>
                {t('profile.logoutConfirmMessage') || 'Are you sure you want to logout?'}
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => setShowLogoutModal(false)}
                >
                  <Text style={styles.modalCancelButtonText}>
                    {t('profile.no') || 'No'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalConfirmButton]}
                  onPress={handleLogoutConfirm}
                >
                  <Text style={styles.modalConfirmButtonText}>
                    {t('profile.yes') || 'Yes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  header: {
    backgroundColor: "#5100F3",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#5100F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 10,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(81, 0, 243, 0.05)',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(81, 0, 243, 0.1)',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#5100F3',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5100F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  settingsSection: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(81, 0, 243, 0.05)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  settingButton: {
    padding: 8,
  },
  languageDropdown: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  languageOptionActive: {
    backgroundColor: 'rgba(81, 0, 243, 0.1)',
  },
  languageFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  languageText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  languageTextActive: {
    color: '#5100F3',
    fontWeight: '700',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#dc2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
  },
  modalCancelButton: {
    backgroundColor: '#f1f5f9',
  },
  modalConfirmButton: {
    backgroundColor: '#dc2626',
  },
  modalCancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalConfirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ProfileScreen;

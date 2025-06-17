// Home.js
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, ActivityIndicator, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "../UserContext";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GROQ_API_URL, GROQ_API_KEY, GROQ_MODEL } from '../config/aiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import quotes from '../../quotes.json';

const Home = () => {
  const router = useRouter();
  const { user } = useUser();

  const handleProfilePress = () => {
    router.push("/profile");
  };

  const handleMoodTrackerPress = () => {
    router.push("/mood-tracker");
  };

  return (
    <LinearGradient
      colors={["#f3e7fa", "#e3e0ff"]}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <Header onProfilePress={handleProfilePress} />
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          <Text style={styles.welcomeText}>Welcome back, {user?.name || 'Friend'}!</Text>
          <Text style={styles.subtitle}>Your mental wellness journey continues</Text>

          <DailyQuote />

          <TouchableOpacity onPress={handleMoodTrackerPress}>
            <MoodTracker />
          </TouchableOpacity>

          <QuickStats />

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <RecentActivities />
        </ScrollView>
      </View>
    </LinearGradient>
  );
};

const Header = ({ onProfilePress }) => {
  const { user } = useUser();
  const router = useRouter();

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.logoAndTitle}
        onPress={() => router.push("/landing")}
      >
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>MindHaven</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onProfilePress}>
        <Image
          source={
            !user?.profile_image
              ? require("../../assets/images/no-profile.png")
              : { uri: user.profile_image }
          }
          style={styles.profileImage}
        />
      </TouchableOpacity>
    </View>
  );
};

const fetchRandomQuote = () => {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
};

const DailyQuote = () => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  const getQuote = () => {
    setLoading(true);
    try {
      const data = fetchRandomQuote();
      setQuote(data);
    } catch (e) {
      setQuote({ quote: "Could not fetch quote.", author: "Unknown" });
    }
    setLoading(false);
  };

  useEffect(() => {
    getQuote();
  }, []);

  return (
    <View style={styles.quoteCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#6c4ab6', fontSize: 16 }}>Wellness Quote</Text>
        </View>
        <TouchableOpacity onPress={getQuote}>
          <Ionicons name="refresh" size={24} color="#5100F3" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color="#5100F3" style={{ marginVertical: 10 }} />
      ) : (
        <>
          <Text style={styles.quoteText}>
            {quote?.quote}
          </Text>
          <Text style={styles.quoteAuthor}>- {quote?.author}</Text>
        </>
      )}
    </View>
  );
};

const QuickStats = () => {
  const [journalCount, setJournalCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [showStreakModal, setShowStreakModal] = useState(false);

  useEffect(() => {
    const fetchJournalCount = async () => {
      try {
        const userId = await AsyncStorage.getItem('user_id');
        const response = await fetch(`http://localhost:8000/api/get_journal_entries/${userId}/`);
        const data = await response.json();
        const journalEntries = data.entries || data.journal_entries || [];
        setJournalCount(Array.isArray(journalEntries) ? journalEntries.length : 0);
      } catch (e) {
        setJournalCount(0);
      }
      setLoading(false);
    };

    const checkStreak = async () => {
      const today = new Date();
      // Convert to local date string to handle timezone differences
      const todayStr = today.toLocaleDateString('en-US', { timeZone: 'UTC' });
      const lastDate = await AsyncStorage.getItem('streak_last_date');
      let currentStreak = parseInt(await AsyncStorage.getItem('streak_count') || '0', 10);

      // If no last date exists, this is the first time using the app
      if (!lastDate) {
        await AsyncStorage.setItem('streak_last_date', todayStr);
        await AsyncStorage.setItem('streak_count', '0');
        setStreak(0);
        return;
      }

      // If we already checked today, just return the current streak
      if (lastDate === todayStr) {
        setStreak(currentStreak);
        return;
      }

      // Calculate the time difference in days
      const lastDateObj = new Date(lastDate);
      const timeDiff = today.getTime() - lastDateObj.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

      // If the last date was yesterday (exactly 1 day ago), increment the streak
      if (daysDiff === 1) {
        currentStreak += 1;
        await AsyncStorage.setItem('streak_last_date', todayStr);
        await AsyncStorage.setItem('streak_count', currentStreak.toString());
        setStreak(currentStreak);
      } else {
        // If the last date was before yesterday, reset the streak
        await AsyncStorage.setItem('streak_last_date', todayStr);
        await AsyncStorage.setItem('streak_count', '0');
        setStreak(0);
      }
    };

    // Check streak on mount and set up an interval to check every minute
    checkStreak();
    const intervalId = setInterval(checkStreak, 60000); // Check every minute

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const getStreakMessage = () => {
    if (streak === 0) return "Start your journey today!";
    if (streak === 1) return "You've just started your journey! Keep going!";
    if (streak < 7) return `You're on a ${streak}-day streak! Keep up the great work!`;
    if (streak < 30) return `Amazing! You've maintained a ${streak}-day streak!`;
    return `Incredible dedication! You've been using MindHaven for ${streak} days!`;
  };

  return (
    <>
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => setShowStreakModal(true)}
        >
          <Ionicons name="calendar" size={24} color="#5100F3" />
          <Text style={styles.statNumber}>{streak}</Text>
          <Text style={styles.statLabel}>Days Streak</Text>
        </TouchableOpacity>
        <View style={styles.statCard}>
          <Ionicons name="journal" size={24} color="#5100F3" />
          <Text style={styles.statNumber}>{loading ? '...' : journalCount}</Text>
          <Text style={styles.statLabel}>Journal Entries</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="fitness" size={24} color="#5100F3" />
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Exercises Done</Text>
        </View>
      </View>

      <Modal
        visible={showStreakModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStreakModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Journey</Text>
              <TouchableOpacity onPress={() => setShowStreakModal(false)}>
                <Ionicons name="close" size={24} color="#6c4ab6" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Ionicons name="calendar" size={48} color="#5100F3" style={styles.modalIcon} />
              <Text style={styles.modalMessage}>{getStreakMessage()}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const RecentActivities = () => (
  <View style={styles.activitiesContainer}>
    <ActivityItem
      icon="journal"
      title="Morning Journal Entry"
      time="2 hours ago"
    />
    <ActivityItem
      icon="fitness"
      title="Completed Breathing Exercise"
      time="Yesterday"
    />
    <ActivityItem
      icon="chatbubble"
      title="Chatbot Session"
      time="2 days ago"
    />
  </View>
);

const ActivityItem = ({ icon, title, time }) => (
  <View style={styles.activityItem}>
    <View style={styles.activityIcon}>
      <Ionicons name={icon} size={20} color="#5100F3" />
    </View>
    <View style={styles.activityContent}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
  </View>
);

const MoodTracker = () => {
  const router = useRouter();
  return (
    <View style={styles.moodTrackerCard}>
      <View style={styles.moodTrackerText}>
        <Text style={styles.moodTrackerTitle}>How are you feeling today?</Text>
        <Text style={styles.moodTrackerSubtitle}>
          Track your mood to understand your emotional patterns
        </Text>
      </View>
      <View style={styles.moodEmojis}>
        <TouchableOpacity style={styles.moodEmoji} onPress={() => router.push('/mood-tracker')}>
          <Text style={styles.emoji}>😊</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moodEmoji} onPress={() => router.push('/mood-tracker')}>
          <Text style={styles.emoji}>😐</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moodEmoji} onPress={() => router.push('/mood-tracker')}>
          <Text style={styles.emoji}>😔</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  logoAndTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c1a4a",
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 20,
  },
  welcomeText: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 0,
    color: "#2c1a4a",
    textAlign: "left",
  },
  subtitle: {
    fontSize: 16,
    color: "#6c4ab6",
    marginBottom: 18,
    textAlign: "left",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingTop: 0,
  },
  moodTrackerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f3ff",
    borderRadius: 18,
    padding: 22,
    marginBottom: 24,
    shadowColor: "#a18aff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  moodTrackerText: {
    flex: 1,
  },
  moodTrackerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c1a4a",
    marginBottom: 2,
  },
  moodTrackerSubtitle: {
    fontSize: 15,
    color: "#6c4ab6",
  },
  moodIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginHorizontal: 10,
    backgroundColor: "#e3e0ff",
    borderWidth: 2,
    borderColor: "#d1c4e9",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0d7f3",
    marginVertical: 18,
    borderRadius: 1,
  },
  servicesTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 14,
    color: "#5100F3",
    textAlign: "left",
  },
  servicesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  serviceBox: {
    backgroundColor: "#e4d8f0",
    borderRadius: 18,
    padding: 24,
    width: "48%",
    marginBottom: 18,
    shadowColor: "#a18aff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
    transition: 'transform 0.1s',
  },
  serviceContent: {
    alignItems: "center",
  },
  serviceIcon: {
    width: 62,
    height: 62,
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2c1a4a",
    textAlign: "center",
  },
  quoteCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#a18aff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quoteText: {
    fontSize: 16,
    color: '#2c1a4a',
    fontStyle: 'italic',
    marginVertical: 10,
    lineHeight: 24,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#6c4ab6',
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    width: '31%',
    alignItems: 'center',
    shadowColor: "#a18aff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5100F3',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c4ab6',
    textAlign: 'center',
  },
  activitiesContainer: {
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#a18aff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c1a4a',
  },
  activityTime: {
    fontSize: 12,
    color: '#6c4ab6',
    marginTop: 2,
  },
  moodEmojis: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  moodEmoji: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#a18aff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emoji: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c1a4a',
    marginBottom: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5100F3',
  },
  modalBody: {
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 20,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    lineHeight: 24,
  },
});

export default Home;

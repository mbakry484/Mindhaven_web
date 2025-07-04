// Home.js
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, ActivityIndicator, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "../../utils/UserContext";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GROQ_API_URL, GROQ_API_KEY, GROQ_MODEL } from '../../utils/config/aiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import quotes from '../../quotes.json';
import quotesArabic from '../../quotes_arabic.json';
import quotesGerman from '../../quotes_german.json';
import '../i18n';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const router = useRouter();
  const { user } = useUser();
  const { t } = useTranslation();

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
          <Text style={styles.welcomeText}>{t('home.welcome', { name: user?.name || t('home.friend') })}</Text>
          <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

          <DailyQuote />

          <QuickStats />

          <ChatAICard />

          <TouchableOpacity onPress={handleMoodTrackerPress}>
            <MoodTracker />
          </TouchableOpacity>

          <View style={styles.divider} />
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

const fetchRandomQuote = (language) => {
  let quoteArray;
  switch (language) {
    case 'ar':
      quoteArray = quotesArabic;
      break;
    case 'de':
      quoteArray = quotesGerman;
      break;
    default:
      quoteArray = quotes; // English quotes for 'en' and fallback
  }
  const randomIndex = Math.floor(Math.random() * quoteArray.length);
  return quoteArray[randomIndex];
};

const DailyQuote = () => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const { i18n, t } = useTranslation();

  const getQuote = () => {
    setLoading(true);
    try {
      const data = fetchRandomQuote(i18n.language);
      setQuote(data);
    } catch (e) {
      setQuote({ quote: "Could not fetch quote.", author: "Unknown" });
    }
    setLoading(false);
  };

  useEffect(() => {
    getQuote();
  }, [i18n.language]);

  return (
    <View style={styles.quoteCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#6c4ab6', fontSize: 16 }}>{t('home.wellness_quote')}</Text>
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
  const [moodCount, setMoodCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchJournalCount = async () => {
      try {
        const userId = await AsyncStorage.getItem('user_id');
        const response = await fetch(`http://108.181.218.68:8000/api/get_user_journal_entries/${userId}/`);
        const data = await response.json();
        const entries = data.journal_entries || [];
        setJournalCount(Array.isArray(entries) ? entries.length : 0);
      } catch (e) {
        console.error('Error fetching journal count:', e);
        setJournalCount(0);
      }
    };

    const fetchMoodCount = async () => {
      try {
        const userId = await AsyncStorage.getItem('user_id');
        const response = await fetch(`http://108.181.218.68:8000/api/get_user_mood_logs/${userId}/`);
        const data = await response.json();
        const entries = data.mood_logs || [];
        setMoodCount(Array.isArray(entries) ? entries.length : 0);
      } catch (e) {
        console.error('Error fetching mood count:', e);
        setMoodCount(0);
      }
      setLoading(false);
    };

    const checkStreak = async () => {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        setStreak(0);
        return;
      }
      const lastDateKey = `streak_last_date_${userId}`;
      const countKey = `streak_count_${userId}`;
      const today = new Date();
      // Get the start of today in local timezone
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayStr = startOfToday.toLocaleDateString('en-US');
      const lastDate = await AsyncStorage.getItem(lastDateKey);
      let currentStreak = parseInt(await AsyncStorage.getItem(countKey) || '0', 10);

      console.log('\n=== Streak Check Log ===');
      console.log('Current time:', today.toISOString());
      console.log('Today string:', todayStr);
      console.log('Last recorded date:', lastDate);
      console.log('Current streak from storage:', currentStreak);

      // If no last date exists, this is the first time using the app for this user
      if (!lastDate) {
        console.log('No last date found - First time using app for this user');
        await AsyncStorage.setItem(lastDateKey, todayStr);
        await AsyncStorage.setItem(countKey, '0');
        setStreak(0);
        return;
      }

      // If we already checked today, just return the current streak
      if (lastDate === todayStr) {
        console.log('Already checked today - Keeping streak at:', currentStreak);
        setStreak(currentStreak);
        return;
      }

      // Parse the last date string
      const [month, day, year] = lastDate.split('/');
      const lastDateObj = new Date(year, month - 1, day);

      // Calculate the time difference in days
      const timeDiff = startOfToday.getTime() - lastDateObj.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

      console.log('Last date object:', lastDateObj.toISOString());
      console.log('Time difference in milliseconds:', timeDiff);
      console.log('Days difference:', daysDiff);

      // If the last date was yesterday (exactly 1 day ago), increment the streak
      if (daysDiff === 1) {
        console.log('Last login was yesterday - Incrementing streak');
        currentStreak += 1;
        await AsyncStorage.setItem(lastDateKey, todayStr);
        await AsyncStorage.setItem(countKey, currentStreak.toString());
        setStreak(currentStreak);
      } else {
        console.log('Last login was not yesterday - Resetting streak');
        await AsyncStorage.setItem(lastDateKey, todayStr);
        await AsyncStorage.setItem(countKey, '0');
        setStreak(0);
      }
      console.log('=== End Streak Check ===\n');
    };

    fetchJournalCount();
    fetchMoodCount();
    checkStreak();
  }, []);

  const getStreakMessage = () => {
    if (streak === 0) return t('home.start_your_journey');
    if (streak === 1) return t('home.just_started');
    if (streak < 7) return t('home.streak_keep_up', { streak });
    if (streak < 30) return t('home.amazing_streak', { streak });
    return t('home.incredible_dedication', { streak });
  };

  const getJournalMessage = () => {
    if (journalCount === 0) return t('home.start_journaling');
    if (journalCount === 1) return t('home.first_journal');
    if (journalCount < 5) return t('home.journal_entries_count', { count: journalCount });
    if (journalCount < 10) return t('home.great_progress_journal', { count: journalCount });
    return t('home.amazing_dedication_journal', { count: journalCount });
  };

  const getMoodMessage = () => {
    if (moodCount === 0) return t('home.start_tracking_moods');
    if (moodCount === 1) return t('home.first_mood');
    if (moodCount < 5) return t('home.moods_logged', { count: moodCount });
    if (moodCount < 10) return t('home.great_progress_mood', { count: moodCount });
    return t('home.amazing_dedication_mood', { count: moodCount });
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
          <Text style={styles.statLabel}>{t('home.days_streak')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => setShowJournalModal(true)}
        >
          <Ionicons name="journal" size={24} color="#5100F3" />
          <Text style={styles.statNumber}>{loading ? '...' : journalCount}</Text>
          <Text style={styles.statLabel}>{t('home.journal_entries')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => setShowMoodModal(true)}
        >
          <Ionicons name="happy" size={24} color="#5100F3" />
          <Text style={styles.statNumber}>{loading ? '...' : moodCount}</Text>
          <Text style={styles.statLabel}>{t('home.mood_entries')}</Text>
        </TouchableOpacity>
      </View>

      {/* Streak Modal */}
      <Modal
        visible={showStreakModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStreakModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('home.your_journey')}</Text>
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

      {/* Journal Modal */}
      <Modal
        visible={showJournalModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowJournalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('home.your_journal')}</Text>
              <TouchableOpacity onPress={() => setShowJournalModal(false)}>
                <Ionicons name="close" size={24} color="#6c4ab6" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Ionicons name="journal" size={48} color="#5100F3" style={styles.modalIcon} />
              <Text style={styles.modalMessage}>{getJournalMessage()}</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowJournalModal(false);
                  router.push("/journaling");
                }}
              >
                <Text style={styles.modalButtonText}>{t('home.go_to_journal')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Mood Modal */}
      <Modal
        visible={showMoodModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMoodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('home.your_moods')}</Text>
              <TouchableOpacity onPress={() => setShowMoodModal(false)}>
                <Ionicons name="close" size={24} color="#6c4ab6" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Ionicons name="happy" size={48} color="#5100F3" style={styles.modalIcon} />
              <Text style={styles.modalMessage}>{getMoodMessage()}</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowMoodModal(false);
                  router.push("/mood-tracker");
                }}
              >
                <Text style={styles.modalButtonText}>{t('home.track_your_mood')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const MoodTracker = () => {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <View style={styles.moodTrackerCard}>
      <View style={styles.moodTrackerText}>
        <Text style={styles.moodTrackerTitle}>{t('home.how_are_you_feeling')}</Text>
        <Text style={styles.moodTrackerSubtitle}>
          {t('home.track_mood_subtitle')}
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

const ChatAICard = () => {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <View style={styles.moodTrackerCard}>
      <View style={styles.moodTrackerText}>
        <Text style={styles.moodTrackerTitle}>{t('home.need_to_talk')}</Text>
        <Text style={styles.moodTrackerSubtitle}>
          {t('home.chat_privately')}
        </Text>
      </View>
      <TouchableOpacity style={styles.moodEmoji} onPress={() => router.push('/chatbot')}>
        <Ionicons name="chatbubbles" size={32} color="#5100F3" />
      </TouchableOpacity>
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
  modalButton: {
    backgroundColor: '#5100F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 20,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Home;

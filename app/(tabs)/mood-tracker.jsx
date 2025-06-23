import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
    Image,
    TextInput,
    KeyboardAvoidingView,
    Alert
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

// Mock data for previous mood entries
const previousMoodData = [
    {
        id: 1,
        date: "Jun 10, 2023",
        mood: "Happy",
        intensity: 8,
        note: "Had a great day at the park with friends."
    },
    {
        id: 2,
        date: "Jun 8, 2023",
        mood: "Stressed",
        intensity: 7,
        note: "Deadline approaching for work project."
    },
    {
        id: 3,
        date: "Jun 5, 2023",
        mood: "Calm",
        intensity: 5,
        note: "Meditation session helped me relax."
    }
];

// Mood options
const moodOptions = [
    { emoji: "😊", label: "happy" },
    { emoji: "😌", label: "calm" },
    { emoji: "😐", label: "neutral" },
    { emoji: "😢", label: "sad" },
    { emoji: "😠", label: "angry" },
    { emoji: "😰", label: "anxious" },
    { emoji: "😩", label: "stressed" },
    { emoji: "😴", label: "tired" }
];

const MOOD_API_URL = "http://127.0.0.1:8000/api/add_mood_log/";
const MOOD_HISTORY_API_URL = "http://127.0.0.1:8000/api/get_user_mood_logs/";

const MoodTrackerScreen = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const [selectedMood, setSelectedMood] = useState(null);
    const [intensity, setIntensity] = useState(5);
    const [note, setNote] = useState("");
    const [moodEntries, setMoodEntries] = useState([]);
    const [activeTab, setActiveTab] = useState("new"); // "new" or "history"
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (activeTab === "history") {
            fetchMoodHistory();
        }
    }, [activeTab]);

    const fetchMoodHistory = async () => {
        try {
            const userId = await AsyncStorage.getItem('user_id');
            if (!userId) {
                Alert.alert('Error', t('mood.user_not_logged_in'));
                router.push("/login");
                return;
            }

            setIsLoading(true);
            const response = await fetch(`${MOOD_HISTORY_API_URL}${userId}/`);
            const data = await response.json();

            if (response.ok && data.mood_logs) {
                setMoodEntries(data.mood_logs.map(entry => ({
                    id: entry._id,
                    date: new Date(entry.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                    }),
                    mood: entry.mood,
                    moodKey: entry.mood.toLowerCase(),
                    intensity: entry.score,
                    note: entry.notes
                })));
            } else {
                Alert.alert('Error', data.error || t('mood.failed_fetch_history'));
            }
        } catch (err) {
            console.error("Error fetching mood history:", err);
            Alert.alert('Error', t('mood.failed_fetch_history'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoBack = () => {
        router.push("/home");
    };

    const handleMoodSelect = (mood) => {
        setSelectedMood(mood);
    };

    const handleIntensityChange = (value) => {
        setIntensity(value);
    };

    const handleSaveMood = async () => {
        if (!selectedMood) {
            Alert.alert("Missing Information", t('mood.missing_mood'));
            return;
        }

        try {
            const userId = await AsyncStorage.getItem('user_id');
            if (!userId) {
                Alert.alert('Error', t('mood.user_not_logged_in'));
                router.push("/login");
                return;
            }

            const payload = {
                user_id: userId,
                date: new Date().toISOString(),
                mood: selectedMood.label,
                score: intensity,
                notes: note,
            };

            const response = await fetch(MOOD_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (response.ok) {
                Alert.alert('Success', t('mood.mood_saved'));
                setSelectedMood(null);
                setIntensity(5);
                setNote("");

                // Refresh mood history if we're on the history tab
                if (activeTab === "history") {
                    fetchMoodHistory();
                }
            } else {
                Alert.alert('Error', data.error || t('mood.failed_save_mood'));
            }
        } catch (err) {
            console.error("Error saving mood:", err);
            Alert.alert('Error', t('mood.failed_save_mood'));
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={handleGoBack}
                    style={styles.backButton}
                    accessibilityLabel="Go back"
                    accessibilityRole="button"
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>{t('mood.mood_tracker')}</Text>

                <View style={{ width: 40 }} />
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "new" && styles.activeTab]}
                    onPress={() => setActiveTab("new")}
                >
                    <Text style={[styles.tabText, activeTab === "new" && styles.activeTabText]}>
                        {t('mood.new_entry')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === "history" && styles.activeTab]}
                    onPress={() => setActiveTab("history")}
                >
                    <Text style={[styles.tabText, activeTab === "history" && styles.activeTabText]}>
                        {t('mood.history')}
                    </Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.scrollView}>
                    {activeTab === "new" ? (
                        // New Entry Form
                        <View style={styles.newEntryContainer}>
                            <Text style={styles.sectionTitle}>{t('mood.how_are_you_feeling')}</Text>

                            <View style={styles.moodOptionsContainer}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {moodOptions.map((mood) => (
                                        <TouchableOpacity
                                            key={mood.label}
                                            style={[
                                                styles.moodOption,
                                                selectedMood?.label === mood.label && styles.selectedMoodOption
                                            ]}
                                            onPress={() => handleMoodSelect(mood)}
                                        >
                                            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                                            <Text style={styles.moodLabel}>{t(`mood.mood_labels.${mood.label}`)}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <Text style={styles.sectionTitle}>{t('mood.how_intense_mood')}</Text>
                            <View style={styles.sliderContainer}>
                                <View style={styles.sliderValueContainer}>
                                    <Text style={styles.sliderLabel}>{t('mood.mild')}</Text>
                                    <Text style={styles.intensityValue}>{intensity}</Text>
                                    <Text style={styles.sliderLabel}>{t('mood.intense')}</Text>
                                </View>
                                <View style={styles.sliderTrack}>
                                    <View style={[styles.sliderFill, { width: `${(intensity / 10) * 100}%` }]} />
                                </View>
                                <View style={styles.sliderMarkers}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((mark) => (
                                        <TouchableOpacity
                                            key={mark}
                                            style={[
                                                styles.sliderMarker,
                                                intensity >= mark && styles.activeSliderMarker
                                            ]}
                                            onPress={() => setIntensity(mark)}
                                        />
                                    ))}
                                </View>
                            </View>

                            <Text style={styles.sectionTitle}>{t('mood.add_note_optional')}</Text>
                            <TextInput
                                style={styles.noteInput}
                                placeholder={t('mood.note_placeholder')}
                                value={note}
                                onChangeText={setNote}
                                multiline
                                numberOfLines={4}
                            />

                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveMood}>
                                <Text style={styles.saveButtonText}>{t('mood.save_mood')}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        // History View
                        <View style={styles.historyContainer}>
                            <Text style={styles.historyTitle}>{t('mood.mood_history')}</Text>
                            {isLoading ? (
                                <View style={styles.loadingContainer}>
                                    <Text style={styles.loadingText}>{t('mood.loading_history')}</Text>
                                </View>
                            ) : moodEntries.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>{t('mood.no_mood_entries')}</Text>
                                    <Text style={styles.emptySubText}>{t('mood.start_tracking_message')}</Text>
                                </View>
                            ) : (
                                moodEntries.map((entry) => (
                                    <View key={entry.id} style={styles.historyCard}>
                                        <View style={styles.historyCardHeader}>
                                            <Text style={styles.historyDate}>{entry.date}</Text>
                                            <View style={styles.moodBadge}>
                                                <Text style={styles.moodBadgeText}>
                                                    {t(`mood.mood_labels.${entry.moodKey || entry.mood.toLowerCase()}`)}
                                                </Text>
                                                <Text style={styles.intensityBadge}>
                                                    {entry.intensity}/10
                                                </Text>
                                            </View>
                                        </View>
                                        {entry.note ? (
                                            <Text style={styles.historyNote}>{entry.note}</Text>
                                        ) : (
                                            <Text style={styles.noNote}>{t('mood.no_notes_added')}</Text>
                                        )}
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
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
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "white",
        marginHorizontal: 20,
        marginTop: -10,
        borderRadius: 16,
        padding: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: "center",
        borderRadius: 12,
        marginHorizontal: 2,
    },
    activeTab: {
        backgroundColor: "#5100F3",
        shadowColor: "#5100F3",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    tabText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#64748b",
    },
    activeTabText: {
        color: "white",
        fontWeight: "700",
    },
    scrollView: {
        flex: 1,
    },
    newEntryContainer: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 16,
        marginTop: 16,
    },
    moodOptionsContainer: {
        marginBottom: 24,
    },
    moodOption: {
        backgroundColor: "#f2f2f2",
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#f2f2f2",
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginRight: 12,
        alignItems: "center",
        justifyContent: "center",
        minWidth: 80,
    },
    selectedMoodOption: {
        backgroundColor: "rgba(81, 0, 243, 0.1)",
        borderColor: "#5100F3",
    },
    moodEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    moodLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: "#333",
    },
    sliderContainer: {
        marginBottom: 24,
    },
    sliderValueContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    sliderLabel: {
        fontSize: 14,
        color: "#64748b",
    },
    intensityValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#5100F3",
    },
    sliderTrack: {
        height: 10,
        backgroundColor: "#e2e8f0",
        borderRadius: 5,
        marginBottom: 8,
    },
    sliderFill: {
        height: 10,
        backgroundColor: "#5100F3",
        borderRadius: 5,
    },
    sliderMarkers: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    sliderMarker: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#e2e8f0",
        borderWidth: 1,
        borderColor: "#cbd5e1",
    },
    activeSliderMarker: {
        backgroundColor: "#5100F3",
        borderColor: "#5100F3",
    },
    noteInput: {
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        minHeight: 120,
        textAlignVertical: "top",
        marginBottom: 24,
    },
    saveButton: {
        backgroundColor: "#5100F3",
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: "center",
        shadowColor: "#5100F3",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 30,
    },
    saveButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    historyContainer: {
        padding: 20,
    },
    historyTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1e293b",
        marginBottom: 16,
    },
    historyCard: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    historyCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    historyDate: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
    },
    moodBadge: {
        flexDirection: "row",
        alignItems: "center",
    },
    moodBadgeText: {
        fontSize: 14,
        color: "#5100F3",
        fontWeight: "600",
        marginRight: 8,
    },
    intensityBadge: {
        backgroundColor: "#e0e7ff",
        color: "#5100F3",
        fontSize: 12,
        fontWeight: "500",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    historyNote: {
        fontSize: 14,
        color: "#4b5563",
        lineHeight: 20,
    },
    noNote: {
        fontSize: 14,
        color: "#94a3b8",
        fontStyle: "italic",
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
    },
});

export default MoodTrackerScreen; 
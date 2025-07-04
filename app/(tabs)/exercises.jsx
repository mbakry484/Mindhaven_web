import React, { useState, useMemo, useEffect } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
    Modal,
    TextInput,
    Button,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");

const EXERCISE_API_URL = "http://108.181.218.68:8000/api/get_user_exercises/";

const DEFAULT_TYPE_COLOR = "#e0e7ff";
const DEFAULT_TYPE_IMAGE = require("../../assets/images/brain.png");

// Default description for user-added types
const DEFAULT_TYPE_DESCRIPTION = "";

// Flat array of all static exercises, each with a type
const staticExercises = [
    { id: 101, title: "Box Breathing", duration: "5 minutes", description: "Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat.", type: "Breathing Exercises", image: require("../../assets/images/brain.png"), color: "#e0e7ff" },
    { id: 102, title: "4-7-8 Breathing", duration: "5 minutes", description: "Inhale for 4 counts, hold for 7, exhale for 8. Repeat to reduce anxiety.", type: "Breathing Exercises", image: require("../../assets/images/brain.png"), color: "#e0e7ff" },
    { id: 103, title: "Diaphragmatic Breathing", duration: "10 minutes", description: "Deep belly breathing to activate the parasympathetic nervous system.", type: "Breathing Exercises", image: require("../../assets/images/brain.png"), color: "#e0e7ff" },
    { id: 201, title: "Body Scan Meditation", duration: "15 minutes", description: "Progressive relaxation by focusing attention throughout the body.", type: "Meditation", image: require("../../assets/images/heart-outline.jpg"), color: "#fae8ff" },
    { id: 202, title: "Loving-Kindness Meditation", duration: "10 minutes", description: "Develop feelings of goodwill, kindness and warmth towards others.", type: "Meditation", image: require("../../assets/images/heart-outline.jpg"), color: "#fae8ff" },
    { id: 203, title: "Mindfulness Meditation", duration: "10 minutes", description: "Focus on the present moment, observing thoughts without judgment.", type: "Meditation", image: require("../../assets/images/heart-outline.jpg"), color: "#fae8ff" },
    { id: 301, title: "5-4-3-2-1 Technique", duration: "5 minutes", description: "Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, and 1 you taste.", type: "Grounding Techniques", image: require("../../assets/images/Icon trophy.png"), color: "#dcfce7" },
    { id: 302, title: "Progressive Muscle Relaxation", duration: "15 minutes", description: "Tense and then release each muscle group from toes to head.", type: "Grounding Techniques", image: require("../../assets/images/Icon trophy.png"), color: "#dcfce7" },
    { id: 303, title: "Cold Water Technique", duration: "2 minutes", description: "Splash cold water on your face to activate the parasympathetic nervous system.", type: "Grounding Techniques", image: require("../../assets/images/Icon trophy.png"), color: "#dcfce7" },
    { id: 401, title: "Thought Record", duration: "15 minutes", description: "Identify and challenge negative thoughts with evidence.", type: "Cognitive Exercises", image: require("../../assets/images/Icon gear.png"), color: "#ffedd5" },
    { id: 402, title: "Positive Affirmations", duration: "5 minutes", description: "Practice repeating positive statements to build self-confidence.", type: "Cognitive Exercises", image: require("../../assets/images/Icon gear.png"), color: "#ffedd5" },
    { id: 403, title: "Gratitude Journaling", duration: "10 minutes", description: "Write down things you're grateful for to shift focus to the positive.", type: "Cognitive Exercises", image: require("../../assets/images/Icon gear.png"), color: "#ffedd5" },
];

const ExerciseScreen = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const [exercises, setExercises] = useState([]);
    const [selectedType, setSelectedType] = useState(null);

    // Create static exercises with translation keys
    const staticExercises = [
        {
            id: 101,
            titleKey: "exercises.exercises.box_breathing.title",
            descriptionKey: "exercises.exercises.box_breathing.description",
            duration: "5 minutes",
            type: "Breathing Exercises",
            image: require("../../assets/images/brain.png"),
            color: "#e0e7ff"
        },
        {
            id: 102,
            titleKey: "exercises.exercises.478_breathing.title",
            descriptionKey: "exercises.exercises.478_breathing.description",
            duration: "5 minutes",
            type: "Breathing Exercises",
            image: require("../../assets/images/brain.png"),
            color: "#e0e7ff"
        },
        {
            id: 103,
            titleKey: "exercises.exercises.diaphragmatic_breathing.title",
            descriptionKey: "exercises.exercises.diaphragmatic_breathing.description",
            duration: "10 minutes",
            type: "Breathing Exercises",
            image: require("../../assets/images/brain.png"),
            color: "#e0e7ff"
        },
        {
            id: 201,
            titleKey: "exercises.exercises.body_scan_meditation.title",
            descriptionKey: "exercises.exercises.body_scan_meditation.description",
            duration: "15 minutes",
            type: "Meditation",
            image: require("../../assets/images/heart-outline.jpg"),
            color: "#fae8ff"
        },
        {
            id: 202,
            titleKey: "exercises.exercises.loving_kindness_meditation.title",
            descriptionKey: "exercises.exercises.loving_kindness_meditation.description",
            duration: "10 minutes",
            type: "Meditation",
            image: require("../../assets/images/heart-outline.jpg"),
            color: "#fae8ff"
        },
        {
            id: 203,
            titleKey: "exercises.exercises.mindfulness_meditation.title",
            descriptionKey: "exercises.exercises.mindfulness_meditation.description",
            duration: "10 minutes",
            type: "Meditation",
            image: require("../../assets/images/heart-outline.jpg"),
            color: "#fae8ff"
        },
        {
            id: 301,
            titleKey: "exercises.exercises.54321_technique.title",
            descriptionKey: "exercises.exercises.54321_technique.description",
            duration: "5 minutes",
            type: "Grounding Techniques",
            image: require("../../assets/images/Icon trophy.png"),
            color: "#dcfce7"
        },
        {
            id: 302,
            titleKey: "exercises.exercises.progressive_muscle_relaxation.title",
            descriptionKey: "exercises.exercises.progressive_muscle_relaxation.description",
            duration: "15 minutes",
            type: "Grounding Techniques",
            image: require("../../assets/images/Icon trophy.png"),
            color: "#dcfce7"
        },
        {
            id: 303,
            titleKey: "exercises.exercises.cold_water_technique.title",
            descriptionKey: "exercises.exercises.cold_water_technique.description",
            duration: "2 minutes",
            type: "Grounding Techniques",
            image: require("../../assets/images/Icon trophy.png"),
            color: "#dcfce7"
        },
        {
            id: 401,
            titleKey: "exercises.exercises.thought_record.title",
            descriptionKey: "exercises.exercises.thought_record.description",
            duration: "15 minutes",
            type: "Cognitive Exercises",
            image: require("../../assets/images/Icon gear.png"),
            color: "#ffedd5"
        },
        {
            id: 402,
            titleKey: "exercises.exercises.positive_affirmations.title",
            descriptionKey: "exercises.exercises.positive_affirmations.description",
            duration: "5 minutes",
            type: "Cognitive Exercises",
            image: require("../../assets/images/Icon gear.png"),
            color: "#ffedd5"
        },
        {
            id: 403,
            titleKey: "exercises.exercises.gratitude_journaling.title",
            descriptionKey: "exercises.exercises.gratitude_journaling.description",
            duration: "10 minutes",
            type: "Cognitive Exercises",
            image: require("../../assets/images/Icon gear.png"),
            color: "#ffedd5"
        },
    ];

    // Fetch user exercises from backend and merge with static exercises
    useEffect(() => {
        const fetchUserExercises = async () => {
            try {
                const userId = await AsyncStorage.getItem('user_id');
                if (!userId) {
                    setExercises(staticExercises);
                    return;
                }
                const res = await fetch(`${EXERCISE_API_URL}${userId}/`);
                if (!res.ok) {
                    setExercises(staticExercises);
                    return;
                }
                const data = await res.json();
                if (Array.isArray(data.exercises)) {
                    // Map backend exercises to match static format
                    const userExercises = data.exercises.map(ex => ({
                        id: ex._id || Math.random().toString(36).slice(2),
                        title: ex.name, // Use direct title for user exercises
                        duration: ex.duration ? `${ex.duration} minutes` : "",
                        description: ex.description || "",
                        type: ex.type || "activity",
                        image: require("../../assets/images/brain.png"), // fallback image
                        color: "#e0e7ff", // fallback color
                        user_id: ex.user_id,
                    }));
                    // Merge, avoiding duplicates by title+type+user_id
                    const merged = [...staticExercises];
                    userExercises.forEach(ux => {
                        if (!merged.some(se => se.title === ux.title && se.type === ux.type && (se.user_id === ux.user_id || !ux.user_id))) {
                            merged.push(ux);
                        }
                    });
                    setExercises(merged);
                } else {
                    setExercises(staticExercises);
                }
            } catch (err) {
                console.error("Failed to fetch user exercises:", err);
                setExercises(staticExercises);
            }
        };
        fetchUserExercises();
    }, []);

    // Group exercises by type
    const groupedByType = useMemo(() => {
        const groups = {};
        exercises.forEach(ex => {
            if (!groups[ex.type]) groups[ex.type] = [];
            groups[ex.type].push(ex);
        });
        return groups;
    }, [exercises]);

    // Get type meta (image/color) from the first exercise of that type, or use defaults
    const getTypeMeta = (type) => {
        const ex = groupedByType[type]?.[0];
        return {
            image: ex?.image || DEFAULT_TYPE_IMAGE,
            color: ex?.color || DEFAULT_TYPE_COLOR
        };
    };

    // Get translated type name
    const getTranslatedTypeName = (type) => {
        if (type === "activity") {
            return t("exercises.my_exercises");
        }
        const typeKey = type.toLowerCase().replace(/\s+/g, '_');
        return t(`exercises.exercise_types.${typeKey}`, type);
    };

    // Get translated exercise title and description
    const getTranslatedExercise = (exercise) => {
        if (exercise.titleKey) {
            // Static exercise with translation keys
            return {
                title: t(exercise.titleKey),
                description: t(exercise.descriptionKey)
            };
        } else {
            // User exercise with direct title/description
            return {
                title: exercise.title,
                description: exercise.description
            };
        }
    };

    const handleGoBack = () => {
        if (selectedType) {
            setSelectedType(null);
        } else {
            router.push("/home");
        }
    };

    const handleExerciseTypeSelect = (type) => {
        setSelectedType(type);
    };

    const handleExerciseSelect = (exercise) => {
        // In a real app, this would navigate to the exercise details
        // For now, we'll just show an alert
        console.log(`Selected exercise: ${exercise.title || t(exercise.titleKey)}`);
        // router.push(`/exercise-detail/${exercise.id}`);
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

                <Text style={styles.headerTitle}>
                    {selectedType ? getTranslatedTypeName(selectedType) : t("exercises.mental_health_exercises")}
                </Text>

                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {selectedType ? (
                    // Show exercises for the selected type
                    <>
                        <View style={[styles.typeBanner, { backgroundColor: getTypeMeta(selectedType).color }]}>
                            <Image source={getTypeMeta(selectedType).image} style={styles.bannerImage} />
                            <Text style={styles.bannerTitle}>{getTranslatedTypeName(selectedType)}</Text>
                            {groupedByType[selectedType]?.[0]?.description ? (
                                <Text style={styles.bannerDescription}>
                                    {groupedByType[selectedType][0].description}
                                </Text>
                            ) : null}
                        </View>
                        <Text style={styles.sectionTitle}>{t("exercises.available_exercises")}</Text>
                        {groupedByType[selectedType]?.map((exercise) => {
                            const translatedExercise = getTranslatedExercise(exercise);
                            return (
                                <TouchableOpacity
                                    key={exercise.id}
                                    style={styles.exerciseItem}
                                    onPress={() => handleExerciseSelect(exercise)}
                                >
                                    <View style={styles.exerciseContent}>
                                        <View style={styles.exerciseHeader}>
                                            <Text style={styles.exerciseTitle}>{translatedExercise.title}</Text>
                                            <Text style={styles.exerciseDuration}>{exercise.duration}</Text>
                                        </View>
                                        <Text style={styles.exerciseDescription}>{translatedExercise.description}</Text>
                                        <View style={styles.startButtonContainer}>
                                            <TouchableOpacity
                                                style={styles.startButton}
                                                onPress={() => handleExerciseSelect(exercise)}
                                            >
                                                <Text style={styles.startButtonText}>{t("exercises.start")}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </>
                ) : (
                    // Show exercise categories dynamically
                    <>
                        <Text style={styles.welcomeText}>
                            {t("exercises.welcome_message")}
                        </Text>
                        {Object.keys(groupedByType).map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.exerciseTypeCard, { backgroundColor: getTypeMeta(type).color }]}
                                onPress={() => handleExerciseTypeSelect(type)}
                            >
                                <Image source={getTypeMeta(type).image} style={styles.exerciseTypeImage} />
                                <View style={styles.exerciseTypeContent}>
                                    <Text style={styles.exerciseTypeTitle}>{getTranslatedTypeName(type)}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </>
                )}
            </ScrollView>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 24,
    },
    welcomeText: {
        fontSize: 18,
        color: "#64748b",
        marginBottom: 24,
        textAlign: "center",
        lineHeight: 26,
        fontWeight: "500",
        letterSpacing: 0.3,
    },
    exerciseTypeCard: {
        flexDirection: "row",
        borderRadius: 16,
        marginBottom: 16,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: "rgba(81, 0, 243, 0.05)",
    },
    exerciseTypeImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginRight: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    exerciseTypeContent: {
        flex: 1,
    },
    exerciseTypeTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    typeBanner: {
        borderRadius: 20,
        marginBottom: 24,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: "rgba(81, 0, 243, 0.1)",
    },
    bannerImage: {
        width: 88,
        height: 88,
        borderRadius: 44,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    bannerTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    bannerDescription: {
        fontSize: 16,
        color: "#475569",
        marginBottom: 16,
        lineHeight: 22,
        textAlign: "center",
        fontWeight: "400",
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 20,
        letterSpacing: 0.3,
    },
    exerciseItem: {
        backgroundColor: "white",
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: "rgba(81, 0, 243, 0.05)",
    },
    exerciseContent: {
        padding: 20,
    },
    exerciseHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    exerciseTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1e293b",
        letterSpacing: 0.3,
        flex: 1,
    },
    exerciseDuration: {
        fontSize: 15,
        color: "#5100F3",
        fontWeight: "600",
        backgroundColor: "rgba(81, 0, 243, 0.1)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    exerciseDescription: {
        fontSize: 16,
        color: "#475569",
        marginBottom: 20,
        lineHeight: 24,
        fontWeight: "400",
    },
    startButtonContainer: {
        alignItems: "flex-end",
    },
    startButton: {
        backgroundColor: "#5100F3",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: "#5100F3",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    startButtonText: {
        color: "white",
        fontWeight: "700",
        fontSize: 16,
        letterSpacing: 0.5,
    },
});

export default ExerciseScreen; 
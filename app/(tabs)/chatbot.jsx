import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GROQ_API_URL, GROQ_API_KEY, GROQ_MODEL } from "../../utils/config/aiConfig";
import { VOICE_AI_CONFIG } from "../../utils/config/VoiceAiConfig";
import { AI_INSTRUCTIONS } from "../../utils/config/aiConfig.example";
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from "../../utils/UserContext";
import '../i18n';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get("window");

const CHAT_LOG_API_URL = "http://108.181.218.68:8000/api/add_chat_log/";
const GET_CHAT_LOGS_API_URL = "http://108.181.218.68:8000/api/get_user_chat_logs/";
const MOOD_LOG_API_URL = "http://108.181.218.68:8000/api/add_mood_log/";
const ACTIVITY_LOG_API_URL = "http://108.181.218.68:8000/api/add_activity_log/";
const EXERCISE_API_URL = "http://108.181.218.68:8000/api/add_exercise/";

const DEFAULT_AVATAR = require("../../assets/images/no-profile.png");
const ROBOT_AVATAR = require("../../assets/images/robot.png");

// REMOVE all hardcoded mood/activity lists and detection logic
// (positiveKeywords, negativeKeywords, activityVerbs, knownActivities, detectActivity)

// Only use LLM-based extraction for mood and activity
const predictMoodScore = async (userMessage, mood) => {
  // Use the LLM to predict the score
  try {
    const prompt = `Given the following user message and detected mood, predict the intensity of the mood on a scale from 1 (very mild) to 10 (very intense). Only return the number.\n\nUser message: "${userMessage}"\nDetected mood: ${mood}`;
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are an expert at rating mood intensity on a scale from 1 to 10. Only return the number." },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 4,
        top_p: 1
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    const scoreText = data.choices[0].message.content.trim();
    const score = parseInt(scoreText.match(/\d+/)?.[0], 10);
    if (isNaN(score) || score < 1 || score > 10) return null;
    return score;
  } catch (err) {
    console.error("Failed to predict mood score:", err);
    return null;
  }
};

const saveMoodLog = async (userId, mood, note, score) => {
  if (!score) return;
  await fetch(MOOD_LOG_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      date: new Date().toISOString(),
      mood,
      notes: note,
      score,
    }),
  });
};

const saveExercise = async (userId, activity) => {
  try {
    await fetch(EXERCISE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        name: activity,
        type: "activity", // or you can try to infer type
        duration: 0,
        completed: false
      })
    });
  } catch (err) {
    console.error("Failed to save exercise:", err);
  }
};

const saveChatLog = async (userId, message, sender) => {
  try {
    await fetch(CHAT_LOG_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, message, sender })
    });
  } catch (err) {
    console.error("Failed to save chat log:", err);
  }
};

// New: Extract mood and activity using LLM (language-agnostic)
const extractMoodAndActivity = async (userMessage) => {
  try {
    const prompt = `Extract the user's mood (if any) and any activity (sport/exercise) mentioned in the following message, regardless of language. Return a JSON object like: {"mood": "...", "activity": "...", "activitySentiment": "positive/negative/neutral"}. The activity value must be exactly as written by the user, not translated. If nothing is found, use null for the value.\n\nRules:\n- If the message describes an action or something the user is doing (e.g., \"I love playing football\"), extract it as an activity, not a mood.\n- If the message describes a feeling or emotional state (e.g., \"I feel happy\"), extract it as a mood, not an activity.\n- If both are present, extract both separately.\n- Never duplicate the same phrase in both mood and activity.\n\nMessage: "${userMessage}"`;
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are an expert at extracting mood and activity from user messages in any language. Only return a valid JSON object as specified. The activity value must be exactly as written by the user, not translated." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 128,
        top_p: 1
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    // Robustly extract the first JSON object from the response
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Failed to parse extracted JSON:', jsonMatch[0]);
        return null;
      }
    } else {
      console.error('No JSON object found in LLM response:', content);
      return null;
    }
  } catch (err) {
    console.error('Failed to extract mood/activity:', err);
    return null;
  }
};

// Check if activity exists in the activity table (any language)
const activityExists = async (activityName) => {
  try {
    // You need to implement this endpoint in your backend to search activities by name (case-insensitive, any language)
    const response = await fetch(`${EXERCISE_API_URL}exists/?name=${encodeURIComponent(activityName)}`);
    if (!response.ok) return false;
    const data = await response.json();
    // Should return { exists: true/false }
    return !!data.exists;
  } catch (err) {
    console.error('Failed to check if activity exists:', err);
    return false;
  }
};

const ChatbotScreen = () => {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const scrollViewRef = useRef();
  const { user } = useUser();
  const { t } = useTranslation();

  // Fetch chat history on mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const userId = await AsyncStorage.getItem('user_id');
        if (!userId) return;
        const response = await fetch(`${GET_CHAT_LOGS_API_URL}${userId}/`);
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data.chat_logs)) {
          // Map logs to message format used in state
          const historyMessages = data.chat_logs.map(log => ({
            text: log.message,
            sender: log.sender,
            timestamp: log.created_at ? new Date(log.created_at) : new Date()
          }));
          setMessages(historyMessages);
        }
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
      }
    };
    fetchChatHistory();
  }, []);

  const handleGoBack = () => {
    router.push("/home");
  };

  const handleSendMessage = async () => {
    if (inputText.trim() === "") return;

    const userMessage = { text: inputText, sender: "user", timestamp: new Date() };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (userId) {
        saveChatLog(userId, inputText, "user");

        // Only use LLM extraction for mood and activity
        let extraction = null;
        try {
          extraction = await extractMoodAndActivity(inputText);
          console.log('LLM extraction result:', extraction);
        } catch (e) {
          console.error('LLM extraction error:', e);
        }

        // Only save mood if found and not a duplicate of activity
        if (extraction && extraction.mood && (!extraction.activity || extraction.mood !== extraction.activity)) {
          const score = await predictMoodScore(inputText, extraction.mood);
          if (score) {
            saveMoodLog(userId, extraction.mood, inputText, score);
          }
        }
        // Only save activity if found and not a duplicate of mood
        if (extraction && extraction.activity && (extraction.activitySentiment === 'positive' || extraction.activitySentiment === 'neutral') && (!extraction.mood || extraction.activity !== extraction.mood)) {
          const exists = await activityExists(extraction.activity);
          if (!exists) {
            saveExercise(userId, extraction.activity);
          } else {
            console.log('Activity already exists in any language, not saving:', extraction.activity);
          }
        }
      }
    } catch (err) {
      console.error("Error processing user message:", err);
    }

    setTimeout(() => {
      fetchBotReply(inputText)
        .then(async botReply => {
          setMessages(prevMessages => [...prevMessages, botReply]);
          // Save bot message to chat log
          try {
            const userId = await AsyncStorage.getItem('user_id');
            if (userId) {
              saveChatLog(userId, botReply.text, "bot");
            }
          } catch (err) {
            console.error("Error getting user_id for chat log:", err);
          }
        })
        .catch(error => {
          Alert.alert("Error", error.message);
          console.error("Error getting bot reply:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 10);
  };

  const fetchBotReply = async (userInput) => {
    try {
      // Prepare conversation history for the model
      const systemPrompt = AI_INSTRUCTIONS;

      const messageHistory = [
        systemPrompt,
        ...messages.map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text
        })),
        {
          role: "user",
          content: userInput
        }
      ];

      // Call Groq API using fetch
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: messageHistory,
          temperature: 1,
          max_tokens: 1024,
          top_p: 1
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "API request failed");
      }

      const data = await response.json();
      const botResponse = data.choices[0].message.content;

      return {
        text: botResponse,
        sender: "bot",
        timestamp: new Date()
      };
    } catch (error) {
      console.error("Error calling Groq API:", error);
      return {
        text: "Sorry, I encountered an error. Please try again later.",
        sender: "bot",
        timestamp: new Date()
      };
    }
  };

  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    // If user is not at the bottom, show the arrow
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
    setShowScrollToBottom(!isAtBottom && messages.length > 0);
  };

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.sender === "user";
    return (
      <View
        key={index}
        style={{
          marginVertical: 8,
          width: '100%',
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          maxWidth: '80%',
        }}>
          {!isUser && (
            <View style={{ marginRight: 8, flexShrink: 0 }}>
              <Image
                source={ROBOT_AVATAR}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff' }}
                resizeMode="cover"
              />
            </View>
          )}

          <View style={{
            backgroundColor: isUser ? '#5100F3' : '#fff',
            padding: 12,
            borderRadius: 18,
            borderBottomLeftRadius: isUser ? 18 : 4,
            borderBottomRightRadius: isUser ? 4 : 18,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1.5,
            elevation: 2,
            flex: 1,
          }}>
            <Text style={{
              color: isUser ? 'white' : '#2c1a4a',
              fontSize: 16,
              lineHeight: 22,
            }}>
              {msg.text}
            </Text>
            <Text style={{
              fontSize: 10,
              color: isUser ? 'rgba(255,255,255,0.7)' : '#64748b',
              marginTop: 4,
              alignSelf: 'flex-end'
            }}>
              {msg.timestamp && formatTime(msg.timestamp)}
            </Text>
          </View>

          {isUser && (
            <View style={{ marginLeft: 8, flexShrink: 0 }}>
              <Image
                source={user?.profile_image ? { uri: user.profile_image } : DEFAULT_AVATAR}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff' }}
                resizeMode="cover"
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  const startRecording = async () => {
    console.log('Starting recording process...');
    try {
      // Check if permissions are already granted
      console.log('Checking current permission status...');
      let { status: existingStatus } = await Audio.getPermissionsAsync();
      console.log('Existing permission status:', existingStatus);

      let finalStatus = existingStatus;

      // If not granted, request permission
      if (existingStatus !== 'granted') {
        console.log('Permission not granted, requesting...');
        const { status } = await Audio.requestPermissionsAsync();
        finalStatus = status;
        console.log('New permission status:', status);
      }

      if (finalStatus !== 'granted') {
        console.log('Permission denied');
        Alert.alert(
          'Microphone Permission Required',
          'To use voice input, please enable microphone access in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                // This will open the app settings on iOS and Android
                Platform.OS === 'ios' ?
                  Linking.openURL('app-settings:') :
                  Linking.openSettings();
              }
            }
          ]
        );
        return;
      }

      // If we get here, permission is granted
      console.log('Permission granted, setting up audio...');

      // Prepare recording
      console.log('Setting up audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });
      console.log('Audio mode set successfully');

      console.log('Creating recording object...');
      const recordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      console.log('Recording object created successfully:', recording);

      mediaRecorderRef.current = recording;
      console.log('Recording started successfully');
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      console.error('Error stack:', err.stack);
      Alert.alert('Error', `Failed to start recording: ${err.message}`);
    }
  };

  const stopRecording = async () => {
    console.log('Stopping recording process...');
    if (!mediaRecorderRef.current) {
      console.log('No active recording found');
      return;
    }

    try {
      console.log('Stopping recording...');
      await mediaRecorderRef.current.stopAndUnloadAsync();
      console.log('Recording stopped successfully');

      const uri = mediaRecorderRef.current.getURI();
      console.log('Recording URI:', uri);

      // Create a blob from the audio file
      console.log('Creating blob from recording...');
      const response = await fetch(uri);
      console.log('Fetch response:', response);
      const blob = await response.blob();
      console.log('Blob created successfully:', blob);

      console.log('Starting transcription...');
      await transcribeAudio(blob);

      // Reset audio mode
      console.log('Resetting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });
      console.log('Audio mode reset successfully');
    } catch (err) {
      console.error('Failed to stop recording:', err);
      console.error('Error stack:', err.stack);
      Alert.alert('Error', `Failed to stop recording: ${err.message}`);
    } finally {
      setIsRecording(false);
      mediaRecorderRef.current = null;
      console.log('Recording cleanup completed');
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      console.log('Starting transcription process...');
      setIsLoading(true);

      // Create form data
      console.log('Creating form data...');
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.m4a');
      formData.append('model', VOICE_AI_CONFIG.WHISPER_MODEL);
      formData.append('response_format', 'json');
      formData.append('temperature', '0');
      console.log('Form data created:', formData);

      // Send to Groq API
      console.log('Sending request to Groq API...');
      const response = await fetch(VOICE_AI_CONFIG.GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VOICE_AI_CONFIG.GROQ_API_KEY}`,
        },
        body: formData,
      });
      console.log('Groq API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Transcription API error:', errorData);
        throw new Error(errorData.error?.message || 'Transcription failed');
      }

      const data = await response.json();
      console.log('Transcription response:', data);

      // Check if we have valid transcription data
      if (data && data.text && data.text !== "Transcribe the following audio.") {
        console.log('Setting transcribed text:', data.text.trim());
        setInputText(data.text.trim());
      } else {
        console.error('Invalid transcription response:', data);
        throw new Error('Invalid transcription response');
      }
    } catch (err) {
      console.error('Failed to transcribe audio:', err);
      console.error('Error stack:', err.stack);
      Alert.alert('Error', `Failed to transcribe audio: ${err.message}`);
    } finally {
      setIsLoading(false);
      console.log('Transcription process completed');
    }
  };

  return (
    <LinearGradient
      colors={["#f3e7fa", "#e3e0ff"]}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          {/* Header */}
          <LinearGradient
            colors={["#e3e0ff", "#f3e7fa"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingTop: Platform.OS === 'ios' ? 40 : 10,
              paddingBottom: 10,
              paddingHorizontal: 14,
              borderBottomWidth: 1,
              borderBottomColor: '#e0d7f3',
              shadowColor: '#a18aff',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 4,
              position: 'relative',
            }}
          >
            <TouchableOpacity
              onPress={handleGoBack}
              style={{ position: 'absolute', left: 10, top: Platform.OS === 'ios' ? 40 : 10, padding: 4, zIndex: 2 }}
              accessibilityLabel={t('chatbot.go_back')}
              accessibilityRole="button"
            >
              <Text style={{ color: '#5100F3', fontSize: 22 }}>←</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Image
                source={ROBOT_AVATAR}
                style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: '#fff' }}
                resizeMode="cover"
              />
              <Text style={{
                fontSize: 19,
                fontWeight: 'bold',
                color: '#5100F3',
                textShadowColor: '#e3e0ff',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}>
                {t('chatbot.mindy')}
              </Text>
            </View>
          </LinearGradient>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
          >
            {/* Messages Container */}
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={{ padding: 16 }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {messages.length === 0 ? (
                <View style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 20,
                  marginTop: width * 0.3,
                }}>
                  <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: '#5100F3',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 20,
                  }}>
                    <Text style={{ fontSize: 32, color: 'white' }}>AI</Text>
                  </View>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: '#2c1a4a',
                    marginBottom: 12,
                  }}>
                    {t('chatbot.empty_title')}
                  </Text>
                  <Text style={{
                    fontSize: 16,
                    color: '#64748b',
                    textAlign: 'center',
                    maxWidth: '80%',
                  }}>
                    {t('chatbot.empty_subtitle')}
                  </Text>
                </View>
              ) : (
                messages.map(renderMessage)
              )}

              {isLoading && (
                <View style={{
                  width: '100%',
                  alignItems: 'flex-start',
                  marginVertical: 8,
                }}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    maxWidth: '80%',
                  }}>
                    <View style={{ marginRight: 8, flexShrink: 0 }}>
                      <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: '#5100F3',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>AI</Text>
                      </View>
                    </View>
                    <View style={{
                      backgroundColor: '#fff',
                      padding: 16,
                      borderRadius: 18,
                      borderBottomLeftRadius: 4,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.2,
                      shadowRadius: 1.5,
                      elevation: 2,
                      flex: 1,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ActivityIndicator size="small" color="#5100F3" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#64748b' }}>{t('chatbot.thinking')}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Scroll to bottom arrow - floating, centered, in a bubble */}
            {showScrollToBottom && (
              <TouchableOpacity
                onPress={scrollToBottom}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 100, // floats above input, adjust as needed
                  zIndex: 10,
                  alignItems: 'center',
                }}
                accessibilityLabel={t('chatbot.scroll_to_bottom')}
                accessibilityRole="button"
                activeOpacity={0.7}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#5100F3',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.18,
                  shadowRadius: 4,
                  elevation: 4,
                }}>
                  <Text style={{ fontSize: 24, color: '#fff', fontWeight: 'bold', lineHeight: 26 }}>↓</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Input Container */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#e0d7f3',
            }}>
              <TouchableOpacity
                onPress={isRecording ? stopRecording : startRecording}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isRecording ? '#ef4444' : '#5100F3',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10,
                }}
              >
                <Text style={{ color: 'white', fontSize: 18 }}>
                  {isRecording ? '■' : '🎤'}
                </Text>
              </TouchableOpacity>

              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: '#f8fafc',
                  borderRadius: 24,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  fontSize: 16,
                  marginRight: 10,
                  color: '#2c1a4a',
                }}
                placeholder={t('chatbot.input_placeholder')}
                placeholderTextColor="#64748b"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={isLoading || inputText.trim() === ''}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: inputText.trim() === '' ? '#cbd5e1' : '#5100F3',
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                <Text style={{ color: 'white', fontSize: 18 }}>→</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c1a4a',
    marginBottom: 20,
  },
});

export default ChatbotScreen;

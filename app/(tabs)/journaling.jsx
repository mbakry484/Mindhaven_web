import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import '../i18n';

const JournalingScreen = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const [entries, setEntries] = useState([]);
    const [currentEntry, setCurrentEntry] = useState('');
    const [title, setTitle] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [supportiveMessage, setSupportiveMessage] = useState('');
    const [showSupportiveMessage, setShowSupportiveMessage] = useState(false);

    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        try {
            const userId = await AsyncStorage.getItem('user_id');
            const response = await fetch(`http://localhost:8000/api/get_journal_entries/${userId}/`);
            if (!response.ok) {
                Alert.alert('Error', t('journal.failed_load_entries'));
                setEntries([]);
                return;
            }
            const data = await response.json();
            // Accept both {entries: ...} and {journal_entries: ...}
            const journalEntries = data.entries || data.journal_entries || [];
            if (!Array.isArray(journalEntries)) {
                setEntries([]);
                Alert.alert('Error', t('journal.unexpected_format'));
                return;
            }
            setEntries(journalEntries);
        } catch (error) {
            console.error('Error loading entries:', error);
            Alert.alert('Error', t('journal.failed_load_entries'));
            setEntries([]);
        }
    };

    const saveEntry = async () => {
        if (!currentEntry.trim()) {
            Alert.alert('Error', t('journal.please_enter_content'));
            return;
        }

        try {
            const userId = await AsyncStorage.getItem('user_id');
            const response = await fetch('http://localhost:8000/api/add_journal_entry/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    title: title.trim() || t('journal.untitled_entry'),
                    content: currentEntry.trim(),
                    date: new Date().toISOString(),
                }),
            });

            if (response.ok) {
                await loadEntries(); // Reload entries from database
                setTitle('');
                setCurrentEntry('');
                const encouragingMessages = [
                    "Great job expressing yourself! Writing down your thoughts is a powerful step towards self-awareness.",
                    "Well done on taking time for self-reflection! Each entry is a step towards better mental well-being.",
                    "Wonderful! Journaling is a great way to process your emotions and track your growth.",
                    "Amazing work! Your commitment to journaling shows you're taking care of your mental health.",
                    "Excellent! Every journal entry helps you understand yourself better."
                ];
                const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
                setSupportiveMessage(randomMessage);
                setShowSupportiveMessage(true);
                setTimeout(() => setShowSupportiveMessage(false), 4000);
            } else {
                throw new Error('Failed to save entry');
            }
        } catch (error) {
            console.error('Error saving entry:', error);
            Alert.alert('Error', t('journal.failed_save_entry'));
        }
    };

    const updateEntry = async () => {
        if (!editingEntry) return;

        try {
            const response = await fetch(`http://localhost:8000/api/update_journal_entry/${editingEntry._id}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title.trim() || t('journal.untitled_entry'),
                    content: currentEntry.trim(),
                }),
            });

            if (response.ok) {
                await loadEntries(); // Reload entries from database
                setIsModalVisible(false);
                setIsEditing(false);
                setEditingEntry(null);
                setTitle('');
                setCurrentEntry('');
                Alert.alert('Success', t('journal.entry_updated'));
            } else {
                throw new Error('Failed to update entry');
            }
        } catch (error) {
            console.error('Error updating entry:', error);
            Alert.alert('Error', t('journal.failed_update_entry'));
        }
    };

    const deleteEntry = async (entryId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/delete_journal_entry/${entryId}/`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await loadEntries(); // Reload entries from database
                Alert.alert('Success', t('journal.entry_deleted'));
            } else {
                throw new Error('Failed to delete entry');
            }
        } catch (error) {
            console.error('Error deleting entry:', error);
            Alert.alert('Error', t('journal.failed_delete_entry'));
        }
    };

    const handleEditEntry = (entry) => {
        setEditingEntry(entry);
        setTitle(entry.title);
        setCurrentEntry(entry.content);
        setIsEditing(true);
        setIsModalVisible(true);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <View style={styles.container}>
            {/* Supportive Message Banner */}
            {showSupportiveMessage && (
                <View style={styles.supportiveBanner}>
                    <Text style={styles.supportiveBannerIcon}>💜</Text>
                    <Text style={styles.supportiveBannerText}>{supportiveMessage}</Text>
                </View>
            )}
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('journal.journal')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView style={styles.scrollView}>
                    {/* New Entry Form */}
                    <View style={styles.newEntryContainer}>
                        <TextInput
                            style={styles.titleInput}
                            placeholder={t('journal.title_optional')}
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />
                        <TextInput
                            style={styles.contentInput}
                            placeholder={t('journal.write_thoughts')}
                            value={currentEntry}
                            onChangeText={setCurrentEntry}
                            multiline
                            textAlignVertical="top"
                        />
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={saveEntry}
                        >
                            <Text style={styles.saveButtonText}>{t('journal.save_entry')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Previous Entries */}
                    {entries.length === 0 ? (
                        <View style={styles.emptyStateContainer}>
                            <Text style={styles.emptyStateText}>{t('journal.no_entries')}</Text>
                            <Text style={styles.emptyStateSubtext}>{t('journal.start_journaling_message')}</Text>
                        </View>
                    ) : (
                        entries.map((entry) => (
                            <TouchableOpacity
                                key={entry._id}
                                style={styles.entryCard}
                                onPress={() => handleEditEntry(entry)}
                            >
                                <View style={styles.entryHeader}>
                                    <Text style={styles.entryTitle}>{entry.title}</Text>
                                    <TouchableOpacity
                                        onPress={() => deleteEntry(entry._id)}
                                        style={styles.deleteButton}
                                    >
                                        <Text style={styles.deleteButtonText}>×</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                                <Text style={styles.entryContent} numberOfLines={3}>
                                    {entry.content}
                                </Text>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Edit Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setIsModalVisible(false);
                    setIsEditing(false);
                    setEditingEntry(null);
                    setTitle('');
                    setCurrentEntry('');
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('journal.edit_entry')}</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setIsModalVisible(false);
                                    setIsEditing(false);
                                    setEditingEntry(null);
                                    setTitle('');
                                    setCurrentEntry('');
                                }}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>×</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.modalTitleInput}
                            placeholder={t('journal.title_optional')}
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />
                        <TextInput
                            style={styles.modalContentInput}
                            placeholder={t('journal.write_thoughts')}
                            value={currentEntry}
                            onChangeText={setCurrentEntry}
                            multiline
                            textAlignVertical="top"
                        />
                        <TouchableOpacity
                            style={styles.updateButton}
                            onPress={updateEntry}
                        >
                            <Text style={styles.updateButtonText}>{t('journal.update_entry')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
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
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        padding: 16,
        paddingTop: 20,
    },
    newEntryContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(81, 0, 243, 0.1)',
    },
    titleInput: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        color: '#1e293b',
    },
    contentInput: {
        fontSize: 16,
        minHeight: 150,
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 16,
        color: '#1e293b',
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: '#5100F3',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#5100F3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    entryCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(81, 0, 243, 0.05)',
    },
    entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    entryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        flex: 1,
        letterSpacing: 0.3,
    },
    deleteButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
        padding: 8,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButtonText: {
        fontSize: 18,
        color: '#ef4444',
        fontWeight: '600',
    },
    entryDate: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 12,
        fontWeight: '500',
    },
    entryContent: {
        fontSize: 16,
        color: '#334155',
        lineHeight: 24,
        fontWeight: '400',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1e293b',
        letterSpacing: 0.3,
    },
    closeButton: {
        backgroundColor: 'rgba(100, 116, 139, 0.1)',
        borderRadius: 8,
        padding: 8,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        fontSize: 18,
        color: '#64748b',
        fontWeight: '600',
    },
    modalTitleInput: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        color: '#1e293b',
    },
    modalContentInput: {
        fontSize: 16,
        minHeight: 200,
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20,
        color: '#1e293b',
        textAlignVertical: 'top',
    },
    updateButton: {
        backgroundColor: '#5100F3',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#5100F3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    updateButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 20,
        backgroundColor: 'white',
        borderRadius: 16,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    emptyStateText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    emptyStateSubtext: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
        fontWeight: '400',
    },
    supportiveBanner: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(99,102,241,0.98)', // fallback for gradient
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#a5b4fc',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 16,
        zIndex: 100,
        overflow: 'hidden',
    },
    supportiveBannerIcon: {
        fontSize: 22,
        marginRight: 10,
    },
    supportiveBannerText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'center',
        flex: 1,
        textShadowColor: 'rgba(49, 46, 129, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});

export default JournalingScreen;
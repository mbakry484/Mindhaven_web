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

const JournalingScreen = () => {
    const router = useRouter();
    const [entries, setEntries] = useState([]);
    const [currentEntry, setCurrentEntry] = useState('');
    const [title, setTitle] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        try {
            const userId = await AsyncStorage.getItem('user_id');
            const response = await fetch(`http://localhost:8000/api/get_journal_entries/${userId}/`);
            if (!response.ok) {
                Alert.alert('Error', 'Failed to load journal entries');
                setEntries([]);
                return;
            }
            const data = await response.json();
            // Accept both {entries: ...} and {journal_entries: ...}
            const journalEntries = data.entries || data.journal_entries || [];
            if (!Array.isArray(journalEntries)) {
                setEntries([]);
                Alert.alert('Error', 'Unexpected response format for journal entries');
                return;
            }
            setEntries(journalEntries);
        } catch (error) {
            console.error('Error loading entries:', error);
            Alert.alert('Error', 'Failed to load journal entries');
            setEntries([]);
        }
    };

    const saveEntry = async () => {
        if (!currentEntry.trim()) {
            Alert.alert('Error', 'Please enter some content');
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
                    title: title.trim() || 'Untitled Entry',
                    content: currentEntry.trim(),
                    date: new Date().toISOString(),
                }),
            });

            if (response.ok) {
                await loadEntries(); // Reload entries from database
                setTitle('');
                setCurrentEntry('');
                Alert.alert('Success', 'Journal entry saved successfully!');
            } else {
                throw new Error('Failed to save entry');
            }
        } catch (error) {
            console.error('Error saving entry:', error);
            Alert.alert('Error', 'Failed to save journal entry');
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
                    title: title.trim() || 'Untitled Entry',
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
                Alert.alert('Success', 'Journal entry updated successfully!');
            } else {
                throw new Error('Failed to update entry');
            }
        } catch (error) {
            console.error('Error updating entry:', error);
            Alert.alert('Error', 'Failed to update journal entry');
        }
    };

    const deleteEntry = async (entryId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/delete_journal_entry/${entryId}/`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await loadEntries(); // Reload entries from database
                Alert.alert('Success', 'Journal entry deleted successfully!');
            } else {
                throw new Error('Failed to delete entry');
            }
        } catch (error) {
            console.error('Error deleting entry:', error);
            Alert.alert('Error', 'Failed to delete journal entry');
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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Journal</Text>
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
                            placeholder="Title (optional)"
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />
                        <TextInput
                            style={styles.contentInput}
                            placeholder="Write your thoughts..."
                            value={currentEntry}
                            onChangeText={setCurrentEntry}
                            multiline
                            textAlignVertical="top"
                        />
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={saveEntry}
                        >
                            <Text style={styles.saveButtonText}>Save Entry</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Previous Entries */}
                    {entries.map((entry) => (
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
                    ))}
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
                            <Text style={styles.modalTitle}>Edit Entry</Text>
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
                            placeholder="Title (optional)"
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />
                        <TextInput
                            style={styles.modalContentInput}
                            placeholder="Write your thoughts..."
                            value={currentEntry}
                            onChangeText={setCurrentEntry}
                            multiline
                            textAlignVertical="top"
                        />
                        <TouchableOpacity
                            style={styles.updateButton}
                            onPress={updateEntry}
                        >
                            <Text style={styles.updateButtonText}>Update Entry</Text>
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
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: '#1e293b',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        color: 'white',
        fontSize: 24,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    newEntryContainer: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    titleInput: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        padding: 8,
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    contentInput: {
        fontSize: 16,
        minHeight: 150,
        padding: 8,
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 12,
    },
    saveButton: {
        backgroundColor: '#5100F3',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    entryCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    entryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c1a4a',
        flex: 1,
    },
    deleteButton: {
        padding: 4,
    },
    deleteButtonText: {
        fontSize: 24,
        color: '#ef4444',
    },
    entryDate: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 8,
    },
    entryContent: {
        fontSize: 16,
        color: '#334155',
        lineHeight: 24,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c1a4a',
    },
    closeButton: {
        padding: 4,
    },
    closeButtonText: {
        fontSize: 24,
        color: '#64748b',
    },
    modalTitleInput: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        padding: 8,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    modalContentInput: {
        fontSize: 16,
        minHeight: 200,
        padding: 8,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 16,
    },
    updateButton: {
        backgroundColor: '#5100F3',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    updateButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default JournalingScreen; 
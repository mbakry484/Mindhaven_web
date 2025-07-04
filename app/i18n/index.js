import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import ar from './ar.json';
import de from './de.json';

// Function to get stored language
const getStoredLanguage = async () => {
    try {
        const storedLanguage = await AsyncStorage.getItem('selected_language');
        return storedLanguage || 'en';
    } catch (error) {
        console.error('Error getting stored language:', error);
        return 'en';
    }
};

// Function to get current language
export const getCurrentLanguage = () => {
    return i18n.language || 'en';
};

// Initialize i18n with stored language
const initializeI18n = async () => {
    const storedLanguage = await getStoredLanguage();

    i18n
        .use(initReactI18next)
        .init({
            resources: {
                en: { translation: en },
                ar: { translation: ar },
                de: { translation: de },
            },
            lng: storedLanguage,
            fallbackLng: 'en',
            interpolation: { escapeValue: false },
        });
};

// Initialize immediately
initializeI18n();

// Function to change language and persist it
export const changeLanguage = async (language) => {
    try {
        await AsyncStorage.setItem('selected_language', language);
        await i18n.changeLanguage(language);
    } catch (error) {
        console.error('Error changing language:', error);
    }
};

export default i18n; 
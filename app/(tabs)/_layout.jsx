import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import '../i18n';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
    const { t } = useTranslation();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 0,
                    elevation: 8,
                    shadowColor: '#a18aff',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    height: 65,
                    paddingBottom: 0,
                    paddingTop: 4,
                },
                tabBarActiveTintColor: '#5100F3',
                tabBarInactiveTintColor: '#6c4ab6',
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                    marginBottom: 0,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: t('navigation.home'),
                    tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
                }}
                href="/home"
            />
            <Tabs.Screen
                name="chatbot"
                options={{
                    title: t('navigation.chat'),
                    tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble" size={size} color={color} />,
                }}
                href="/chatbot"
            />
            <Tabs.Screen
                name="resources"
                options={{
                    title: t('navigation.resources'),
                    tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
                }}
                href="/resources"
            />
            <Tabs.Screen
                name="exercises"
                options={{
                    title: t('navigation.exercises'),
                    tabBarIcon: ({ color, size }) => <Ionicons name="fitness" size={size} color={color} />,
                }}
                href="/exercises"
            />
            <Tabs.Screen
                name="blog"
                options={{
                    title: t('navigation.blog'),
                    tabBarIcon: ({ color, size }) => <Ionicons name="newspaper" size={size} color={color} />,
                }}
                href="/blog"
            />
            <Tabs.Screen
                name="journaling"
                options={{
                    title: t('navigation.journal'),
                    tabBarIcon: ({ color, size }) => <Ionicons name="create-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="mood-tracker"
                options={{
                    title: t('navigation.mood'),
                    tabBarIcon: ({ color, size }) => <Ionicons name="happy" size={size} color={color} />,
                }}
                href="/mood-tracking"
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: t('navigation.profile'),
                    tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
                }}
                href="/profile"
            />

        </Tabs>


    );
} 
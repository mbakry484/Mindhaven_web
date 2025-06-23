import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import './i18n';

export default function AppLayout() {
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
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: '#5100F3',
                tabBarInactiveTintColor: '#6c4ab6',
            }}
        >
            <Tabs.Screen name="home" options={{
                title: t('navigation.home'),
                tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
            }} />
            <Tabs.Screen name="chatbot" options={{
                title: t('navigation.chat'),
                tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble" size={size} color={color} />,
            }} />
            <Tabs.Screen name="resources" options={{
                title: t('navigation.resources'),
                tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
            }} />
            <Tabs.Screen name="exercises" options={{
                title: t('navigation.exercises'),
                tabBarIcon: ({ color, size }) => <Ionicons name="fitness" size={size} color={color} />,
            }} />
            <Tabs.Screen name="blog" options={{
                title: t('navigation.blog'),
                tabBarIcon: ({ color, size }) => <Ionicons name="newspaper" size={size} color={color} />,
            }} />
        </Tabs>
    );
} 
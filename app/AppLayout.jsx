import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {
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
                title: 'Home',
                tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
            }} />
            <Tabs.Screen name="chatbot" options={{
                title: 'Chatbot',
                tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble" size={size} color={color} />,
            }} />
            <Tabs.Screen name="resources" options={{
                title: 'Resources',
                tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
            }} />
            <Tabs.Screen name="exercises" options={{
                title: 'Exercises',
                tabBarIcon: ({ color, size }) => <Ionicons name="fitness" size={size} color={color} />,
            }} />
            <Tabs.Screen name="blog" options={{
                title: 'Blog',
                tabBarIcon: ({ color, size }) => <Ionicons name="newspaper" size={size} color={color} />,
            }} />
        </Tabs>
    );
} 
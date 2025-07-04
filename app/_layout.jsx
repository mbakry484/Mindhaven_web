import React, { useContext, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { UserProvider, useUser } from '../utils/UserContext';
import AppLayout from './AppLayout';
import './i18n';

export default function RootLayout() {
    return (
        <UserProvider>
            <AuthGate />
        </UserProvider>
    );
}

function AuthGate() {
    const { user, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [user, loading]);

    if (loading) return null;

    // Only show AppLayout for main app pages
    const route = router.asPath || '';
    const isAppPage = [
        '/home',
        '/chatbot',
        '/resources',
        '/exercises',
        '/blog',
    ].some((p) => route.startsWith(p));

    if (user && isAppPage) {
        return <AppLayout />;
    }

    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            {/* fallback for other pages if needed */}
        </Stack>
    );
} 
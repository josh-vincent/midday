import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../../lib/auth';

export default function MainLayout() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return null;
  }

  return (
    <Stack screenOptions={{ 
      headerShown: true,
      headerStyle: { backgroundColor: '#ffffff' },
      headerTintColor: '#020817',
    }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Gatekeeper',
          headerLargeTitle: true,
        }} 
      />
    </Stack>
  );
}
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
// import { HamburgerMenuProvider } from './utils/hamburgerMenuContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './navigation/RootNavigator';
import AuthGuard from './components/AuthGuard';
import { useAuthStore } from './store/authStore';

export default function App() {

  const { isInitialized } = useAuthStore();

  if (!isInitialized) {
    return null; // Or a loading screen
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AuthGuard>
            <RootNavigator />
          </AuthGuard>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
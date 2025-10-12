import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import SplashScreenComponent from "../components/SplashScreen";
import { DarkModeProvider, useDarkMode } from "../contexts/DarkModeContext";

function HeaderRight() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  
  return (
    <TouchableOpacity 
      style={[styles.darkModeButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} 
      onPress={toggleDarkMode}
    >
      <Text style={styles.darkModeButtonText}>{isDarkMode ? '☀️' : '🌙'}</Text>
    </TouchableOpacity>
  );
}

function StackNavigator() {
  const { isDarkMode } = useDarkMode();
  
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "SMS Forwarder",
          headerStyle: {
            backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f9fa',
          },
          headerTintColor: isDarkMode ? '#ffffff' : '#333',
            headerTitleStyle: {
              fontFamily: 'Inter_700Bold',
              fontSize: 18,
              color: isDarkMode ? '#ffffff' : '#333',
            },
          headerRight: () => <HeaderRight />,
        }} 
      />
      <Stack.Screen 
        name="config" 
        options={{ 
          title: "Configuration",
          headerStyle: {
            backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f9fa',
          },
          headerTintColor: isDarkMode ? '#ffffff' : '#333',
            headerTitleStyle: {
              fontFamily: 'Inter_700Bold',
              fontSize: 18,
              color: isDarkMode ? '#ffffff' : '#333',
            },
          headerRight: () => <HeaderRight />,
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (!fontsLoaded) {
    return null;
  }

  if (showSplash) {
    return <SplashScreenComponent onAnimationFinish={handleSplashFinish} />;
  }

  return (
    <DarkModeProvider>
      <StackNavigator />
    </DarkModeProvider>
  );
}

const styles = StyleSheet.create({
  darkModeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginRight: 10,
  },
  darkModeButtonText: {
    fontSize: 18,
  },
});

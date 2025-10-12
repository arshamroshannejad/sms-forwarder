import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useSMSListener } from '../hooks/useSMSListener';

export default function HomePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [smsCount, setSmsCount] = useState(0);
  
  // Initialize SMS listener and dark mode
  const smsService = useSMSListener();
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const running = await AsyncStorage.getItem('smsForwarderRunning');
      const count = await AsyncStorage.getItem('smsForwardedCount');
      setIsRunning(running === 'true');
      setSmsCount(parseInt(count || '0'));
    } catch (error) {
      console.error('Error loading status:', error);
    }
  };

  const toggleService = async () => {
    try {
      const newStatus = !isRunning;
      
      if (newStatus) {
        await smsService.start();
      } else {
        await smsService.stop();
      }
      
      setIsRunning(newStatus);
    } catch (error) {
      console.error('Error toggling service:', error);
      Alert.alert('Error', 'Failed to toggle service');
    }
  };

  const resetCount = async () => {
    try {
      await AsyncStorage.setItem('smsForwardedCount', '0');
      setSmsCount(0);
    } catch (error) {
      console.error('Error resetting count:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa' }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? '#1a1a1a' : '#f8f9fa'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#333' }]}>SMS Forwarder</Text>
        <Text style={[styles.subtitle, { color: isDarkMode ? '#cccccc' : '#666' }]}>Forward incoming SMS to API or Telegram</Text>
      </View>

      <View style={styles.statusContainer}>
        <View style={[styles.statusCard, { backgroundColor: isDarkMode ? '#2d2d2d' : 'white' }]}>
          <Text style={[styles.statusLabel, { color: isDarkMode ? '#cccccc' : '#666' }]}>Service Status</Text>
          <View style={[styles.statusIndicator, { backgroundColor: isRunning ? '#28a745' : '#dc3545' }]}>
            <Text style={styles.statusText}>
              {isRunning ? 'RUNNING' : 'STOPPED'}
            </Text>
          </View>
        </View>

        <View style={[styles.statusCard, { backgroundColor: isDarkMode ? '#2d2d2d' : 'white' }]}>
          <Text style={[styles.statusLabel, { color: isDarkMode ? '#cccccc' : '#666' }]}>SMS Forwarded</Text>
          <Text style={[styles.countText, { color: isDarkMode ? '#4dabf7' : '#007bff' }]}>{smsCount}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.mainButton, { backgroundColor: isRunning ? '#dc3545' : '#007bff' }]}
          onPress={toggleService}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'STOP' : 'START'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.secondaryButton, { 
            backgroundColor: isDarkMode ? '#2d2d2d' : 'white',
            borderColor: isDarkMode ? '#4dabf7' : '#007bff'
          }]}
          onPress={() => router.push('/config')}
        >
          <Text style={[styles.secondaryButtonText, { color: isDarkMode ? '#4dabf7' : '#007bff' }]}>CONFIGURATION</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.resetButton}
          onPress={resetCount}
        >
          <Text style={[styles.resetButtonText, { color: isDarkMode ? '#cccccc' : '#666' }]}>Reset Count</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  statusCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#666',
    marginBottom: 10,
  },
  statusIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  countText: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#007bff',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  mainButton: {
    backgroundColor: '#007bff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#007bff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  resetButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});

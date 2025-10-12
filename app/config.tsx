import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDarkMode } from '../contexts/DarkModeContext';
import SMSForwarderService, { ErrorEvent } from '../services/SMSForwarderService';

interface ConfigData {
  restApiEnabled: boolean;
  restApiUrl: string;
  restApiHeaders: string;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
}

export default function ConfigPage() {
  const [config, setConfig] = useState<ConfigData>({
    restApiEnabled: false,
    restApiUrl: '',
    restApiHeaders: '{"Content-Type": "application/json"}',
    telegramEnabled: false,
    telegramBotToken: '',
    telegramChatId: '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { isDarkMode } = useDarkMode();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const smsService = useRef(SMSForwarderService.getInstance());

  useEffect(() => {
    loadConfig();
    
    // Setup error listener
    const handleError = (error: ErrorEvent) => {
      setErrorMessage(error.message);
    };
    
    smsService.current.addErrorListener(handleError);
    
    // Cleanup timeout and error listener on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      smsService.current.removeErrorListener(handleError);
    };
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await AsyncStorage.getItem('smsForwarderConfig');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const autoSaveConfig = useCallback(async (configToSave: ConfigData) => {
    try {
      await AsyncStorage.setItem('smsForwarderConfig', JSON.stringify(configToSave));
      console.log('Configuration auto-saved');
    } catch (error) {
      console.error('Error auto-saving config:', error);
    }
  }, []);

  const testRestApi = async () => {
    if (!config.restApiUrl) {
      setErrorMessage('Please enter REST API URL');
      return;
    }

    try {
      const headers = JSON.parse(config.restApiHeaders);
      const response = await fetch(config.restApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          test: true,
          message: 'Test message from SMS Forwarder',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setErrorMessage(null);
        Alert.alert('Success', 'REST API test successful');
      } else {
        setErrorMessage(`REST API test failed: ${response.status}`);
        // Auto-dismiss error after 3 seconds
        setTimeout(() => setErrorMessage(null), 3000);
      }
    } catch (error) {
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        setErrorMessage('Network Error: Check your internet connection or try using VPN');
      } else if (error instanceof Error && error.message.includes('fetch')) {
        setErrorMessage('Network Error: Check your internet connection or try using VPN');
      } else {
        setErrorMessage(`REST API test failed: ${error}`);
      }
      // Auto-dismiss error after 3 seconds
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const testTelegram = async () => {
    if (!config.telegramBotToken) {
      setErrorMessage('Please enter Telegram Bot Token');
      // Auto-dismiss error after 3 seconds
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    if (!config.telegramChatId) {
      setErrorMessage('Please enter Telegram Chat ID');
      // Auto-dismiss error after 3 seconds
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      // First test if bot token is valid
      const botResponse = await fetch(
        `https://api.telegram.org/bot${config.telegramBotToken}/getMe`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const botData = await botResponse.json();
      if (!botData.ok) {
        setErrorMessage(`Invalid bot token: ${botData.description}`);
        // Auto-dismiss error after 3 seconds
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }

      // Then test sending a message to the chat
      const testMessage = `🧪 *Test Message from SMS Forwarder*\n\nThis is a test to verify your configuration is working correctly!`;
      
      const messageResponse = await fetch(
        `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: config.telegramChatId,
            text: testMessage,
            parse_mode: 'Markdown',
          }),
        }
      );

      const messageData = await messageResponse.json();
      if (messageData.ok) {
        setErrorMessage(null);
        Alert.alert('Success', `Telegram test successful!\nBot: @${botData.result.username}\nTest message sent to chat.`);
      } else {
        setErrorMessage(`Failed to send test message: ${messageData.description}`);
        // Auto-dismiss error after 3 seconds
        setTimeout(() => setErrorMessage(null), 3000);
      }
    } catch (error) {
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        setErrorMessage('Network Error: Check your internet connection or try using VPN');
      } else if (error instanceof Error && error.message.includes('fetch')) {
        setErrorMessage('Network Error: Check your internet connection or try using VPN');
      } else {
        setErrorMessage(`Telegram test failed: ${error}`);
      }
      // Auto-dismiss error after 3 seconds
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const dismissError = () => {
    setErrorMessage(null);
  };

  const updateConfig = (key: keyof ConfigData, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save (500ms delay)
    saveTimeoutRef.current = setTimeout(() => {
      autoSaveConfig(newConfig);
    }, 500);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa' }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? '#1a1a1a' : '#f8f9fa'} />

      {/* REST API Section */}
      <View style={[styles.section, { backgroundColor: isDarkMode ? '#2d2d2d' : 'white' }]}>
        <View style={[styles.sectionHeader, { borderBottomColor: isDarkMode ? '#404040' : '#e9ecef' }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#333' }]}>REST API</Text>
          <Switch
            value={config.restApiEnabled}
            onValueChange={(value) => updateConfig('restApiEnabled', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={config.restApiEnabled ? '#007bff' : '#f4f3f4'}
          />
        </View>

        {config.restApiEnabled && (
          <View style={styles.configForm}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? '#cccccc' : '#333' }]}>API URL</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
                  borderColor: isDarkMode ? '#404040' : '#ddd',
                  color: isDarkMode ? '#ffffff' : '#333'
                }]}
                value={config.restApiUrl}
                onChangeText={(value) => updateConfig('restApiUrl', value)}
                placeholder="https://your-api.com/sms"
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>


            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? '#cccccc' : '#333' }]}>Headers (JSON)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { 
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
                  borderColor: isDarkMode ? '#404040' : '#ddd',
                  color: isDarkMode ? '#ffffff' : '#333'
                }]}
                value={config.restApiHeaders}
                onChangeText={(value) => updateConfig('restApiHeaders', value)}
                placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.testButton} onPress={testRestApi}>
              <Text style={styles.testButtonText}>Test REST API</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Telegram Bot Section */}
      <View style={[styles.section, { backgroundColor: isDarkMode ? '#2d2d2d' : 'white' }]}>
        <View style={[styles.sectionHeader, { borderBottomColor: isDarkMode ? '#404040' : '#e9ecef' }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#333' }]}>Telegram Bot</Text>
          <Switch
            value={config.telegramEnabled}
            onValueChange={(value) => updateConfig('telegramEnabled', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={config.telegramEnabled ? '#007bff' : '#f4f3f4'}
          />
        </View>

        {config.telegramEnabled && (
          <View style={styles.configForm}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? '#cccccc' : '#333' }]}>Bot Token</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
                  borderColor: isDarkMode ? '#404040' : '#ddd',
                  color: isDarkMode ? '#ffffff' : '#333'
                }]}
                value={config.telegramBotToken}
                onChangeText={(value) => updateConfig('telegramBotToken', value)}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                autoCapitalize="none"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? '#cccccc' : '#333' }]}>Chat ID</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
                  borderColor: isDarkMode ? '#404040' : '#ddd',
                  color: isDarkMode ? '#ffffff' : '#333'
                }]}
                value={config.telegramChatId}
                onChangeText={(value) => updateConfig('telegramChatId', value)}
                placeholder="123456789 or @username"
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                autoCapitalize="none"
                keyboardType="default"
              />
            </View>

            <TouchableOpacity style={styles.testButton} onPress={testTelegram}>
              <Text style={styles.testButtonText}>Test Telegram</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Configuration is automatically saved as you type. Test your settings before starting the service.
        </Text>
      </View>

      {/* Error Banner - Centered */}
      {errorMessage && (
        <View style={styles.errorContainer}>
          <View style={[styles.errorBanner, { backgroundColor: isDarkMode ? '#dc3545' : '#dc3545' }]}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity onPress={dismissError} style={styles.errorDismissButton}>
              <Text style={styles.errorDismissText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#333',
  },
  configForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    backgroundColor: '#f8f9fa',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  testButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  errorContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#dc3545',
    minWidth: 280,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: 'white',
    lineHeight: 20,
    textAlign: 'center',
  },
  errorDismissButton: {
    padding: 8,
    marginLeft: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  errorDismissText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});

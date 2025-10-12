import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
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

interface ConfigData {
  restApiEnabled: boolean;
  restApiUrl: string;
  restApiMethod: string;
  restApiHeaders: string;
  telegramEnabled: boolean;
  telegramBotToken: string;
}

export default function ConfigPage() {
  const [config, setConfig] = useState<ConfigData>({
    restApiEnabled: false,
    restApiUrl: '',
    restApiMethod: 'POST',
    restApiHeaders: '{"Content-Type": "application/json"}',
    telegramEnabled: false,
    telegramBotToken: '',
  });
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    loadConfig();
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

  const saveConfig = async () => {
    try {
      await AsyncStorage.setItem('smsForwarderConfig', JSON.stringify(config));
      Alert.alert('Success', 'Configuration saved successfully');
    } catch (error) {
      console.error('Error saving config:', error);
      Alert.alert('Error', 'Failed to save configuration');
    }
  };

  const testRestApi = async () => {
    if (!config.restApiUrl) {
      Alert.alert('Error', 'Please enter REST API URL');
      return;
    }

    try {
      const headers = JSON.parse(config.restApiHeaders);
      const response = await fetch(config.restApiUrl, {
        method: config.restApiMethod,
        headers,
        body: JSON.stringify({
          test: true,
          message: 'Test message from SMS Forwarder',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'REST API test successful');
      } else {
        Alert.alert('Error', `REST API test failed: ${response.status}`);
      }
    } catch (error) {
      Alert.alert('Error', `REST API test failed: ${error}`);
    }
  };

  const testTelegram = async () => {
    if (!config.telegramBotToken) {
      Alert.alert('Error', 'Please enter Telegram Bot Token');
      return;
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${config.telegramBotToken}/getMe`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.ok) {
        Alert.alert('Success', `Telegram bot test successful!\nBot: @${data.result.username}`);
      } else {
        Alert.alert('Error', `Telegram test failed: ${data.description}`);
      }
    } catch (error) {
      Alert.alert('Error', `Telegram test failed: ${error}`);
    }
  };

  const updateConfig = (key: keyof ConfigData, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
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
              <Text style={styles.label}>HTTP Method</Text>
              <View style={styles.methodContainer}>
                {['GET', 'POST', 'PUT', 'PATCH'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.methodButton,
                      config.restApiMethod === method && styles.methodButtonActive,
                    ]}
                    onPress={() => updateConfig('restApiMethod', method)}
                  >
                    <Text
                      style={[
                        styles.methodButtonText,
                        config.restApiMethod === method && styles.methodButtonTextActive,
                      ]}
                    >
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Headers (JSON)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={config.restApiHeaders}
                onChangeText={(value) => updateConfig('restApiHeaders', value)}
                placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
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

            <TouchableOpacity style={styles.testButton} onPress={testTelegram}>
              <Text style={styles.testButtonText}>Test Telegram</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={saveConfig}>
        <Text style={styles.saveButtonText}>Save Configuration</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Make sure to test your configuration before starting the service.
        </Text>
      </View>
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
  methodContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  methodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  methodButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  methodButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#666',
  },
  methodButtonTextActive: {
    color: 'white',
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
  saveButton: {
    backgroundColor: '#007bff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
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
});

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import SMSForwarderService, { SMSMessage } from '../services/SMSForwarderService';

// Mock SMS listener for development/testing
// In a real implementation, you would use react-native-sms-listener or similar
class MockSMSListener {
  private listeners: ((sms: SMSMessage) => void)[] = [];
  private intervalId: NodeJS.Timeout | null = null;

  public addListener(callback: (sms: SMSMessage) => void): void {
    this.listeners.push(callback);
  }

  public removeListener(callback: (sms: SMSMessage) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  public start(): void {
    if (this.intervalId) return;
    
    // Simulate incoming SMS every 30 seconds for testing
    this.intervalId = setInterval(() => {
      const mockSMS: SMSMessage = {
        body: `Test SMS message at ${new Date().toLocaleString()}`,
        address: '+1234567890',
        date: Date.now().toString(),
        dateSent: Date.now().toString(),
      };
      
      this.listeners.forEach(listener => listener(mockSMS));
    }, 30000);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

const mockSMSListener = new MockSMSListener();

export const useSMSListener = () => {
  const smsService = useRef(SMSForwarderService.getInstance());
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleSMS = async (sms: SMSMessage) => {
      console.log('Received SMS:', sms);
      
      // Check if service is running
      if (smsService.current.isServiceRunning()) {
        await smsService.current.forwardSMS(sms);
      }
    };

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground');
        // Reload config when app comes to foreground
        smsService.current.start().catch(console.error);
      }
      appState.current = nextAppState;
    };

    // Add SMS listener
    mockSMSListener.addListener(handleSMS);
    
    // Add app state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Start SMS listener
    mockSMSListener.start();

    return () => {
      mockSMSListener.removeListener(handleSMS);
      subscription?.remove();
      mockSMSListener.stop();
    };
  }, []);

  return smsService.current;
};

// Real SMS listener implementation (commented out for now)
// Uncomment and modify this when you have the actual SMS listener library
/*
import SmsListener from 'react-native-sms-listener';

export const useSMSListener = () => {
  const smsService = useRef(SMSForwarderService.getInstance());

  useEffect(() => {
    const handleSMS = async (sms: SMSMessage) => {
      console.log('Received SMS:', sms);
      
      if (smsService.current.isServiceRunning()) {
        await smsService.current.forwardSMS(sms);
      }
    };

    // Start listening for SMS
    SmsListener.addListener(handleSMS);

    return () => {
      SmsListener.removeListener(handleSMS);
    };
  }, []);

  return smsService.current;
};
*/

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import SMSForwarderService from '../services/SMSForwarderService';

export const useSMSListener = () => {
  const smsService = useRef(SMSForwarderService.getInstance());
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground');
        // Reload config when app comes to foreground
        smsService.current.start().catch(console.error);
      }
      appState.current = nextAppState;
    };

    // Add app state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  return smsService.current;
};

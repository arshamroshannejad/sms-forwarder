import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SMSMessage {
  body: string;
  address: string;
  date: string;
  dateSent: string;
}

export interface ConfigData {
  restApiEnabled: boolean;
  restApiUrl: string;
  restApiHeaders: string;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
}

export interface ErrorEvent {
  type: 'telegram' | 'restapi' | 'general';
  message: string;
  timestamp: string;
}

type ErrorListener = (error: ErrorEvent) => void;

class SMSForwarderService {
  private static instance: SMSForwarderService;
  private isRunning: boolean = false;
  private config: ConfigData | null = null;
  private errorListeners: ErrorListener[] = [];

  private constructor() {}

  public static getInstance(): SMSForwarderService {
    if (!SMSForwarderService.instance) {
      SMSForwarderService.instance = new SMSForwarderService();
    }
    return SMSForwarderService.instance;
  }

  public async start(): Promise<void> {
    try {
      await this.loadConfig();
      
      // Validate configuration before starting
      if (!this.isConfigurationValidSync()) {
        console.log('Cannot start service: No valid configuration found');
        return; // Just return without throwing error
      }
      
      this.isRunning = true;
      await AsyncStorage.setItem('smsForwarderRunning', 'true');
      console.log('SMS Forwarder Service started');
    } catch (error) {
      console.error('Error starting SMS Forwarder Service:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    await AsyncStorage.setItem('smsForwarderRunning', 'false');
    console.log('SMS Forwarder Service stopped');
  }

  public isServiceRunning(): boolean {
    return this.isRunning;
  }

  public addErrorListener(listener: ErrorListener): void {
    this.errorListeners.push(listener);
  }

  public removeErrorListener(listener: ErrorListener): void {
    this.errorListeners = this.errorListeners.filter(l => l !== listener);
  }

  private emitError(type: 'telegram' | 'restapi' | 'general', message: string): void {
    const errorEvent: ErrorEvent = {
      type,
      message,
      timestamp: new Date().toISOString(),
    };
    
    this.errorListeners.forEach(listener => {
      try {
        listener(errorEvent);
      } catch (error) {
        console.error('Error in error listener:', error);
      }
    });
  }

  public async isConfigurationValid(): Promise<boolean> {
    try {
      await this.loadConfig();
      return this.isConfigurationValidSync();
    } catch (error) {
      console.error('Error checking configuration validity:', error);
      return false;
    }
  }

  private isConfigurationValidSync(): boolean {
    if (!this.config) {
      return false;
    }

    // Check if REST API is properly configured
    const restApiValid = Boolean(this.config.restApiEnabled && 
                        this.config.restApiUrl && 
                        this.config.restApiUrl.trim() !== '');

    // Check if Telegram is properly configured
    const telegramValid = Boolean(this.config.telegramEnabled && 
                         this.config.telegramBotToken && 
                         this.config.telegramBotToken.trim() !== '' &&
                         this.config.telegramChatId && 
                         this.config.telegramChatId.trim() !== '');

    // At least one forwarding method must be valid
    return restApiValid || telegramValid;
  }

  private async loadConfig(): Promise<void> {
    try {
      const savedConfig = await AsyncStorage.getItem('smsForwarderConfig');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        this.config = {
          restApiEnabled: Boolean(parsedConfig.restApiEnabled),
          restApiUrl: String(parsedConfig.restApiUrl || ''),
          restApiHeaders: String(parsedConfig.restApiHeaders || '{"Content-Type": "application/json"}'),
          telegramEnabled: Boolean(parsedConfig.telegramEnabled),
          telegramBotToken: String(parsedConfig.telegramBotToken || ''),
          telegramChatId: String(parsedConfig.telegramChatId || ''),
        };
      } else {
        this.config = {
          restApiEnabled: false,
          restApiUrl: '',
          restApiHeaders: '{"Content-Type": "application/json"}',
          telegramEnabled: false,
          telegramBotToken: '',
          telegramChatId: '',
        };
      }
    } catch (error) {
      console.error('Error loading config:', error);
      throw error;
    }
  }

  public async forwardSMS(sms: SMSMessage): Promise<void> {
    if (!this.isRunning || !this.config) {
      console.log('Service not running or config not loaded');
      return;
    }

    try {
      const promises: Promise<void>[] = [];

      // Forward to REST API if enabled
      if (this.config.restApiEnabled && this.config.restApiUrl) {
        promises.push(this.forwardToRestAPI(sms));
      }

      // Forward to Telegram if enabled
      if (this.config.telegramEnabled && this.config.telegramBotToken) {
        promises.push(this.forwardToTelegram(sms));
      }

      // Execute all forwarding operations in parallel
      await Promise.allSettled(promises);

      // Increment SMS count
      await this.incrementSMSCount();
    } catch (error) {
      // Silently handle errors - don't log to console to avoid UI error messages
    }
  }

  private async forwardToRestAPI(sms: SMSMessage): Promise<void> {
    if (!this.config) return;

    try {
      const headers = JSON.parse(this.config.restApiHeaders);
      const payload = {
        message: sms.body,
        sender: sms.address,
        timestamp: sms.date,
        dateSent: sms.dateSent,
        receivedAt: new Date().toISOString(),
      };

      const response = await fetch(this.config.restApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`REST API request failed: ${response.status}`);
      }

      console.log('SMS forwarded to REST API successfully');
    } catch (error) {
      // Emit error event instead of throwing
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emitError('restapi', `Error forwarding to REST API: ${errorMessage}`);
    }
  }

  private async forwardToTelegram(sms: SMSMessage): Promise<void> {
    if (!this.config) return;

    try {
      const message = `📱 *New SMS Received*\n\n` +
        `📞 *From:* ${sms.address}\n` +
        `📅 *Date:* ${new Date(parseInt(sms.date)).toLocaleString()}\n` +
        `💬 *Message:*\n${sms.body}`;

      const response = await fetch(
        `https://api.telegram.org/bot${this.config.telegramBotToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: this.config.telegramChatId,
            text: message,
            parse_mode: 'Markdown',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Telegram API request failed: ${errorData.description || response.status}`);
      }

      console.log('SMS forwarded to Telegram successfully');
    } catch (error) {
      // Emit error event instead of throwing
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emitError('telegram', `Error forwarding to Telegram: ${errorMessage}`);
    }
  }

  private async incrementSMSCount(): Promise<void> {
    try {
      const currentCount = await AsyncStorage.getItem('smsForwardedCount');
      const newCount = (parseInt(currentCount || '0') + 1).toString();
      await AsyncStorage.setItem('smsForwardedCount', newCount);
    } catch (error) {
      console.error('Error incrementing SMS count:', error);
    }
  }

  public async getSMSCount(): Promise<number> {
    try {
      const count = await AsyncStorage.getItem('smsForwardedCount');
      return parseInt(count || '0');
    } catch (error) {
      console.error('Error getting SMS count:', error);
      return 0;
    }
  }
}

export default SMSForwarderService;

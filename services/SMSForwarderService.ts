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
  restApiMethod: string;
  restApiHeaders: string;
  telegramEnabled: boolean;
  telegramBotToken: string;
}

class SMSForwarderService {
  private static instance: SMSForwarderService;
  private isRunning: boolean = false;
  private config: ConfigData | null = null;

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

  private async loadConfig(): Promise<void> {
    try {
      const savedConfig = await AsyncStorage.getItem('smsForwarderConfig');
      if (savedConfig) {
        this.config = JSON.parse(savedConfig);
      } else {
        this.config = {
          restApiEnabled: false,
          restApiUrl: '',
          restApiMethod: 'POST',
          restApiHeaders: '{"Content-Type": "application/json"}',
          telegramEnabled: false,
          telegramBotToken: '',
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
      console.error('Error forwarding SMS:', error);
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
        method: this.config.restApiMethod,
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`REST API request failed: ${response.status}`);
      }

      console.log('SMS forwarded to REST API successfully');
    } catch (error) {
      console.error('Error forwarding to REST API:', error);
      throw error;
    }
  }

  private async forwardToTelegram(sms: SMSMessage): Promise<void> {
    if (!this.config) return;

    try {
      // Since we don't have a chat ID, we'll just log the SMS data
      // In a real implementation, you might want to use Telegram webhooks
      // or store the SMS data for later retrieval
      const message = `📱 *New SMS Received*\n\n` +
        `📞 *From:* ${sms.address}\n` +
        `📅 *Date:* ${new Date(parseInt(sms.date)).toLocaleString()}\n` +
        `💬 *Message:*\n${sms.body}`;

      console.log('SMS data for Telegram:', {
        botToken: this.config.telegramBotToken,
        message: message,
        smsData: sms
      });

      // For now, we'll just log that we would have sent to Telegram
      console.log('SMS forwarded to Telegram (logged only - no chat ID configured)');
    } catch (error) {
      console.error('Error forwarding to Telegram:', error);
      throw error;
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

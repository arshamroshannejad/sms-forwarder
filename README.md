# SMS Forwarder

A React Native Android app that forwards incoming SMS messages to REST APIs or Telegram bots.

## Features

- **Home Page**: Start/stop SMS forwarding service with real-time status
- **Configuration Page**: Set up REST API and Telegram bot forwarding
- **REST API Forwarding**: Send SMS data to any REST endpoint
- **Telegram Bot Integration**: Forward SMS to Telegram chats
- **Real-time Status**: Track service status and SMS count
- **Test Functions**: Test your API and Telegram configurations

## Screenshots

The app includes:
- Clean, modern UI with status indicators
- Easy-to-use configuration forms
- Real-time service status monitoring
- Test buttons for API and Telegram validation

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sms-forwarder
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on Android:
```bash
npm run android
```

## Configuration

### REST API Configuration

1. Go to Configuration page
2. Enable REST API toggle
3. Enter your API URL (e.g., `https://your-api.com/sms`)
4. Select HTTP method (GET, POST, PUT, PATCH)
5. Configure headers in JSON format:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer your-token"
}
```
6. Test the configuration using the "Test REST API" button

### Telegram Bot Configuration

1. Create a Telegram bot using [@BotFather](https://t.me/botfather)
2. Get your bot token
3. Get your chat ID (you can use [@userinfobot](https://t.me/userinfobot))
4. Enable Telegram toggle in Configuration
5. Enter bot token and chat ID
6. Test using the "Test Telegram" button

## SMS Data Format

When SMS is forwarded, the following data structure is sent:

### REST API Payload
```json
{
  "message": "SMS content",
  "sender": "+1234567890",
  "timestamp": "1640995200000",
  "dateSent": "1640995200000",
  "receivedAt": "2024-01-01T12:00:00.000Z"
}
```

### Telegram Message Format
```
📱 *New SMS Received*

📞 *From:* +1234567890
📅 *Date:* 1/1/2024, 12:00:00 PM
💬 *Message:*
SMS content here
```

## Permissions

The app requires the following Android permissions:
- `RECEIVE_SMS`: To receive incoming SMS
- `READ_SMS`: To read SMS content
- `INTERNET`: To send data to APIs
- `ACCESS_NETWORK_STATE`: To check network connectivity
- `WAKE_LOCK`: To keep service running
- `FOREGROUND_SERVICE`: To run background service

## Development Notes

### SMS Listener Implementation

The app currently uses a mock SMS listener for development/testing. To implement real SMS listening:

1. Install a proper SMS listener library:
```bash
npm install react-native-sms-listener
```

2. Uncomment the real implementation in `hooks/useSMSListener.ts`
3. Comment out the mock implementation

### Testing

The mock SMS listener generates test SMS every 30 seconds when the service is running. This allows you to test the forwarding functionality without receiving actual SMS.

## Troubleshooting

### Service Not Starting
- Check that you have granted SMS permissions
- Verify your configuration is saved
- Check the console for error messages

### API Forwarding Not Working
- Test your API endpoint using the test button
- Verify your headers format (must be valid JSON)
- Check network connectivity

### Telegram Not Working
- Verify bot token is correct
- Ensure chat ID is valid
- Test using the test button
- Check that the bot is not blocked

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the console logs
3. Create an issue on GitHub
4. Provide detailed error information and steps to reproduce

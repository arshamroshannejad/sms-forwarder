import { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface SplashScreenProps {
  onAnimationFinish: () => void;
}

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onAnimationFinish }: SplashScreenProps) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start animations
    const startAnimations = () => {
      // Parallel animations
      Animated.parallel([
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        // Scale up
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        // Slide up
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        // Logo rotation
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation (delayed)
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 2 }
        ).start();
      }, 500);

      // Finish animation after 2.5 seconds
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          onAnimationFinish();
        });
      }, 2500);
    };

    startAnimations();
  }, [fadeAnim, scaleAnim, slideAnim, logoRotateAnim, pulseAnim, onAnimationFinish]);

  const logoRotation = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: '#f8f9fa' }]}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f8f9fa" 
      />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
        ]}
      >
        {/* Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { rotate: logoRotation },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          <View style={[styles.logoCircle, { backgroundColor: '#007bff' }]}>
            <Text style={styles.logoText}>📱</Text>
          </View>
        </Animated.View>

        {/* App Title */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={[styles.title, { color: '#333' }]}>
            SMS Forwarder
          </Text>
          <Text style={[styles.subtitle, { color: '#666' }]}>
            Forward SMS to API or Telegram
          </Text>
        </Animated.View>

        {/* Loading Dots */}
        <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
          <View style={[styles.dot, { backgroundColor: '#007bff' }]} />
          <View style={[styles.dot, { backgroundColor: '#007bff' }]} />
          <View style={[styles.dot, { backgroundColor: '#007bff' }]} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
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
    marginBottom: 40,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007bff',
    marginHorizontal: 4,
  },
});

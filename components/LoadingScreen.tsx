import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Easing, useWindowDimensions } from 'react-native';
import { HeartPulse, Stethoscope, ShieldCheck } from 'lucide-react-native';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Conectando con Saku Vet...' }: LoadingScreenProps) {
  const { width } = useWindowDimensions();
  const pulseValue = useRef(new Animated.Value(1)).current;
  const lineTranslate = useRef(new Animated.Value(-100)).current;
  const opacityValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Medical pulse animation (Heartbeat effect)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.15,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1.08,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Scanning line animation
    Animated.loop(
      Animated.timing(lineTranslate, {
        toValue: 100,
        duration: 1500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    ).start();

    // Opacity pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Subtle Gradient Mask */}
      <View style={styles.backgroundDecoration}>
        <View style={[styles.gridLine, { top: '20%' }]} />
        <View style={[styles.gridLine, { top: '40%' }]} />
        <View style={[styles.gridLine, { top: '60%' }]} />
        <View style={[styles.gridLine, { top: '80%' }]} />
        <View style={[styles.gridLineVertical, { left: '20%' }]} />
        <View style={[styles.gridLineVertical, { left: '40%' }]} />
        <View style={[styles.gridLineVertical, { left: '60%' }]} />
        <View style={[styles.gridLineVertical, { left: '80%' }]} />
      </View>

      <View style={styles.content}>
        {/* Animated Medical Pulse Icon */}
        <Animated.View 
          style={[
            styles.mainIconContainer, 
            { transform: [{ scale: pulseValue }] }
          ]}
        >
          <View style={styles.iconRing}>
            <HeartPulse size={56} color="#F47321" strokeWidth={1.5} />
            
            {/* Scanning Effect Overlay */}
            <Animated.View 
              style={[
                styles.scanLine, 
                { transform: [{ translateY: lineTranslate }] }
              ]} 
            />
          </View>
        </Animated.View>

        {/* Brand Text */}
        <View style={styles.textWrapper}>
          <Text style={styles.brand}>SAKU<Text style={{color: '#F47321'}}>VET</Text></Text>
          <Animated.Text style={[styles.status, { opacity: opacityValue }]}>
            {message}
          </Animated.Text>
        </View>

        {/* Minimalist Tech indicators */}
        <View style={styles.indicatorContainer}>
          <View style={styles.techItem}>
            <Stethoscope size={14} color="#9CA3AF" />
            <Text style={styles.techText}>VITAL_SCAN</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.techItem}>
            <ShieldCheck size={14} color="#9CA3AF" />
            <Text style={styles.techText}>SECURE_LINK</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Deep modern slate (Premium Dark)
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundDecoration: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#FFFFFF',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    alignItems: 'center',
  },
  mainIconContainer: {
    marginBottom: 40,
  },
  iconRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(244, 115, 33, 0.3)',
    backgroundColor: 'rgba(244, 115, 33, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    width: '150%',
    height: 2,
    backgroundColor: '#F47321',
    shadowColor: '#F47321',
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  textWrapper: {
    alignItems: 'center',
  },
  brand: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: 12,
  },
  status: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 50,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  techItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  techText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '800',
    letterSpacing: 1,
  },
  separator: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 15,
  },
});

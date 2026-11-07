import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors } from './theme';

const LEFT = require('../assets/intro-left.png');
const RIGHT = require('../assets/intro-right.png');
const BOLT = require('../assets/intro-bolt.png');
const BG = require('../assets/intro-bg.png');

// Animation d'ouverture : ta moitié (vert) et celle du rival (corail) s'entrechoquent,
// un éclair jaillit, puis le nom de l'app (Kontra) apparaît. Environ 2 secondes.
export default function Intro({ onDone }) {
  const { width } = useWindowDimensions();
  const size = Math.min(width * 0.72, 320);

  const slide = useRef(new Animated.Value(0)).current; // 0 = écartés, 1 = au centre
  const flash = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const word = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const bgIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.timing(bgIn, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 1, duration: 520, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.parallel([
        Animated.sequence([
          Animated.timing(flash, { toValue: 1, duration: 90, useNativeDriver: true }),
          Animated.timing(flash, { toValue: 0, duration: 380, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.08, duration: 110, useNativeDriver: true }),
          Animated.spring(pulse, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
        ]),
        Animated.timing(word, { toValue: 1, duration: 420, delay: 120, useNativeDriver: true }),
      ]),
      Animated.delay(650),
      Animated.timing(fade, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]);
    anim.start(({ finished }) => finished && onDone());
    return () => anim.stop();
  }, []);

  const gap = width * 0.6;
  const leftX = slide.interpolate({ inputRange: [0, 1], outputRange: [-gap, 0] });
  const rightX = slide.interpolate({ inputRange: [0, 1], outputRange: [gap, 0] });
  const tilt = slide.interpolate({ inputRange: [0, 1], outputRange: ['-14deg', '0deg'] });
  const tiltR = slide.interpolate({ inputRange: [0, 1], outputRange: ['14deg', '0deg'] });
  const wordY = word.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: fade }]} pointerEvents="none">
      <Animated.Image source={BG} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: bgIn }]} />
      <Animated.View style={{ width: size, height: size, transform: [{ scale: pulse }] }}>
        <Animated.Image source={LEFT} style={[styles.img, { transform: [{ translateX: leftX }, { rotate: tilt }] }]} />
        <Animated.Image source={RIGHT} style={[styles.img, { transform: [{ translateX: rightX }, { rotate: tiltR }] }]} />
        <Animated.Image source={BOLT} style={[styles.img, { opacity: flash, transform: [{ scale: 1.15 }] }]} />
      </Animated.View>
      <Animated.View style={{ alignItems: 'center', opacity: word, transform: [{ translateY: wordY }] }}>
        <Text style={styles.word}>
          KON<Text style={{ color: colors.rival }}>TRA</Text>
        </Text>
        <Text style={styles.tag}>Ton rival IA. Chaque jour.</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  img: { position: 'absolute', width: '100%', height: '100%' },
  word: { color: '#F2F3F5', fontSize: 46, fontWeight: '900', letterSpacing: 6, marginTop: 12 },
  tag: { color: colors.muted, fontSize: 16, fontWeight: '600', marginTop: 6 },
});

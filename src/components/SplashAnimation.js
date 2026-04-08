import { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, Animated, Dimensions, Image, StatusBar, Platform,
} from "react-native";
import { C } from "../theme/colors";
import { F } from "../theme/fonts";

const { width, height } = Dimensions.get("window");
const TOP = Platform.OS === "ios" ? 56 : 44;

// Target position: home screen logo (top-left)
const TARGET_X = -(width / 2) + 20 + 19; // left: 20px + half of 38px
const TARGET_Y = -(height / 2) + TOP + 19; // top padding + half of 38px
const TARGET_SCALE = 38 / 120; // from 120px to 38px

export default function SplashAnimation({ onFinish }) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const logoTranslateX = useRef(new Animated.Value(0)).current;

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;

  const textFadeOut = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(1)).current;

  const pulseScale = useRef(new Animated.Value(0)).current;
  const pulseOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Phase 1: Logo fade in + scale up (0-600ms)
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 100 }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Phase 2: Pulse ring (300ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(pulseScale, { toValue: 2.5, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 300);

    // Phase 3: Title + tagline (600ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(titleY, { toValue: 0, useNativeDriver: true, damping: 15, stiffness: 120 }),
      ]).start();
    }, 600);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(bottomOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }, 900);

    // Phase 4: Text fades out (1600ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textFadeOut, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(taglineOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(bottomOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }, 1600);

    // Phase 5: Logo flies to top-left + shrinks (2000ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoTranslateX, { toValue: TARGET_X, duration: 700, useNativeDriver: true }),
        Animated.timing(logoTranslateY, { toValue: TARGET_Y, duration: 700, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: TARGET_SCALE, duration: 700, useNativeDriver: true }),
      ]).start();
    }, 2000);

    // Phase 6: Background fades out AFTER logo lands — logo stays visible briefly
    setTimeout(() => {
      Animated.timing(bgOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        onFinish();
      });
    }, 2900);
  }, []);

  return (
    <Animated.View style={[s.root, { opacity: bgOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Background decorative */}
      <View style={s.bgCircle1} />
      <View style={s.bgCircle2} />
      <View style={s.bgCircle3} />

      {/* Pulse ring */}
      <Animated.View style={[s.pulse, {
        transform: [{ scale: pulseScale }],
        opacity: pulseOpacity,
      }]} />

      {/* Logo — animates from center to top-left */}
      <Animated.View style={[s.logoWrap, {
        opacity: logoOpacity,
        transform: [
          { translateX: logoTranslateX },
          { translateY: logoTranslateY },
          { scale: logoScale },
        ],
      }]}>
        <Image source={require("../../assets/logo.png")} style={s.logo} resizeMode="contain" />
      </Animated.View>

      {/* Title */}
      <Animated.View style={[s.textWrap, { opacity: Animated.multiply(titleOpacity, textFadeOut), transform: [{ translateY: titleY }] }]}>
        <Text style={s.title}>
          <Text style={s.titleRG}>RG</Text> Medlink
        </Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[s.tagline, { opacity: taglineOpacity }]}>
        Your Health, Delivered
      </Animated.Text>

      {/* Bottom */}
      <Animated.View style={[s.bottom, { opacity: bottomOpacity }]}>
        <View style={s.trustRow}>
          <View style={s.trustDot} />
          <Text style={s.trustText}>100% Genuine Medicines</Text>
          <View style={s.trustDot} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },

  bgCircle1: {
    position: "absolute", width: 300, height: 300, borderRadius: 150,
    backgroundColor: "rgba(127,14,37,0.08)", top: -80, right: -80,
  },
  bgCircle2: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(127,14,37,0.06)", bottom: -50, left: -50,
  },
  bgCircle3: {
    position: "absolute", width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(127,14,37,0.04)", top: height * 0.3, left: 30,
  },

  pulse: {
    position: "absolute",
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: C.brand,
  },

  logoWrap: {
    width: 120, height: 120, borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: C.brand, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
    overflow: "hidden",
  },
  logo: { width: 110, height: 110 },

  textWrap: { marginTop: 20 },
  title: {
    fontSize: 32, fontFamily: F.extraBold, color: "#fff",
    letterSpacing: 0.5, textAlign: "center",
  },
  titleRG: { color: C.brand },

  tagline: {
    fontSize: 14, fontFamily: F.medium,
    color: "rgba(255,255,255,0.45)",
    marginTop: 8, letterSpacing: 2,
  },

  bottom: {
    position: "absolute", bottom: Platform.OS === "ios" ? 50 : 36,
  },
  trustRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  trustDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  trustText: {
    fontSize: 12, fontFamily: F.medium,
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 1,
  },
});

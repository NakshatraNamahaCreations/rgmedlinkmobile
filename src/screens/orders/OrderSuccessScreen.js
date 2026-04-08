import React, { useEffect, useRef, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, Animated, StatusBar, Alert, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { BASE_URL } from "../../api";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";

const { width } = Dimensions.get("window");

export default function OrderSuccessScreen({ navigation, route }) {
  const fallbackId = useMemo(() => `RGM${Math.floor(100000 + Math.random() * 900000)}`, []);
  const total   = route.params?.total || 0;
  const method  = route.params?.method || "UPI";
  const orderId = route.params?.orderId || fallbackId;

  // Animations
  const bgScale = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkRotate = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(0.6)).current;
  const ring2Scale = useRef(new Animated.Value(0)).current;
  const ring2Opacity = useRef(new Animated.Value(0.4)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(30)).current;
  const amountFade = useRef(new Animated.Value(0)).current;
  const amountScale = useRef(new Animated.Value(0.5)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;
  const footerFade = useRef(new Animated.Value(0)).current;
  const footerSlide = useRef(new Animated.Value(30)).current;

  // Confetti
  const confetti = useRef(
    Array.from({ length: 12 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
    }))
  ).current;

  // Floating particles
  const particle1Y = useRef(new Animated.Value(0)).current;
  const particle2Y = useRef(new Animated.Value(0)).current;
  const particle3X = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({ headerShown: false, gestureEnabled: false });

    // Phase 1: Background circle expands (0ms)
    Animated.spring(bgScale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 80 }).start();

    // Phase 2: Checkmark bounces in with rotation (200ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 120 }),
        Animated.timing(checkRotate, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 200);

    // Phase 3: Pulse rings (400ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(ringScale, { toValue: 3, duration: 1000, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(ring2Scale, { toValue: 2.5, duration: 800, useNativeDriver: true }),
          Animated.timing(ring2Opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
      ]).start();
    }, 400);

    // Phase 4: Confetti burst (600ms)
    setTimeout(() => {
      confetti.forEach((c, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const dist = 80 + Math.random() * 60;
        Animated.parallel([
          Animated.sequence([
            Animated.timing(c.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.timing(c.opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
          ]),
          Animated.timing(c.x, { toValue: Math.cos(angle) * dist, duration: 1000, useNativeDriver: true }),
          Animated.timing(c.y, { toValue: Math.sin(angle) * dist, duration: 1000, useNativeDriver: true }),
          Animated.timing(c.rotate, { toValue: 3, duration: 1000, useNativeDriver: true }),
        ]).start();
      });
    }, 600);

    // Phase 5: Title + amount (800ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(titleSlide, { toValue: 0, useNativeDriver: true, damping: 14, stiffness: 100 }),
      ]).start();
    }, 800);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(amountFade, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(amountScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 100 }),
      ]).start();
    }, 1100);

    // Phase 6: Card slides up (1400ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(cardSlide, { toValue: 0, useNativeDriver: true, damping: 16, stiffness: 100 }),
      ]).start();
    }, 1400);

    // Phase 7: Footer (1800ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(footerFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(footerSlide, { toValue: 0, useNativeDriver: true, damping: 14, stiffness: 100 }),
      ]).start();
    }, 1800);

    // Continuous floating particles
    const float = (anim, to, dur) => Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: to, duration: dur, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -to, duration: dur, useNativeDriver: true }),
    ]));
    const f1 = float(particle1Y, -8, 2000);
    const f2 = float(particle2Y, 10, 2500);
    const f3 = float(particle3X, 6, 3000);
    f1.start(); f2.start(); f3.start();
    return () => { f1.stop(); f2.stop(); f3.stop(); };
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const CONFETTI_COLORS = ["#F87171", "#FBBF24", "#34D399", "#60A5FA", "#A78BFA", "#F472B6",
                           "#FB923C", "#2DD4BF", "#818CF8", "#E879F9", "#FCD34D", "#4ADE80"];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#036C33" />

      {/* ── Green top section ── */}
      <View style={s.topSection}>
        {/* Floating particles */}
        <Animated.View style={[s.particle, s.p1, { transform: [{ translateY: particle1Y }] }]} />
        <Animated.View style={[s.particle, s.p2, { transform: [{ translateY: particle2Y }] }]} />
        <Animated.View style={[s.particle, s.p3, { transform: [{ translateX: particle3X }] }]} />

        {/* Background expanding circle */}
        <Animated.View style={[s.bgCircle, { transform: [{ scale: bgScale }] }]} />

        {/* Pulse rings */}
        <Animated.View style={[s.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
        <Animated.View style={[s.ring, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />

        {/* Confetti */}
        {confetti.map((c, i) => (
          <Animated.View key={i} style={[s.confettiDot, {
            backgroundColor: CONFETTI_COLORS[i],
            width: 6 + (i % 3) * 3,
            height: 6 + (i % 3) * 3,
            borderRadius: i % 2 === 0 ? 10 : 2,
            opacity: c.opacity,
            transform: [
              { translateX: c.x },
              { translateY: c.y },
              { rotate: c.rotate.interpolate({ inputRange: [0, 3], outputRange: ["0deg", "720deg"] }) },
            ],
          }]} />
        ))}

        {/* Checkmark */}
        <Animated.View style={[s.checkOuter, {
          transform: [
            { scale: checkScale },
            { rotate: checkRotate.interpolate({ inputRange: [0, 1], outputRange: ["-180deg", "0deg"] }) },
          ],
        }]}>
          <View style={s.checkInner}>
            <Ionicons name="checkmark-sharp" size={44} color="#036C33" />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text style={[s.title, { opacity: titleFade, transform: [{ translateY: titleSlide }] }]}>
          Thank You!
        </Animated.Text>
        <Animated.Text style={[s.subtitle, { opacity: titleFade }]}>
          Payment Successful
        </Animated.Text>

        {/* Amount */}
        <Animated.View style={[s.amountWrap, { opacity: amountFade, transform: [{ scale: amountScale }] }]}>
          <Text style={s.amount}>₹{typeof total === "number" ? total.toFixed(2) : total}</Text>
          <Text style={s.amountMethod}>via {method}</Text>
        </Animated.View>
      </View>

      {/* ── Order card ── */}
      <Animated.View style={[s.card, { opacity: cardFade, transform: [{ translateY: cardSlide }] }]}>
        <View style={s.cardRow}>
          <View style={s.cardIconWrap}>
            <Ionicons name="receipt" size={18} color={C.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Order ID</Text>
            <Text style={s.cardVal}>#{orderId}</Text>
          </View>
          <View style={s.statusPill}>
            <View style={s.statusDot} />
            <Text style={s.statusText}>Confirmed</Text>
          </View>
        </View>
        <View style={s.cardDivider} />
        <View style={s.cardDetails}>
          <View style={s.detailItem}>
            <Ionicons name="calendar-outline" size={14} color={C.ink4} />
            <Text style={s.detailText}>{dateStr}</Text>
          </View>
          <View style={s.detailItem}>
            <Ionicons name="time-outline" size={14} color={C.ink4} />
            <Text style={s.detailText}>{timeStr}</Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Footer ── */}
      <Animated.View style={[s.footer, { opacity: footerFade, transform: [{ translateY: footerSlide }] }]}>
        <TouchableOpacity style={s.trackBtn} activeOpacity={0.85} onPress={() => {
          navigation.getParent()?.navigate("OrdersTab", { screen: "OrdersList" });
          navigation.popToTop?.();
        }}>
          <Ionicons name="cube-outline" size={18} color="#fff" />
          <Text style={s.trackTxt}>Track Order</Text>
        </TouchableOpacity>

        <View style={s.footerRow}>
          <TouchableOpacity style={s.invoiceBtn} activeOpacity={0.8} onPress={async () => {
            try {
              const oid = route.params?.orderDbId;
              if (!oid) { Alert.alert("Invoice", `Order: ${orderId}\nAmount: ₹${total}`); return; }
              const fileUri = FileSystem.documentDirectory + `invoice-${orderId}.pdf`;
              const { uri } = await FileSystem.downloadAsync(`${BASE_URL}/orders/${oid}/invoice-pdf`, fileUri);
              if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
            } catch { Alert.alert("Error", "Could not download invoice."); }
          }}>
            <Ionicons name="download-outline" size={16} color={C.brand} />
            <Text style={s.invoiceTxt}>Invoice</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.homeBtn} activeOpacity={0.8} onPress={() => {
            navigation.getParent()?.navigate("HomeTab", { screen: "HomeScreen" });
            navigation.popToTop?.();
          }}>
            <Ionicons name="home-outline" size={16} color={C.ink3} />
            <Text style={s.homeTxt}>Home</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },

  // Top section
  topSection: {
    backgroundColor: "#036C33", alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 80 : 60,
    paddingBottom: 40, overflow: "hidden",
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },

  // Floating particles
  particle: { position: "absolute", borderRadius: 20, backgroundColor: "rgba(255,255,255,0.08)" },
  p1: { width: 60, height: 60, top: 30, right: 20 },
  p2: { width: 40, height: 40, bottom: 40, left: 30 },
  p3: { width: 30, height: 30, top: 80, left: 60 },

  bgCircle: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  ring: {
    position: "absolute", width: 80, height: 80, borderRadius: 40,
    borderWidth: 3, borderColor: "rgba(255,255,255,0.3)",
  },

  confettiDot: { position: "absolute" },

  checkOuter: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center", alignItems: "center", marginBottom: 20,
  },
  checkInner: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },

  title: { fontSize: 28, fontFamily: F.extraBold, color: "#fff" },
  subtitle: { fontSize: 15, fontFamily: F.medium, color: "rgba(255,255,255,0.7)", marginTop: 4 },

  amountWrap: { marginTop: 16, alignItems: "center" },
  amount: { fontSize: 36, fontFamily: F.extraBold, color: "#fff" },
  amountMethod: { fontSize: 13, fontFamily: F.regular, color: "rgba(255,255,255,0.5)", marginTop: 2 },

  // Card
  card: {
    marginHorizontal: 20, marginTop: -20,
    backgroundColor: "#fff", borderRadius: 20, padding: 18,
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 8,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#ECFDF5",
    justifyContent: "center", alignItems: "center",
  },
  cardLabel: { fontSize: 12, fontFamily: F.regular, color: C.ink4 },
  cardVal: { fontSize: 15, fontFamily: F.bold, color: C.ink },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#ECFDF5", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  statusText: { fontSize: 12, fontFamily: F.bold, color: C.green },
  cardDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 14 },
  cardDetails: { flexDirection: "row", gap: 20 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 13, fontFamily: F.medium, color: C.ink3 },

  // Footer
  footer: {
    flex: 1, justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    gap: 10,
  },
  trackBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.brand, borderRadius: 16, paddingVertical: 17,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 7,
  },
  trackTxt: { fontSize: 16, fontFamily: F.bold, color: "#fff" },
  footerRow: { flexDirection: "row", gap: 10 },
  invoiceBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.brand + "30", backgroundColor: C.brandLt,
  },
  invoiceTxt: { fontSize: 14, fontFamily: F.bold, color: C.brand },
  homeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: "#E2E8F0",
  },
  homeTxt: { fontSize: 14, fontFamily: F.semiBold, color: C.ink3 },
});

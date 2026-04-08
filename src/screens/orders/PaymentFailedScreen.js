import React, { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Platform, Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";

export default function PaymentFailedScreen({ navigation, route }) {
  const total  = route.params?.total || 0;
  const reason = route.params?.reason || "Transaction declined by bank. Please try again or use a different payment method.";

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({ headerShown: false, gestureEnabled: false });
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 150 }),
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>

        {/* ── Animated X ── */}
        <Animated.View style={[s.circleOuter, { transform: [{ scale: scaleAnim }, { translateX: shakeAnim }] }]}>
          <View style={s.circleInner}>
            <Ionicons name="close" size={44} color="#fff" />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: "center", width: "100%" }}>
          <Text style={s.title}>Payment Failed</Text>
          <Text style={s.sub}>{reason}</Text>

          {/* ── Amount card ── */}
          <View style={s.card}>
            <Text style={s.cardLabel}>Amount</Text>
            <Text style={s.cardAmount}>₹{total.toFixed(2)}</Text>
            <View style={s.statusBadge}>
              <Ionicons name="alert-circle" size={14} color={C.red} />
              <Text style={s.statusTxt}>Transaction Failed</Text>
            </View>
          </View>

          {/* ── Help tips ── */}
          <View style={s.tipsCard}>
            <Text style={s.tipsTitle}>What you can do</Text>
            <View style={s.tipRow}>
              <Ionicons name="refresh-outline" size={16} color={C.ink3} />
              <Text style={s.tipTxt}>Try again with the same payment method</Text>
            </View>
            <View style={s.tipRow}>
              <Ionicons name="card-outline" size={16} color={C.ink3} />
              <Text style={s.tipTxt}>Switch to a different payment option</Text>
            </View>
            <View style={s.tipRow}>
              <Ionicons name="call-outline" size={16} color={C.ink3} />
              <Text style={s.tipTxt}>Contact your bank if the issue persists</Text>
            </View>
          </View>

          {/* ── Note ── */}
          <View style={s.noteRow}>
            <Ionicons name="information-circle-outline" size={15} color={C.ink4} />
            <Text style={s.noteTxt}>No money has been deducted from your account</Text>
          </View>
        </Animated.View>
      </View>

      {/* ── Footer ── */}
      <Animated.View style={[s.footer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={s.retryBtn}
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={s.retryTxt}>Retry Payment</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.homeBtn}
          activeOpacity={0.8}
          onPress={() => {
            navigation.getParent()?.navigate("HomeTab", { screen: "HomeScreen" });
            navigation.popToTop?.();
          }}
        >
          <Text style={s.homeTxt}>Back to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },

  /* X animation */
  circleOuter: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#FEF2F2",
    justifyContent: "center", alignItems: "center", marginBottom: 24,
  },
  circleInner: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.red,
    justifyContent: "center", alignItems: "center",
  },

  title: { fontSize: 22, fontFamily: F.extraBold, color: C.ink, marginBottom: 6 },
  sub: {
    fontSize: 14, fontFamily: F.regular, color: C.ink4,
    textAlign: "center", lineHeight: 22, marginBottom: 24,
    paddingHorizontal: 10,
  },

  /* Amount card */
  card: {
    width: "100%", alignItems: "center",
    backgroundColor: "#FEF2F2", borderRadius: 16,
    padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: "#FECDD3",
  },
  cardLabel: { fontSize: 12, fontFamily: F.regular, color: C.ink4, marginBottom: 4 },
  cardAmount: { fontSize: 28, fontFamily: F.extraBold, color: C.red, marginBottom: 10 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#fff", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  statusTxt: { fontSize: 12, fontFamily: F.semiBold, color: C.red },

  /* Tips */
  tipsCard: {
    width: "100%", backgroundColor: "#F8FAFC",
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#F1F5F9",
    marginBottom: 14,
  },
  tipsTitle: { fontSize: 13, fontFamily: F.bold, color: C.ink, marginBottom: 12 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  tipTxt: { flex: 1, fontSize: 12, fontFamily: F.regular, color: C.ink3, lineHeight: 17 },

  /* Note */
  noteRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    justifyContent: "center",
  },
  noteTxt: { fontSize: 12, fontFamily: F.regular, color: C.ink4 },

  /* Footer */
  footer: {
    paddingHorizontal: 20, paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    backgroundColor: "#fff", gap: 10,
    borderTopWidth: 1, borderTopColor: "#F1F5F9",
  },
  retryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.brand, borderRadius: 14, paddingVertical: 17,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 7,
  },
  retryTxt: { fontSize: 16, fontFamily: F.bold, color: "#fff" },
  homeBtn: {
    alignItems: "center", paddingVertical: 14,
    borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 14,
  },
  homeTxt: { fontSize: 15, fontFamily: F.semiBold, color: C.ink3 },
});

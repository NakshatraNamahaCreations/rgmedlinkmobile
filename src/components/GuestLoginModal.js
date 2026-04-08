import React, { useRef, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, Animated, Pressable, Platform, KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { C } from "../theme/colors";
import { F } from "../theme/fonts";
import API from "../api";

export default function GuestLoginModal({ visible, onClose, onSuccess }) {
  const [phone, setPhone]     = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const slideY  = useRef(new Animated.Value(600)).current;
  const bgFade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setPhone(""); setError("");
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 }),
        Animated.timing(bgFade,  { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, { toValue: 600, duration: 280, useNativeDriver: true }),
        Animated.timing(bgFade,  { toValue: 0,   duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const sendOTP = async () => {
    if (!phone || phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await API.post("/otp/send", { phone });
    } catch (_) {}
    finally {
      setLoading(false);
      onSuccess?.(phone);   // caller handles OTP navigation
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none"
      onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.root}>
          {/* Backdrop */}
          <Animated.View style={[s.backdrop, { opacity: bgFade }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          </Animated.View>

          {/* Sheet */}
          <Animated.View style={[s.sheet, { transform: [{ translateY: slideY }] }]}>

            {/* ── Promo banner ── */}
            <LinearGradient
              colors={[C.accent, "#024D25", "#011F0F"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.promoBanner}
            >
              {/* Decorative circles */}
              <View style={s.bubble1} />
              <View style={s.bubble2} />

              {/* Close button */}
              <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.8}>
                <Ionicons name="close" size={16} color={C.ink3} />
              </TouchableOpacity>

              {/* ORDER NOW pill */}
              <View style={s.orderNowPill}>
                <Text style={s.orderNowTxt}>ORDER NOW</Text>
              </View>

              {/* Promo text */}
              <Text style={s.promoTitle}>Healthcare Made{"\n"}Easy.</Text>

              {/* Offer strip */}
              <View style={s.offerStrip}>
                <View style={s.offerLeft}>
                  <Text style={s.offerBig}>Get 10% OFF</Text>
                  <Text style={s.offerSub}>on your first order.{"\n"}Limited Time Offer.</Text>
                  <TouchableOpacity style={s.orderBtn} activeOpacity={0.85} onPress={() => { onSuccess?.(); onClose?.(); }}>
                    <Text style={s.orderBtnTxt}>ORDER NOW</Text>
                  </TouchableOpacity>
                </View>

                {/* Medicine icon cluster */}
                <View style={s.iconCluster}>
                  <View style={[s.pill, { backgroundColor: "#F59E0B", transform: [{ rotate: "-30deg" }] }]} />
                  <View style={[s.pill, { backgroundColor: "#FCD34D", width: 14, height: 30, transform: [{ rotate: "20deg" }] }]} />
                  <View style={[s.capsule, { backgroundColor: "#FEF3C7" }]} />
                  <Ionicons name="medical" size={22} color="rgba(255,255,255,0.3)"
                    style={{ position: "absolute", bottom: 4, right: 4 }} />
                </View>
              </View>
            </LinearGradient>

            {/* ── Register form ── */}
            <View style={s.form}>
              <Text style={s.formTitle}>Register to Avail the Offer</Text>

              {/* Phone input */}
              <View style={[s.inputRow, focused && s.inputFocused]}>
                <View style={s.prefix}>
                  <Text style={s.flag}>🇮🇳</Text>
                  <Text style={s.prefixTxt}>+91</Text>
                </View>
                <View style={s.inputDivider} />
                <TextInput
                  style={s.input}
                  placeholder="Your Mobile Number"
                  placeholderTextColor={C.ink4}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(t) => { setPhone(t.replace(/[^0-9]/g, "")); setError(""); }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
                {phone.length === 10 && (
                  <Ionicons name="checkmark-circle" size={20} color={C.accent} style={{ marginRight: 12 }} />
                )}
              </View>

              {error ? <Text style={s.errorTxt}>{error}</Text> : null}

              {/* Send OTP button */}
              <TouchableOpacity
                style={[s.otpBtn, loading && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={sendOTP}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.otpBtnTxt}>Send OTP</Text>
                }
              </TouchableOpacity>

              {/* Privacy note */}
              <Text style={s.privacy}>
                By continuing, you agree to our{" "}
                <Text style={s.privacyLink}>Privacy Policy</Text>
              </Text>
            </View>

            <View style={{ height: Platform.OS === "ios" ? 20 : 8 }} />
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,5,15,0.65)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.18, shadowRadius: 28, elevation: 24,
  },

  /* ── Promo banner ── */
  promoBanner: {
    padding: 20,
    paddingBottom: 16,
    position: "relative",
    overflow: "hidden",
    minHeight: 180,
  },
  bubble1: {
    position: "absolute", width: 160, height: 160, borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.04)", top: -50, right: -40,
  },
  bubble2: {
    position: "absolute", width: 90, height: 90, borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.05)", bottom: -20, left: 30,
  },
  closeBtn: {
    position: "absolute", top: 14, right: 14, zIndex: 10,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  orderNowPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 10,
  },
  orderNowTxt: { fontSize: 10, fontFamily: F.bold, color: "#fff", letterSpacing: 1 },
  promoTitle: {
    fontSize: 22, fontFamily: F.extraBold, color: "#fff",
    lineHeight: 28, marginBottom: 16,
  },

  /* Offer strip */
  offerStrip: {
    flexDirection: "row", alignItems: "flex-end",
    backgroundColor: "#F59E0B",
    borderRadius: 14, padding: 14,
    overflow: "hidden",
  },
  offerLeft:  { flex: 1 },
  offerBig:   { fontSize: 14, fontFamily: F.extraBold, color: C.ink },
  offerSub:   { fontSize: 11, fontFamily: F.regular, color: C.ink2, marginTop: 2, lineHeight: 16 },
  orderBtn: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  orderBtnTxt: { fontSize: 11, fontFamily: F.bold, color: C.ink },

  /* Medicine icon cluster */
  iconCluster: {
    width: 70, height: 70, position: "relative",
    justifyContent: "center", alignItems: "center",
  },
  pill: {
    position: "absolute",
    width: 12, height: 36, borderRadius: 6,
    top: 6, right: 18,
  },
  capsule: {
    position: "absolute",
    width: 24, height: 44, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    top: 4, right: 6,
  },

  /* ── Form ── */
  form: { paddingHorizontal: 20, paddingTop: 20 },
  formTitle: {
    fontSize: 17, fontFamily: F.extraBold, color: C.ink, marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, height: 52, overflow: "hidden",
    marginBottom: 6,
  },
  inputFocused: { borderColor: C.brand },
  prefix: {
    flexDirection: "row", alignItems: "center",
    gap: 5, paddingHorizontal: 12,
  },
  flag:      { fontSize: 16 },
  prefixTxt: { fontSize: 14, fontFamily: F.bold, color: C.ink2 },
  inputDivider: { width: 1, height: 28, backgroundColor: C.border },
  input: {
    flex: 1, fontSize: 15, fontFamily: F.medium,
    color: C.ink, paddingHorizontal: 12, paddingVertical: 0,
  },
  errorTxt: { fontSize: 12, fontFamily: F.regular, color: C.red, marginBottom: 8 },

  otpBtn: {
    backgroundColor: C.brand, borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
    marginTop: 10, marginBottom: 12,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32, shadowRadius: 12, elevation: 7,
  },
  otpBtnTxt: { fontSize: 16, fontFamily: F.bold, color: "#fff" },

  privacy: { fontSize: 11, fontFamily: F.regular, color: C.ink4, textAlign: "center" },
  privacyLink: { fontFamily: F.semiBold, color: C.ink2, textDecorationLine: "underline" },
});

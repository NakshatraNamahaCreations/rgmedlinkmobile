import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, Animated, Pressable, Platform, KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../theme/colors";
import { F } from "../theme/fonts";
import API from "../api";

const AuthContext = createContext();

const OTP_LENGTH = 4;

/* ══════════════════════════════════════
   AUTH LOGIN MODAL — Phone + OTP in one sheet
══════════════════════════════════════ */
function AuthModal({ visible, onClose, onLoggedIn }) {
  const [step, setStep] = useState("phone"); // "phone" | "otp"
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);
  const otpRefs = useRef([]);
  const slideY = useRef(new Animated.Value(600)).current;
  const bgFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep("phone"); setPhone(""); setOtp(Array(OTP_LENGTH).fill("")); setError("");
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 }),
        Animated.timing(bgFade, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, { toValue: 600, duration: 280, useNativeDriver: true }),
        Animated.timing(bgFade, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  const sendOTP = async () => {
    if (!phone || phone.length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setError(""); setLoading(true);
    try {
      const res = await API.post("/otp/send", { phone });
      // DEV ONLY: Show OTP on screen — remove when SMS is integrated
      const devOtp = res.data?.otp;
      setLoading(false);
      setStep("otp");
      setTimer(30);
      if (devOtp) {
        setError(`DEV OTP: ${devOtp}`);
      }
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.message || "Failed to send OTP. Please try again.");
    }
  };

  const handleOtpChange = (text, idx) => {
    const val = text.replace(/[^0-9]/g, "");
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.focus();
    if (newOtp.every((d) => d) && idx === OTP_LENGTH - 1) verifyOTP(newOtp.join(""));
  };

  const handleOtpKey = (e, idx) => {
    if (e.nativeEvent.key === "Backspace" && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const verifyOTP = async (code) => {
    const otpCode = code || otp.join("");
    if (otpCode.length !== OTP_LENGTH) { setError("Enter all 4 digits"); return; }
    setError(""); setLoading(true);
    try {
      const res = await API.post("/otp/verify", { phone, otp: otpCode });
      // Store JWT token
      if (res.data.token) {
        await AsyncStorage.setItem("token", res.data.token);
      }
      const userData = {
        phone,
        _id: res.data.userId || res.data.data?.userId || phone,
        name: res.data.name || res.data.data?.name || "Patient",
      };
      onLoggedIn(userData);
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid OTP. Please try again.");
    }
    setLoading(false);
  };

  const resendOTP = async () => {
    try { await API.post("/otp/send", { phone }); } catch {}
    setTimer(30); setError(""); setOtp(Array(OTP_LENGTH).fill(""));
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={ms.root}>
          <Animated.View style={[ms.backdrop, { opacity: bgFade }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          </Animated.View>

          <Animated.View style={[ms.sheet, { transform: [{ translateY: slideY }] }]}>
            <View style={ms.pill} />

            {step === "phone" ? (
              <>
                <View style={ms.iconRow}>
                  <View style={ms.iconCircle}>
                    <Ionicons name="person-add" size={24} color={C.brand} />
                  </View>
                </View>
                <Text style={ms.title}>Login to Continue</Text>
                <Text style={ms.sub}>Enter your mobile number to get started</Text>

                <View style={ms.inputWrap}>
                  <View style={ms.prefix}>
                    <Text style={ms.flag}>🇮🇳</Text>
                    <Text style={ms.prefixText}>+91</Text>
                  </View>
                  <TextInput
                    style={ms.input}
                    placeholder="Enter 10-digit number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={(t) => { setPhone(t.replace(/[^0-9]/g, "")); setError(""); }}
                    autoFocus
                  />
                  {phone.length === 10 && (
                    <Ionicons name="checkmark-circle" size={20} color={C.green} />
                  )}
                </View>

                {error ? <Text style={ms.error}>{error}</Text> : null}

                <TouchableOpacity style={ms.btn} activeOpacity={0.85} onPress={sendOTP} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Text style={ms.btnText}>Send OTP</Text>
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={ms.iconRow}>
                  <View style={[ms.iconCircle, { backgroundColor: "#EFF6FF" }]}>
                    <Ionicons name="keypad" size={24} color="#2563EB" />
                  </View>
                </View>
                <Text style={ms.title}>Verify OTP</Text>
                <Text style={ms.sub}>Enter the 4-digit code sent to +91 {phone}</Text>

                <View style={ms.otpRow}>
                  {otp.map((d, i) => (
                    <TextInput
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      style={[ms.otpBox, d ? ms.otpFilled : null]}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={d}
                      onChangeText={(t) => handleOtpChange(t, i)}
                      onKeyPress={(e) => handleOtpKey(e, i)}
                      selectTextOnFocus
                    />
                  ))}
                </View>

                {error ? <Text style={ms.error}>{error}</Text> : null}

                <TouchableOpacity style={ms.btn} activeOpacity={0.85} onPress={() => verifyOTP()} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <Text style={ms.btnText}>Verify & Continue</Text>
                  )}
                </TouchableOpacity>

                <View style={ms.resendRow}>
                  {timer > 0 ? (
                    <Text style={ms.timerText}>Resend in {timer}s</Text>
                  ) : (
                    <TouchableOpacity onPress={resendOTP}>
                      <Text style={ms.resendLink}>Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setStep("phone")}>
                    <Text style={ms.changeLink}>Change number</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={{ height: Platform.OS === "ios" ? 20 : 10 }} />
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const ms = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 14,
  },
  pill: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0", alignSelf: "center", marginBottom: 20 },
  iconRow: { alignItems: "center", marginBottom: 14 },
  iconCircle: {
    width: 56, height: 56, borderRadius: 18, backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center",
  },
  title: { fontSize: 20, fontFamily: F.extraBold, color: C.ink, textAlign: "center" },
  sub: { fontSize: 13, fontFamily: F.regular, color: C.ink4, textAlign: "center", marginTop: 4, marginBottom: 20 },

  inputWrap: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 14,
    paddingHorizontal: 14, height: 52, marginBottom: 6,
  },
  prefix: { flexDirection: "row", alignItems: "center", gap: 4, marginRight: 10 },
  flag: { fontSize: 16 },
  prefixText: { fontSize: 14, fontFamily: F.bold, color: C.ink },
  input: { flex: 1, fontSize: 16, fontFamily: F.medium, color: C.ink },

  error: { fontSize: 12, fontFamily: F.regular, color: C.red, marginBottom: 8, marginLeft: 4 },

  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.brand, borderRadius: 14, paddingVertical: 16, marginTop: 10,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  btnText: { fontSize: 16, fontFamily: F.bold, color: "#fff" },

  otpRow: { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 6 },
  otpBox: {
    width: 52, height: 56, borderRadius: 14,
    borderWidth: 1.5, borderColor: "#E2E8F0",
    textAlign: "center", fontSize: 22, fontFamily: F.extraBold, color: C.ink,
  },
  otpFilled: { borderColor: C.brand, backgroundColor: C.brandLt },

  resendRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: 16,
  },
  timerText: { fontSize: 13, fontFamily: F.regular, color: C.ink4 },
  resendLink: { fontSize: 13, fontFamily: F.bold, color: C.brand },
  changeLink: { fontSize: 13, fontFamily: F.bold, color: C.ink3 },
});

/* ══════════════════════════════════════
   AUTH PROVIDER
══════════════════════════════════════ */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const pendingAction = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem("user");
        if (json) setUser(JSON.parse(json));
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const login = async (userData) => {
    setUser(userData);
    await AsyncStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("token");
  };

  const requireAuth = useCallback((onAuthenticated) => {
    if (user) {
      onAuthenticated?.();
      return true;
    }
    pendingAction.current = onAuthenticated;
    setModalVisible(true);
    return false;
  }, [user]);

  const showLoginModal = useCallback(() => setModalVisible(true), []);

  const handleLoggedIn = async (userData) => {
    await login(userData);
    setModalVisible(false);
    // Execute the pending action after login
    setTimeout(() => {
      pendingAction.current?.();
      pendingAction.current = null;
    }, 300);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, requireAuth, showLoginModal }}>
      {children}
      <AuthModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); pendingAction.current = null; }}
        onLoggedIn={handleLoggedIn}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Animated, Dimensions,
} from "react-native";
import API from "../../api";
import { useAuth } from "../../context/AuthContext";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";
import CustomAlert from "../../components/CustomAlert";

const OTP_LENGTH = 4;

export default function OTPScreen({ route, navigation }) {
  const { phone } = route.params;
  const { login } = useAuth();
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [alert, setAlert] = useState({ visible: false, type: "error", title: "", message: "" });
  const refs = useRef([]);

  const showAlert = (type, title, message) => setAlert({ visible: true, type, title, message });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    refs.current[0]?.focus();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  const handleChange = (text, idx) => {
    const val = text.replace(/[^0-9]/g, "");
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < OTP_LENGTH - 1) refs.current[idx + 1]?.focus();
    if (newOtp.every((d) => d) && idx === OTP_LENGTH - 1) verifyOTP(newOtp.join(""));
  };

  const handleKeyPress = (e, idx) => {
    if (e.nativeEvent.key === "Backspace" && !otp[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  const verifyOTP = async (otpCode) => {
    const code = otpCode || otp.join("");
    if (code.length !== OTP_LENGTH) {
      showAlert("warning", "Incomplete OTP", "Please enter all 4 digits of the OTP code.");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/otp/verify", { phone, otp: code });
      await login({
        phone,
        _id: res.data.userId || res.data.data?.userId || phone,
        name: res.data.name || res.data.data?.name || "",
      });
    } catch (err) {
      showAlert("error", "Verification Failed", err?.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    try {
      await API.post("/otp/send", { phone });
      setTimer(30);
      showAlert("success", "OTP Resent!", "A new OTP has been sent to your phone.");
    } catch { showAlert("error", "Resend Failed", "Unable to resend OTP. Please try again."); }
  };

  return (
    <View style={s.container}>
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, visible: false })}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={s.content}>
          <View style={s.circle1} />
          <View style={s.circle2} />

          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={s.iconWrap}>
              <View style={s.iconBg}>
                <Text style={{ fontSize: 32 }}>🔐</Text>
              </View>
            </View>

            <Text style={s.title}>Verify OTP</Text>
            <Text style={s.sub}>
              Enter the 4-digit code sent to{"\n"}
              <Text style={s.phone}>+91 {phone}</Text>
            </Text>

            <View style={s.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(el) => (refs.current[i] = el)}
                  style={[s.otpBox, digit ? s.otpFilled : null]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(t) => handleChange(t, i)}
                  onKeyPress={(e) => handleKeyPress(e, i)}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={() => verifyOTP()}
              disabled={loading}
              activeOpacity={0.85}
              style={[s.btn, loading && { opacity: 0.7 }]}
            >
              <Text style={s.btnText}>{loading ? "Verifying..." : "Verify & Continue"}</Text>
            </TouchableOpacity>

            <View style={s.resendRow}>
              {timer > 0 ? (
                <View style={s.timerWrap}>
                  <Text style={s.timerText}>Resend code in </Text>
                  <View style={s.timerBadge}>
                    <Text style={s.timerNum}>{timer}s</Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity onPress={resendOTP} style={s.resendBtn}>
                  <Text style={s.resendLink}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#2D0810" },
  content: { flex: 1, justifyContent: "center", padding: 28 },
  circle1: {
    position: "absolute", top: -50, left: -60,
    width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(127,14,37,0.2)",
  },
  circle2: {
    position: "absolute", bottom: 80, right: -40,
    width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.03)",
  },
  back: { position: "absolute", top: 52, left: 0, padding: 8 },
  backText: { fontSize: 15, color: "rgba(255,255,255,0.6)", fontFamily: F.semiBold },
  iconWrap: { alignItems: "center", marginBottom: 24 },
  iconBg: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: C.brand,
    justifyContent: "center", alignItems: "center",
    shadowColor: C.brand, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  title: { fontSize: 26, fontFamily: F.extraBold, color: "#fff", textAlign: "center" },
  sub: { fontSize: 14, color: "rgba(255,255,255,0.55)", textAlign: "center", marginTop: 8, lineHeight: 22, fontFamily: F.regular },
  phone: { fontFamily: F.extraBold, color: "#fff" },
  otpRow: { flexDirection: "row", justifyContent: "center", gap: 16, marginVertical: 36 },
  otpBox: {
    width: 62, height: 68, borderRadius: 18, borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.08)",
    textAlign: "center", fontSize: 28, fontFamily: F.extraBold, color: "#fff",
  },
  otpFilled: { borderColor: C.brand, backgroundColor: "rgba(127,14,37,0.15)" },
  btn: { backgroundColor: C.brand, borderRadius: 16, paddingVertical: 17, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 17, fontFamily: F.extraBold },
  resendRow: { alignItems: "center", marginTop: 28 },
  timerWrap: { flexDirection: "row", alignItems: "center" },
  timerText: { fontSize: 14, color: "rgba(255,255,255,0.45)" },
  timerBadge: {
    backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  timerNum: { fontSize: 14, fontFamily: F.extraBold, color: "#fff" },
  resendBtn: {
    backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 10,
  },
  resendLink: { fontSize: 15, fontFamily: F.extraBold, color: "#E8A0AB" },
});

import { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Animated, Dimensions,
} from "react-native";
import API from "../../api";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";
import CustomAlert from "../../components/CustomAlert";

const { width, height } = Dimensions.get("window");

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [alert, setAlert] = useState({ visible: false, type: "error", title: "", message: "" });

  const showAlert = (type, title, message) => setAlert({ visible: true, type, title, message });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const sendOTP = async () => {
    if (!phone) {
      showAlert("warning", "Phone Required", "Please enter your 10-digit mobile number to continue.");
      return;
    }
    if (phone.length !== 10) {
      showAlert("error", "Invalid Number", `You entered ${phone.length} digits. Please enter a valid 10-digit mobile number.`);
      return;
    }
    setLoading(true);
    try {
      await API.post("/otp/send", { phone });
      setLoading(false);
      navigation.navigate("OTP", { phone });
    } catch (err) {
      setLoading(false);
      showAlert("error", "Failed to Send OTP", err?.response?.data?.message || "Please check your connection and try again.");
    }
  };

  return (
    <View style={s.container}>
      <CustomAlert
        visible={alert.visible} type={alert.type} title={alert.title}
        message={alert.message} onClose={() => setAlert({ ...alert, visible: false })}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <View style={s.circle1} />
          <View style={s.circle2} />

          {/* Logo */}
          <Animated.View style={[s.logoWrap, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
            <View style={s.logoBg}>
              <Text style={s.logoPlus}>+</Text>
              <Text style={s.logoText}>RG</Text>
            </View>
            <Text style={s.brandName}>RG Medlink</Text>
            <Text style={s.tagline}>Your Trusted Healthcare Partner</Text>
          </Animated.View>

          {/* Card */}
          <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={s.cardInner}>
              <Text style={s.cardTitle}>Welcome Back</Text>
              <Text style={s.cardSub}>Sign in with your mobile number</Text>

              <View style={[s.inputWrap, focused && s.inputFocused]}>
                <View style={s.prefixBox}>
                  <Text style={s.flag}>🇮🇳</Text>
                  <Text style={s.prefix}>+91</Text>
                </View>
                <View style={s.divider} />
                <TextInput
                  style={s.input}
                  placeholder="Enter mobile number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, ""))}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
                {phone.length === 10 && (
                  <View style={s.checkMark}>
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>✓</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity onPress={sendOTP} disabled={loading} activeOpacity={0.85}
                style={[s.btn, loading && { opacity: 0.7 }]}>
                <Text style={s.btnText}>{loading ? "Sending OTP..." : "Get OTP"}</Text>
                {!loading && <Text style={s.btnArrow}>→</Text>}
              </TouchableOpacity>

              <View style={s.orRow}>
                <View style={s.orLine} />
                <Text style={s.orText}>Secure Login</Text>
                <View style={s.orLine} />
              </View>

              <View style={s.trustRow}>
                {["🔒 Encrypted", "⚡ Instant OTP", "✅ Verified"].map((t) => (
                  <View key={t} style={s.trustBadge}>
                    <Text style={s.trustText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[s.footer, { opacity: fadeAnim }]}>
            <Text style={s.terms}>
              By continuing, you agree to our{" "}
              <Text style={s.link}>Terms of Service</Text> and{" "}
              <Text style={s.link}>Privacy Policy</Text>
            </Text>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#2D0810" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24, paddingTop: 60 },
  circle1: {
    position: "absolute", top: -80, right: -60,
    width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(127,14,37,0.3)",
  },
  circle2: {
    position: "absolute", bottom: 120, left: -40,
    width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(3,108,51,0.15)",
  },
  logoWrap: { alignItems: "center", marginBottom: 32 },
  logoBg: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: C.brand,
    justifyContent: "center", alignItems: "center",
    shadowColor: C.brand, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5, shadowRadius: 24, elevation: 12,
  },
  logoPlus: {
    position: "absolute", top: 6, right: 10,
    fontSize: 16, fontWeight: "900", color: "rgba(255,255,255,0.4)",
  },
  logoText: { fontSize: 30, fontFamily: F.extraBold, color: "#fff", letterSpacing: 2 },
  brandName: { fontSize: 26, fontFamily: F.extraBold, color: "#fff", marginTop: 16 },
  tagline: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4, fontFamily: F.medium },

  card: {
    borderRadius: 24, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2, shadowRadius: 32, elevation: 12,
  },
  cardInner: { padding: 28, borderRadius: 24, backgroundColor: "#fff" },
  cardTitle: { fontSize: 22, fontFamily: F.extraBold, color: C.ink },
  cardSub: { fontSize: 14, color: C.ink3, marginTop: 4, marginBottom: 28, fontFamily: F.regular },

  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.surface3, borderRadius: 16, borderWidth: 2,
    borderColor: C.border, paddingHorizontal: 4, marginBottom: 20, height: 58,
  },
  inputFocused: { borderColor: C.brand, backgroundColor: C.brandLt },
  prefixBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 6 },
  flag: { fontSize: 18 },
  prefix: { fontSize: 15, fontFamily: F.extraBold, color: C.ink2 },
  divider: { width: 1.5, height: 28, backgroundColor: C.border, marginHorizontal: 4 },
  input: {
    flex: 1, fontSize: 17, color: C.ink, paddingVertical: 14,
    fontFamily: F.bold, letterSpacing: 2, paddingHorizontal: 8,
  },
  checkMark: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: C.accent,
    justifyContent: "center", alignItems: "center", marginRight: 10,
  },

  btn: {
    backgroundColor: C.accent, borderRadius: 16, paddingVertical: 17,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  btnText: { color: "#fff", fontSize: 17, fontFamily: F.extraBold },
  btnArrow: { color: "rgba(255,255,255,0.7)", fontSize: 20 },

  orRow: { flexDirection: "row", alignItems: "center", marginVertical: 22, gap: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: C.border },
  orText: { fontSize: 11, fontFamily: F.bold, color: C.ink4, textTransform: "uppercase", letterSpacing: 1 },

  trustRow: { flexDirection: "row", justifyContent: "center", gap: 8 },
  trustBadge: {
    backgroundColor: C.surface3, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: C.border,
  },
  trustText: { fontSize: 10, fontFamily: F.bold, color: C.ink3 },

  footer: { marginTop: 28, paddingHorizontal: 16 },
  terms: { fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 18, fontFamily: F.regular },
  link: { color: "rgba(255,255,255,0.65)", fontFamily: F.semiBold },
});

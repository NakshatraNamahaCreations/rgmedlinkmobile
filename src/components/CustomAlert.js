import { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Dimensions, Modal,
} from "react-native";
import { F } from "../theme/fonts";

const { width } = Dimensions.get("window");

const TYPES = {
  error: {
    icon: "🚫",
    color: "#DC2626",
    light: "#FEF2F2",
    border: "#FCA5A5",
  },
  success: {
    icon: "✓",
    color: "#059669",
    light: "#ECFDF5",
    border: "#6EE7B7",
  },
  warning: {
    icon: "!",
    color: "#D97706",
    light: "#FFFBEB",
    border: "#FCD34D",
  },
  info: {
    icon: "i",
    color: "#2563EB",
    light: "#EFF6FF",
    border: "#93C5FD",
  },
};

export default function CustomAlert({ visible, type = "error", title, message, onClose, buttonText }) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const cfg = TYPES[type] || TYPES.error;
  const isTextIcon = cfg.icon.length <= 2 && !/\p{Emoji}/u.test(cfg.icon);

  useEffect(() => {
    if (visible) {
      scale.setValue(0.85);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, damping: 18, stiffness: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 0.85, duration: 120, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(() => onClose?.());
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={s.overlay}>
        <Animated.View style={[s.backdrop, { opacity }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={dismiss} />
        </Animated.View>

        <Animated.View style={[s.card, { opacity, transform: [{ scale }] }]}>
          {/* Top colored strip */}
          <View style={[s.strip, { backgroundColor: cfg.color }]} />

          {/* Icon */}
          <View style={[s.iconRing, { borderColor: cfg.border }]}>
            <View style={[s.iconCircle, { backgroundColor: cfg.light }]}>
              {cfg.icon.length > 2 ? (
                <Text style={{ fontSize: 24 }}>{cfg.icon}</Text>
              ) : (
                <Text style={[s.iconChar, { color: cfg.color }]}>{cfg.icon}</Text>
              )}
            </View>
          </View>

          {/* Content */}
          <Text style={s.title}>{title || "Alert"}</Text>
          <Text style={s.message}>{message}</Text>

          {/* Button */}
          <TouchableOpacity
            style={[s.btn, { backgroundColor: cfg.color }]}
            onPress={dismiss}
            activeOpacity={0.85}
          >
            <Text style={s.btnText}>{buttonText || "Dismiss"}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: "center", alignItems: "center",
    paddingHorizontal: 32,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.6)",
  },
  card: {
    width: "100%", maxWidth: 340,
    backgroundColor: "#FFFFFF", borderRadius: 20,
    alignItems: "center", overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.18, shadowRadius: 40, elevation: 24,
  },
  strip: {
    width: "100%", height: 5,
  },
  iconRing: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 2.5, justifyContent: "center", alignItems: "center",
    marginTop: 28,
  },
  iconCircle: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: "center", alignItems: "center",
  },
  iconChar: {
    fontSize: 24, fontFamily: F.extraBold,
  },
  title: {
    fontSize: 18, fontFamily: F.bold, color: "#111827",
    marginTop: 18, textAlign: "center", paddingHorizontal: 24,
  },
  message: {
    fontSize: 14, fontFamily: F.regular, color: "#6B7280",
    marginTop: 8, textAlign: "center", lineHeight: 21,
    paddingHorizontal: 28,
  },
  btn: {
    marginTop: 24, marginBottom: 24, borderRadius: 12,
    paddingVertical: 13, paddingHorizontal: 48,
    minWidth: 160, alignItems: "center",
  },
  btnText: {
    color: "#fff", fontSize: 15, fontFamily: F.bold,
  },
});

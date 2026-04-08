import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../theme/colors";
import { F } from "../theme/fonts";

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("App Error:", error, info);
    // TODO: Send to Sentry/Crashlytics
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={s.root}>
          <View style={s.icon}>
            <Ionicons name="warning-outline" size={48} color={C.brand} />
          </View>
          <Text style={s.title}>Something went wrong</Text>
          <Text style={s.sub}>We're sorry for the inconvenience. Please try again.</Text>
          <TouchableOpacity style={s.btn} onPress={() => this.setState({ hasError: false, error: null })}>
            <Text style={s.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, backgroundColor: "#fff" },
  icon: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center", marginBottom: 20,
  },
  title: { fontSize: 20, fontFamily: F.bold, color: C.ink, marginBottom: 8 },
  sub: { fontSize: 14, fontFamily: F.regular, color: C.ink4, textAlign: "center", lineHeight: 21, marginBottom: 24 },
  btn: {
    backgroundColor: C.brand, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32,
  },
  btnText: { fontSize: 15, fontFamily: F.bold, color: "#fff" },
});

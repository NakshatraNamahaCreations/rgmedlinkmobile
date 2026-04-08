import { useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { View, Text } from "react-native";
import {
  useFonts,
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import ErrorBoundary from "./src/components/ErrorBoundary";
import SplashAnimation from "./src/components/SplashAnimation";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded] = useFonts({
    "Jakarta-Light": PlusJakartaSans_300Light,
    "Jakarta": PlusJakartaSans_400Regular,
    "Jakarta-Medium": PlusJakartaSans_500Medium,
    "Jakarta-SemiBold": PlusJakartaSans_600SemiBold,
    "Jakarta-Bold": PlusJakartaSans_700Bold,
    "Jakarta-ExtraBold": PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" }}>
        <Text style={{ fontSize: 32 }}>💊</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <StatusBar style="light" />
        <AppNavigator />
        {showSplash && <SplashAnimation onFinish={() => setShowSplash(false)} />}
      </AuthProvider>
    </ErrorBoundary>
  );
}

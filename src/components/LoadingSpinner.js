import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { C } from "../theme/colors";

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg }}>
      <ActivityIndicator size="large" color={C.brand} />
      <Text style={{ marginTop: 12, fontSize: 14, color: C.ink3, fontWeight: "500" }}>
        {message}
      </Text>
    </View>
  );
}

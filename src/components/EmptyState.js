import React from "react";
import { View, Text } from "react-native";
import { C } from "../theme/colors";

export default function EmptyState({ icon = "📭", title = "Nothing here", subtitle = "" }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>{icon}</Text>
      <Text style={{ fontSize: 17, fontWeight: "700", color: C.ink, marginBottom: 6 }}>{title}</Text>
      {subtitle ? (
        <Text style={{ fontSize: 13, color: C.ink3, textAlign: "center", lineHeight: 20 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

import React from "react";
import { View, Text } from "react-native";
import { C } from "../theme/colors";
import { F } from "../theme/fonts";

const STATUS_MAP = {
  // Order status
  Created:    { color: C.amber, bg: C.amberBg },
  Processing: { color: C.blue,  bg: C.blueBg },
  Packed:     { color: C.purple, bg: C.purpleBg },
  Shipped:    { color: C.teal,  bg: C.tealBg },
  Delivered:  { color: C.green, bg: C.greenBg },
  // Payment
  Paid:       { color: C.green, bg: C.greenBg },
  Pending:    { color: C.amber, bg: C.amberBg },
  Unpaid:     { color: C.red,   bg: C.redBg },
  Failed:     { color: C.red,   bg: C.redBg },
  // Ticket status
  Open:          { color: C.blue,  bg: C.blueBg },
  "In Progress": { color: C.amber, bg: C.amberBg },
  Resolved:      { color: C.green, bg: C.greenBg },
  Closed:        { color: C.ink4,  bg: C.surface3 },
  // Ticket priority
  Low:    { color: C.green,  bg: C.greenBg },
  Medium: { color: C.amber,  bg: C.amberBg },
  High:   { color: C.orange, bg: C.orangeBg },
  Urgent: { color: C.red,    bg: C.redBg },
};

export default function StatusChip({ label, size = "sm" }) {
  const cfg = STATUS_MAP[label] || { color: C.ink3, bg: C.surface3 };
  const isSm = size === "sm";
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", alignSelf: "flex-start",
      backgroundColor: cfg.bg, borderRadius: 99,
      paddingHorizontal: isSm ? 10 : 14,
      paddingVertical: isSm ? 4 : 6,
      borderWidth: 1, borderColor: cfg.color + "25",
    }}>
      <View style={{
        width: isSm ? 6 : 8, height: isSm ? 6 : 8,
        borderRadius: 99, backgroundColor: cfg.color, marginRight: 6,
      }} />
      <Text style={{
        fontSize: isSm ? 11 : 13, fontFamily: F.bold, color: cfg.color,
      }}>
        {label}
      </Text>
    </View>
  );
}

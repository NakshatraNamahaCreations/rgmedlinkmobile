import React, { useLayoutEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import StatusChip from "../../components/StatusChip";
import API, { BASE_URL } from "../../api";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";

const fDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fCur = (v) => `₹${(v || 0).toLocaleString("en-IN")}`;

const PIPELINE = ["Created", "Processing", "Packed", "Shipped", "Delivered"];

export default function OrderDetailScreen({ route, navigation }) {
  const { order: o } = route.params;
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 8, padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={C.ink} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
const rx = o.prescription;
const meds = o.items || [];
const subtotal = meds.reduce(
  (s, m) => s + ((m.qty || 0) * (m.price || 0)),
  0
);

  const currentIdx = PIPELINE.indexOf(o.orderStatus || "Created");

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Order Header */}
      <View style={s.header}>
        <Text style={s.orderId}>{o.orderId}</Text>
        <View style={s.chipRow}>
          <StatusChip label={o.orderStatus || "Created"} size="md" />
          <StatusChip label={o.paymentStatus || "Pending"} size="md" />
        </View>
      </View>

      {/* Tracking Pipeline */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Order Tracking</Text>
        <View style={s.pipeline}>
          {PIPELINE.map((step, i) => {
            const done = i <= currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <View key={step} style={s.pipeStep}>
                <View style={[s.dot, done && s.dotDone, isCurrent && s.dotCurrent]}>
                  {done && <Text style={{ color: C.white, fontSize: 10, fontWeight: "800" }}>✓</Text>}
                </View>
                <Text style={[s.stepLabel, done && s.stepDone, isCurrent && s.stepCurrent]}>{step}</Text>
                {i < PIPELINE.length - 1 && (
                  <View style={[s.line, done && s.lineDone]} />
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Customer Info */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Customer Details</Text>
        <View style={s.infoCard}>
          {[
            { l: "Name", v: o.patientDetails?.name },
            { l: "Phone", v: o.patientDetails?.phone },
            { l: "Address", v: o.addressDetails?.fullAddress },
            { l: "City", v: [o.addressDetails?.city, o.addressDetails?.state].filter(Boolean).join(", ") },
            { l: "Order Date", v: fDate(o.createdAt) },
          ].map((item, i) => (
            <View key={i} style={[s.infoRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}>
              <Text style={s.infoLabel}>{item.l}</Text>
              <Text style={s.infoValue}>{item.v || "—"}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Medicines */}
      {meds.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Medicines ({meds.length})</Text>
          {meds.map((m, i) => (
            <View key={i} style={s.medCard}>
              <View style={s.medIcon}>
                <Text style={{ fontSize: 18 }}>💊</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.medName}>{m.name}</Text>
             <Text style={s.medMeta}>
  {m.qty} {m.unit || "units"}
</Text>
              </View>
             <Text style={s.medPrice}>{fCur(m.qty * m.price)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Billing */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Billing Summary</Text>
        <View style={s.infoCard}>
          {[
             { l: "Subtotal", v: fCur(subtotal) },
             { l: "GST", v: fCur(o.gstAmount || 0) },
             { l: "Discount", v: fCur(o.discount || 0) },
          ].map((item, i) => (
            <View key={i} style={[s.billRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}>
              <Text style={s.billLabel}>{item.l}</Text>
              <Text style={s.billValue}>{item.v}</Text>
            </View>
          ))}
          <View style={[s.billRow, s.totalRow]}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>{fCur(o.totalAmount)}</Text>
          </View>
        </View>
      </View>
      {/* Action buttons */}
      <View style={s.actions}>
        {!["Shipped", "Delivered", "Cancelled"].includes(o.orderStatus) && (
          <TouchableOpacity
            style={s.cancelBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
              { text: "No", style: "cancel" },
              { text: "Yes, Cancel", style: "destructive", onPress: async () => {
                try {
                  await API.patch(`/orders/${o._id}/cancel`);
                  Alert.alert("Cancelled", "Your order has been cancelled.");
                  navigation.goBack();
                } catch (err) {
                  Alert.alert("Error", err?.response?.data?.message || "Could not cancel order");
                }
              }},
            ])}
          >
            <Ionicons name="close-circle-outline" size={16} color={C.red} />
            <Text style={s.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={s.supportBtn}
          activeOpacity={0.7}
          onPress={() => navigation.getParent()?.navigate("ProfileTab", { screen: "CreateTicket" })}
        >
          <Ionicons name="chatbubble-outline" size={16} color={C.brand} />
          <Text style={s.supportBtnText}>Need Help?</Text>
        </TouchableOpacity>
      </View>
      {/* Download Invoice */}
      {o.paymentStatus === "Paid" && (
        <TouchableOpacity style={s.invoiceBtn} activeOpacity={0.7}
          onPress={async () => {
            try {
              Alert.alert("Downloading...", "Generating invoice PDF");
              const fileUri = FileSystem.documentDirectory + `invoice-${o.orderId}.pdf`;
              const { uri } = await FileSystem.downloadAsync(
                `${BASE_URL}/orders/${o._id}/invoice-pdf`,
                fileUri
              );
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Invoice" });
              } else {
                Alert.alert("Saved", `Invoice saved to ${uri}`);
              }
            } catch (err) {
              Alert.alert("Error", "Could not download invoice. Please try again.");
            }
          }}
        >
          <Ionicons name="download-outline" size={18} color={C.accent} />
          <Text style={s.invoiceBtnText}>Download Invoice</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const F2 = F || { bold: undefined, semiBold: undefined };
const s = StyleSheet.create({
  actions: {
    flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 16,
  },
  cancelBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: C.red + "30",
    backgroundColor: "#FEF2F2",
  },
  cancelBtnText: { fontSize: 13, fontWeight: "700", color: C.red },
  supportBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: C.brand + "30",
    backgroundColor: C.brandLt || "#FDF2F4",
  },
  supportBtnText: { fontSize: 13, fontWeight: "700", color: C.brand },
  invoiceBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: 16, marginBottom: 16,
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: "#ECFDF5", borderWidth: 1.5, borderColor: "rgba(3,108,51,0.15)",
  },
  invoiceBtnText: { fontSize: 14, fontWeight: "700", color: C.accent },
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    backgroundColor: C.brand, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  orderId: { fontSize: 20, fontWeight: "900", color: C.white, marginBottom: 10 },
  chipRow: { flexDirection: "row", gap: 8 },
  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: C.ink, marginBottom: 12 },
  pipeline: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  pipeStep: { alignItems: "center", flex: 1 },
  dot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: C.border,
    justifyContent: "center", alignItems: "center", zIndex: 2,
  },
  dotDone: { backgroundColor: C.green },
  dotCurrent: { backgroundColor: C.brand, borderWidth: 3, borderColor: C.brandLt },
  stepLabel: { fontSize: 10, color: C.ink4, marginTop: 6, textAlign: "center", fontWeight: "600" },
  stepDone: { color: C.green },
  stepCurrent: { color: C.brand, fontWeight: "800" },
  line: {
    position: "absolute", top: 13, left: "60%", right: "-40%",
    height: 2, backgroundColor: C.border, zIndex: 1,
  },
  lineDone: { backgroundColor: C.green },
  infoCard: {
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    overflow: "hidden",
  },
  infoRow: { flexDirection: "row", justifyContent: "space-between", padding: 14 },
  infoLabel: { fontSize: 13, color: C.ink3, fontWeight: "500" },
  infoValue: { fontSize: 13, fontWeight: "700", color: C.ink, flex: 1, textAlign: "right" },
  medCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  medIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center",
  },
  medName: { fontSize: 14, fontWeight: "700", color: C.ink },
  medMeta: { fontSize: 11, color: C.ink3, marginTop: 2 },
  medPrice: { fontSize: 14, fontWeight: "800", color: C.ink },
  billRow: { flexDirection: "row", justifyContent: "space-between", padding: 14 },
  billLabel: { fontSize: 13, color: C.ink3 },
  billValue: { fontSize: 13, fontWeight: "600", color: C.ink },
  totalRow: { backgroundColor: C.brand, borderTopWidth: 0 },
  totalLabel: { fontSize: 14, fontWeight: "700", color: C.white },
  totalValue: { fontSize: 18, fontWeight: "900", color: C.white },
});

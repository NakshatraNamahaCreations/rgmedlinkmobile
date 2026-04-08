import React, { useState, useLayoutEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Platform, RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import API from "../../api";
import { useAuth } from "../../context/AuthContext";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";

const fCur = (v) => `₹${(v || 0).toLocaleString("en-IN")}`;

export default function CartScreen({ navigation, route }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Check if we have prescription data passed from the flow
  const prescription = route.params?.prescription;
  const cartItems = prescription?.medicines || [];

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: "Cart" });
  }, [navigation]);

  // Fetch pending/recent orders to show in cart
  const fetchOrders = useCallback(async () => {
    try {
      const userId = user?._id || user?.phone;
      const url = userId ? `/orders?page=1&limit=5&userId=${userId}` : "/orders?page=1&limit=5";
      const res = await API.get(url).catch(() => ({ data: { data: [] } }));
      setOrders((res.data.data || []).filter(o => o.orderStatus === "Created" || o.orderStatus === "Pending"));
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

  const hasItems = cartItems.length > 0 || orders.length > 0;

  // Cart with prescription items
  if (cartItems.length > 0) {
    const subtotal = cartItems.reduce((s, m) => s + (m.subtotal || 0), 0);
    const gst = Math.round(subtotal * 0.12);
    const total = subtotal + gst;

    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>Your Cart</Text>
          <Text style={s.subtitle}>{cartItems.length} medicine(s) from prescription</Text>

          {cartItems.map((med, i) => (
            <View key={i} style={s.itemCard}>
              <View style={s.itemIcon}>
                <Ionicons name="medkit" size={18} color={C.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{med.name}</Text>
                <Text style={s.itemDetail}>{med.freqLabel || "1-0-1"} · {med.duration || 5} days · Qty: {med.qty}</Text>
              </View>
              {med.subtotal > 0 && <Text style={s.itemPrice}>{fCur(med.subtotal)}</Text>}
            </View>
          ))}

          {subtotal > 0 && (
            <View style={s.billCard}>
              <View style={s.billRow}>
                <Text style={s.billLabel}>Subtotal</Text>
                <Text style={s.billVal}>{fCur(subtotal)}</Text>
              </View>
              <View style={s.billRow}>
                <Text style={s.billLabel}>GST (12%)</Text>
                <Text style={s.billVal}>{fCur(gst)}</Text>
              </View>
              <View style={s.billDivider} />
              <View style={s.billRow}>
                <Text style={s.billTotal}>Total</Text>
                <Text style={s.billTotalVal}>{fCur(total)}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity
            style={s.checkoutBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("ReviewPrescription", {
              prescription,
              mode: "all",
              prescriptionId: prescription?.rxId,
            })}
          >
            <Text style={s.checkoutTxt}>Proceed to Checkout</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Empty cart
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.emptyScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[C.brand]} />}
      >
        <View style={s.emptyWrap}>
          <View style={s.emptyIconWrap}>
            <Ionicons name="cart-outline" size={56} color={C.ink4} />
          </View>
          <Text style={s.emptyTitle}>Your cart is empty</Text>
          <Text style={s.emptySub}>Upload a prescription to add medicines to your cart</Text>

          <TouchableOpacity
            style={s.uploadBtn}
            activeOpacity={0.85}
            onPress={() => navigation.getParent()?.navigate("OrdersTab", { screen: "UploadPrescription", initial: false })}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            <Text style={s.uploadTxt}>Upload Prescription</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.browseBtn}
            activeOpacity={0.8}
            onPress={() => navigation.getParent()?.navigate("OrdersTab", { screen: "UploadPrescription", initial: false })}
          >
            <Ionicons name="camera-outline" size={18} color={C.brand} />
            <Text style={s.browseTxt}>Take Photo of Prescription</Text>
          </TouchableOpacity>
        </View>

        {/* How it works */}
        <View style={s.howSection}>
          <Text style={s.howTitle}>How it works</Text>
          {[
            { icon: "cloud-upload", text: "Upload your prescription", color: C.brand },
            { icon: "search", text: "We read & verify medicines", color: "#7C3AED" },
            { icon: "cart", text: "Medicines added to your cart", color: "#059669" },
            { icon: "bicycle", text: "Delivered to your doorstep", color: "#D97706" },
          ].map((step, i) => (
            <View key={i} style={s.howRow}>
              <View style={[s.howIcon, { backgroundColor: step.color + "15" }]}>
                <Ionicons name={step.icon} size={16} color={step.color} />
              </View>
              <Text style={s.howText}>{step.text}</Text>
              {i < 3 && <View style={s.howLine} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },
  scroll: { padding: 20, paddingBottom: 100 },
  emptyScroll: { padding: 20, paddingBottom: 40 },

  /* Title */
  title: { fontSize: 20, fontFamily: F.extraBold, color: C.ink, marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: F.regular, color: C.ink4, marginBottom: 20 },

  /* Cart items */
  itemCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#F1F5F9", marginBottom: 10,
  },
  itemIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center",
  },
  itemName: { fontSize: 14, fontFamily: F.bold, color: C.ink },
  itemDetail: { fontSize: 12, fontFamily: F.regular, color: C.ink4, marginTop: 2 },
  itemPrice: { fontSize: 14, fontFamily: F.extraBold, color: C.ink },

  /* Bill */
  billCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginTop: 10,
    borderWidth: 1.5, borderColor: C.brand + "20",
  },
  billRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  billLabel: { fontSize: 13, fontFamily: F.regular, color: C.ink3 },
  billVal: { fontSize: 13, fontFamily: F.semiBold, color: C.ink2 },
  billDivider: { height: 1.5, backgroundColor: "#F1F5F9", marginVertical: 8 },
  billTotal: { fontSize: 15, fontFamily: F.bold, color: C.ink },
  billTotalVal: { fontSize: 17, fontFamily: F.extraBold, color: C.brand },

  /* Footer */
  footer: {
    paddingHorizontal: 20, paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 30 : 18,
    backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F1F5F9",
  },
  checkoutBtn: {
    backgroundColor: C.brand, borderRadius: 14, paddingVertical: 17,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32, shadowRadius: 14, elevation: 7,
  },
  checkoutTxt: { fontSize: 16, fontFamily: F.bold, color: "#fff" },

  /* Empty */
  emptyWrap: { alignItems: "center", paddingTop: 60, paddingBottom: 30 },
  emptyIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#F1F5F9",
    justifyContent: "center", alignItems: "center", marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontFamily: F.extraBold, color: C.ink, marginBottom: 6 },
  emptySub: { fontSize: 14, fontFamily: F.regular, color: C.ink4, textAlign: "center", marginBottom: 24, paddingHorizontal: 20 },
  uploadBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.brand, borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 15,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    marginBottom: 12,
  },
  uploadTxt: { fontSize: 15, fontFamily: F.bold, color: "#fff" },
  browseBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1.5, borderColor: C.brand + "30", borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 13,
  },
  browseTxt: { fontSize: 14, fontFamily: F.semiBold, color: C.brand },

  /* Pending */
  pendingSection: { marginTop: 10 },
  pendingTitle: { fontSize: 16, fontFamily: F.bold, color: C.ink, marginBottom: 12 },
  pendingCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#F1F5F9", marginBottom: 10,
  },
  pendingIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center",
  },
  pendingId: { fontSize: 13, fontFamily: F.bold, color: C.ink },
  pendingSub: { fontSize: 12, fontFamily: F.regular, color: C.ink4, marginTop: 2 },

  /* How it works */
  howSection: {
    marginTop: 20, backgroundColor: "#fff", borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  howTitle: { fontSize: 16, fontFamily: F.bold, color: C.ink, marginBottom: 16 },
  howRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  howIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },
  howText: { flex: 1, fontSize: 13, fontFamily: F.medium, color: C.ink2 },
  howLine: {
    position: "absolute", left: 17, top: 36,
    width: 2, height: 14, backgroundColor: "#E2E8F0",
  },
});

import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Image, StatusBar,
  ScrollView, SafeAreaView, Platform, ActivityIndicator, Alert,
} from "react-native";
import { createRazorpayOrder } from "../../api/services";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";
import { createOrder } from "../../api/services";
import { useAuth } from "../../context/AuthContext";
import { RAZORPAY_KEY_ID } from "../../config/keys";

/* ── Local logo assets ────────────────────────────── */
const LOCAL_LOGOS = {
  gpay:    require("../../../assets/payments/gpay.png"),
  phonepe: require("../../../assets/payments/phonepe.png"),
  icici:   require("../../../assets/payments/icici.png"),
  axis:    require("../../../assets/payments/axis.png"),
  hdfc:    require("../../../assets/payments/hdfc.png"),
};

/* ── Data ─────────────────────────────────────────── */
const UPI_APPS = [
  { id: "phonepe", name: "PhonePe" },
  { id: "navi",    name: "Navi" },
];
const BANKS = [
  { id: "icici", name: "ICICI" },
  { id: "axis",  name: "Axis" },
  { id: "hdfc",  name: "HDFC" },
];

/* ── Logo component ───────────────────────────────── */
function Logo({ id, size = 44 }) {
  const src = LOCAL_LOGOS[id];
  if (src) {
    return (
      <View style={[lg.box, { width: size, height: size, borderRadius: size * 0.27 }]}>
        <Image source={src} style={lg.img} resizeMode="contain" />
      </View>
    );
  }
  // Navi fallback — no local asset available
  if (id === "navi") {
    return (
      <View style={[lg.box, { width: size, height: size, borderRadius: size * 0.27, backgroundColor: "#00B9A0" }]}>
        <Text style={lg.naviTxt}>n</Text>
      </View>
    );
  }
  return <View style={[lg.box, { width: size, height: size, borderRadius: size * 0.27 }]} />;
}
const lg = StyleSheet.create({
  box: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB",
    justifyContent: "center", alignItems: "center", overflow: "hidden",
  },
  img: { width: "70%", height: "70%" },
  naviTxt: { fontSize: 22, fontFamily: F.extraBold, color: "#fff" },
});

/* ════════════════════════════════════════════════════
   SCREEN
════════════════════════════════════════════════════ */
export default function PaymentOptionsScreen({ navigation, route }) {
  const { user } = useAuth();
  const total             = route.params?.total || 0;
  const items             = route.params?.items || 0;
  const prescriptionId    = route.params?.prescriptionId;
  const patientId         = route.params?.patientId;
  const addressId         = route.params?.addressId;
  const pharmacistReview  = route.params?.pharmacistReview;
  const medicines = route.params?.medicines || [];

  const orderCreated = useRef(false);

  const [selected, setSelected]         = useState("gpay");
  const [paying, setPaying]             = useState(false);
  const [showUpiInput, setShowUpiInput] = useState(false);
  const [upiId, setUpiId]               = useState("");
  const [upiError, setUpiError]         = useState("");

  const getMethodName = () => {
    if (selected === "gpay") return "Google Pay";
    if (selected === "newupi") return `UPI (${upiId || "..."})`;
    if (selected === "newcard") return "Card";
    const upi = UPI_APPS.find(a => a.id === selected);
    if (upi) return upi.name;
    const bank = BANKS.find(b => b.id === selected);
    if (bank) return `${bank.name} Net Banking`;
    return "Pay";
  };

const handlePay = async () => {
  // 🚫 Block unsupported method
  if (selected === "newcard") {
    Alert.alert(
      "Card payments coming soon",
      "Please use UPI or Net Banking for now."
    );
    return;
  }

  // 🚫 Validate UPI
  if (selected === "newupi" && (!upiId.trim() || !upiId.includes("@"))) {
    setUpiError("Enter a valid UPI ID (e.g. name@upi)");
    return;
  }

  // 🚫 Prevent duplicate clicks
  if (orderCreated.current) return;

  // 🚫 Validate required data
  if (!patientId || !addressId) {
    Alert.alert(
      "Missing Details",
      "Please add patient details and delivery address before placing the order."
    );
    return;
  }

  orderCreated.current = true;
  setPaying(true);

  const methodName = getMethodName();

  try {
    // ✅ STEP 1: Format medicines
    const formattedMeds = medicines.map((m) => ({
      medicineId: m.medicineId,
      qty: m.qty,
      duration: m.duration,
      freq: {
        m: Number(m.freqLabel?.split("-")[0] || 0),
        a: Number(m.freqLabel?.split("-")[1] || 0),
        n: Number(m.freqLabel?.split("-")[2] || 0),
      },
    }));

    if (!formattedMeds.length) {
      throw new Error("No medicines found");
    }

    // ✅ STEP 2: Create Order payload
const payload = {
  userId: user?.phone,
  patientId,
  addressId,

  // ✅ ONLY send valid ObjectId
  prescriptionId:
    typeof prescriptionId === "string" &&
    prescriptionId.length === 24
      ? prescriptionId
      : null,

  items: formattedMeds,
  totalAmount: total,
};

    console.log("📦 PAYLOAD:", payload);

    // ✅ STEP 3: Create Order
    const orderRes = await createOrder(payload);

    console.log("✅ ORDER RESPONSE:", orderRes);

    // ✅ Extract order (FINAL CORRECT)
   const orderData =
  orderRes?.order ||
  orderRes?.data?.order ||
  orderRes?.data ||
  orderRes;

    if (!orderData || !orderData._id) {
      console.log("❌ INVALID ORDER RESPONSE:", orderRes);
      throw new Error("Order creation failed");
    }

    // ✅ STEP 4: Create Razorpay Order
    const razorpayRes = await createRazorpayOrder(orderData._id);

    console.log("💳 RAZORPAY RESPONSE:", razorpayRes);

    // ✅ Extract Razorpay order
    const razorpayOrder = razorpayRes?.razorpayOrder;

    if (!razorpayOrder || !razorpayOrder.id) {
      console.log("❌ INVALID RAZORPAY RESPONSE:", razorpayRes);
      throw new Error("Failed to create Razorpay order");
    }

    // ✅ STEP 5: Navigate to WebView
    navigation.navigate("RazorpayWebView", {
      razorpayOrder,
      orderData,
      total,
      methodName,
    });

  } catch (error) {
    console.log("❌ PAYMENT ERROR:", error);
    console.log("❌ API ERROR:", error?.response?.data);

    setPaying(false);
    orderCreated.current = false;

    Alert.alert(
      "Payment Failed",
      error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again.",
      [{ text: "Retry" }]
    );
  }
};

  const handleAddUpi = () => {
    setShowUpiInput(true);
    setSelected("newupi");
  };

  const [upiVerified, setUpiVerified] = useState(false);

  const verifyUpi = () => {
    if (!upiId.trim() || !upiId.includes("@")) {
      setUpiError("Enter a valid UPI ID (e.g. name@upi)");
      setUpiVerified(false);
      return;
    }
    setUpiError("");
    setUpiVerified(true);
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={C.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={s.headerTitle}>Payment Options</Text>
          <Text style={s.headerSub}>{items} items. Total: ₹{total}</Text>
        </View>
      </View>
      <View style={s.brandLine} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ═══════ Preferred ═══════ */}
        <Text style={s.section}>Preferred Payment</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.row} activeOpacity={0.85} onPress={() => setSelected("gpay")}>
            <Logo id="gpay" />
            <Text style={s.name}>Google Pay</Text>
            {selected === "gpay"
              ? <Ionicons name="checkmark-circle" size={24} color={C.accent} />
              : <View style={s.emptyRadio} />}
          </TouchableOpacity>
          {selected === "gpay" && (
            <TouchableOpacity style={s.payMethodBtn} activeOpacity={0.85} onPress={handlePay}>
              {paying
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.payMethodBtnTxt}>Pay ₹{total} via Google Pay</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* ═══════ UPI ═══════ */}
        <Text style={s.section}>Pay by any UPI App</Text>
        <View style={s.card}>
          {UPI_APPS.map((app, i) => (
            <View key={app.id}>
              <TouchableOpacity style={s.row} activeOpacity={0.85} onPress={() => { setSelected(app.id); setShowUpiInput(false); }}>
                <Logo id={app.id} />
                <Text style={s.name}>{app.name}</Text>
                {selected === app.id
                  ? <Ionicons name="checkmark-circle" size={24} color={C.accent} />
                  : <View style={s.emptyRadio} />}
              </TouchableOpacity>
              {i < UPI_APPS.length - 1 && <View style={s.divider} />}
            </View>
          ))}
          <View style={s.divider} />
          <TouchableOpacity style={s.row} activeOpacity={0.75} onPress={handleAddUpi}>
            <View style={s.addIcon}><Ionicons name="add" size={20} color={C.accent} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.addTitle}>Add New UPI ID</Text>
              <Text style={s.addSub}>You need to have a registered UPI ID</Text>
            </View>
          </TouchableOpacity>
          {showUpiInput && (
            <View style={s.upiInputWrap}>
              <View style={[s.upiInputRow, upiError && { borderColor: C.red }]}>
                <TextInput
                  style={s.upiInput}
                  placeholder="yourname@upi"
                  placeholderTextColor={C.ink4}
                  value={upiId}
                  onChangeText={(t) => { setUpiId(t.toLowerCase()); setUpiError(""); setUpiVerified(false); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TouchableOpacity style={s.verifyBtn} activeOpacity={0.8} onPress={verifyUpi}>
                  {upiVerified
                    ? <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    : <Text style={s.verifyTxt}>Verify</Text>}
                </TouchableOpacity>
              </View>
              {upiError ? <Text style={s.upiError}>{upiError}</Text> : null}
            </View>
          )}
        </View>

        {/* ═══════ Cards ═══════ */}
        <Text style={s.section}>Debit or Credit card</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.row} activeOpacity={0.75} onPress={() => { setSelected("newcard"); setShowUpiInput(false); }}>
            <View style={s.cardAddIcon}><Ionicons name="card-outline" size={18} color={C.ink3} /></View>
            <Text style={[s.name, { flex: 1 }]}>Add New Card</Text>
            {selected === "newcard"
              ? <Ionicons name="checkmark-circle" size={24} color={C.accent} />
              : <Ionicons name="chevron-forward" size={18} color={C.ink4} />}
          </TouchableOpacity>
        </View>

        {/* ═══════ Net Banking ═══════ */}
        <Text style={s.section}>Net Banking</Text>
        <View style={s.card}>
          <View style={s.bankRow}>
            {BANKS.map((b) => {
              const on = selected === b.id;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[s.bankItem, on && s.bankItemOn]}
                  activeOpacity={0.75}
                  onPress={() => { setSelected(b.id); setShowUpiInput(false); }}
                >
                  <Logo id={b.id} size={48} />
                  <Text style={s.bankName}>{b.name}</Text>
                  {on && (
                    <View style={s.bankCheck}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={s.otherRow} activeOpacity={0.75} onPress={() => Alert.alert("Net banking coming soon", "Support for other banks is being added. Please use UPI or the listed banks for now.")}>
            <Text style={s.otherTxt}>Other Banks</Text>
            <Ionicons name="chevron-forward" size={14} color={C.ink4} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ═══════ Sticky Footer ═══════ */}
      <View style={s.footer}>
        <View style={s.footerLeft}>
          <Text style={s.footerTotal}>₹{total}</Text>
          <Text style={s.footerMethod}>{getMethodName()}</Text>
        </View>
        <TouchableOpacity
          style={[s.footerBtn, (paying || orderCreated.current) && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={handlePay}
          disabled={paying || orderCreated.current}
        >
          {paying
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <Text style={s.footerBtnTxt}>Pay Now</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1F5F9" },

  header: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : (StatusBar.currentHeight || 30) + 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 17, fontFamily: F.bold, color: C.ink },
  headerSub: { fontSize: 12, fontFamily: F.regular, color: C.ink4, marginTop: 2 },
  brandLine: { height: 2, backgroundColor: C.brand },

  scroll: { paddingHorizontal: 16, paddingTop: 4 },

  section: {
    fontSize: 14, fontFamily: F.bold, color: C.ink,
    marginTop: 22, marginBottom: 10, marginLeft: 4,
  },

  card: { backgroundColor: "#fff", borderRadius: 14, overflow: "hidden" },

  row: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  name: { flex: 1, fontSize: 14, fontFamily: F.semiBold, color: C.ink },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginLeft: 74 },
  emptyRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#D1D5DB" },

  payMethodBtn: {
    backgroundColor: C.accent, borderRadius: 10,
    paddingVertical: 12, alignItems: "center",
    marginHorizontal: 16, marginBottom: 14, marginTop: -2,
  },
  payMethodBtnTxt: { fontSize: 14, fontFamily: F.bold, color: "#fff" },

  addIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "#ECFDF5", justifyContent: "center", alignItems: "center",
  },
  addTitle: { fontSize: 13, fontFamily: F.bold, color: C.accent },
  addSub: { fontSize: 11, fontFamily: F.regular, color: C.ink4, marginTop: 2 },

  upiInputWrap: { paddingHorizontal: 16, paddingBottom: 16 },
  upiInputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 10, overflow: "hidden",
  },
  upiInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, fontFamily: F.medium, color: C.ink,
  },
  verifyBtn: { backgroundColor: C.accent, paddingHorizontal: 16, paddingVertical: 12 },
  verifyTxt: { fontSize: 13, fontFamily: F.bold, color: "#fff" },
  upiError: { fontSize: 11, fontFamily: F.regular, color: C.red, marginTop: 6, marginLeft: 4 },

  cardAddIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center",
  },

  bankRow: {
    flexDirection: "row", gap: 12,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16,
  },
  bankItem: {
    alignItems: "center", gap: 6, padding: 6, borderRadius: 14,
    borderWidth: 2, borderColor: "transparent",
  },
  bankItemOn: { borderColor: C.accent, backgroundColor: "#ECFDF5" },
  bankName: { fontSize: 11, fontFamily: F.semiBold, color: C.ink3 },
  bankCheck: {
    position: "absolute", top: 2, right: 2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.accent, justifyContent: "center", alignItems: "center",
  },
  otherRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4,
  },
  otherTxt: { fontSize: 14, fontFamily: F.bold, color: C.ink },

  footer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 30 : 18,
    borderTopWidth: 1, borderTopColor: "#E8ECF0",
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 10,
  },
  footerLeft: { flex: 1 },
  footerTotal: { fontSize: 20, fontFamily: F.extraBold, color: C.ink },
  footerMethod: { fontSize: 11, fontFamily: F.regular, color: C.ink4, marginTop: 2 },
  footerBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.brand, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 24,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  footerBtnTxt: { fontSize: 15, fontFamily: F.bold, color: "#fff" },
});

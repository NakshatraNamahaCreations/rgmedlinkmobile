import React, { useState, useLayoutEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";

/* ── Shared header logo ─────────────────────────────── */
function LogoTitle() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
      <View style={logo.iconWrap}>
        <Ionicons name="leaf" size={14} color="#fff" />
      </View>
      <Text style={logo.text}>
        <Text style={{ color: C.brand }}>RG</Text>
        <Text style={{ color: C.ink }}> MedLink</Text>
      </Text>
    </View>
  );
}
const logo = StyleSheet.create({
  iconWrap: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: C.brand,
    justifyContent: "center", alignItems: "center",
  },
  text: { fontSize: 15, fontFamily: F.extraBold },
});

/* ── Lightning strip ────────────────────────────────── */
function LightningStrip() {
  return (
    <View style={sh.strip}>
      <Text style={sh.stripTxt}>
        <Text style={sh.stripHighlight}>Prescription</Text>
        {" will be processed in\nabout "}
        <Text style={sh.stripHighlight}>1-2 minutes</Text>
      </Text>
      <View style={sh.bolt}>
        <Ionicons name="flash" size={13} color="#fff" />
      </View>
    </View>
  );
}
const sh = StyleSheet.create({
  strip: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF8F0",
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: "#F5E6D8",
  },
  stripTxt:       { flex: 1, fontSize: 12, fontFamily: F.regular, color: C.ink3, lineHeight: 18 },
  stripHighlight: { fontFamily: F.semiBold, color: C.brand },
  bolt: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: "#F59E0B",
    justifyContent: "center", alignItems: "center", marginLeft: 10,
  },
});

/* ── Delivery row ───────────────────────────────────── */
function DeliveryRow({ onAddAddress }) {
  return (
    <View style={dl.row}>
      <Ionicons name="location" size={18} color={C.brand} />
      <View style={{ flex: 1 }}>
        <Text style={dl.label}>Delivering to</Text>
        <Text style={dl.city}>Your location</Text>
      </View>
      <TouchableOpacity onPress={onAddAddress} activeOpacity={0.7}>
        <Text style={dl.add}>Add Address</Text>
      </TouchableOpacity>
    </View>
  );
}
const dl = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center",
    gap: 10, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  label: { fontSize: 11, fontFamily: F.regular, color: C.ink4 },
  city:  { fontSize: 14, fontFamily: F.bold,    color: C.ink },
  add:   { fontSize: 13, fontFamily: F.semiBold, color: C.brand },
});

/* ── Radio option row ──────────────────────────────── */
function RadioOption({ selected, onPress, title, description, last }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[ro.row, !last && ro.divider]}
    >
      {/* Radio dot */}
      <View style={[ro.radio, selected && ro.radioSelected]}>
        {selected && <View style={ro.radioDot} />}
      </View>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <Text style={[ro.title, selected && ro.titleSelected]}>{title}</Text>
        <Text style={ro.desc}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
}
const ro = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "flex-start",
    gap: 14, paddingVertical: 18, paddingHorizontal: 16,
  },
  divider: {
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: "#CBD5E1",
    marginTop: 2,
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  radioSelected: { borderColor: C.brand, backgroundColor: C.brand },
  radioDot: {
    width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#fff",
  },
  title:         { fontSize: 14, fontFamily: F.bold, color: C.ink, marginBottom: 6, lineHeight: 20 },
  titleSelected: { color: C.brand },
  desc:          { fontSize: 12, fontFamily: F.regular, color: C.ink4, lineHeight: 18 },
});

/* ════════════════════════════════════════════════════
   SCREEN
════════════════════════════════════════════════════ */
const OPTIONS = [
  {
    id:    "all",
    title: "Order all Medicines from the prescription",
    desc:  "We will automatically process your prescription and prepare all medicines based on the prescribed dosage and duration.",
  },
  {
    id:    "review",
    title: "Review medicines before ordering",
    desc:  "View the digitized prescription, select the duration you need, or choose specific medicines from your prescription if you don't need everything and confirm medicines before placing your order.",
  },
];

export default function OrderMethodScreen({ navigation, route }) {
  const [method, setMethod] = useState("all");

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: () => <LogoTitle /> });
  }, [navigation]);

  const handleContinue = () => {
    navigation.navigate("Cart", {
      method,
      prescriptionId: route.params?.prescription?._id || route.params?.prescription?.rxId,
    });
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.pageTitle}>
          How would you like to order your{"\n"}medicines?
        </Text>

        {/* Single card with both options */}
        <View style={s.optionsCard}>
          {OPTIONS.map((opt, i) => (
            <RadioOption
              key={opt.id}
              selected={method === opt.id}
              onPress={() => setMethod(opt.id)}
              title={opt.title}
              description={opt.desc}
              last={i === OPTIONS.length - 1}
            />
          ))}
        </View>
      </ScrollView>

      {/* ── Sticky bottom ── */}
      <View style={s.bottom}>
        <LightningStrip />
        <DeliveryRow onAddAddress={() => navigation.navigate("ChooseDeliveryArea")} />
        <TouchableOpacity style={s.btn} activeOpacity={0.85} onPress={handleContinue}>
          <Text style={s.btnTxt}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: "#FAFAFA" },
  scroll: { padding: 20, paddingBottom: 8 },
  pageTitle: {
    fontSize: 18, fontFamily: F.extraBold, color: C.ink,
    lineHeight: 26, marginBottom: 20,
  },
  optionsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1, borderColor: "#E8ECF0",
    overflow: "hidden",
  },
  bottom: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 30 : 18,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  btn: {
    backgroundColor: C.brand,
    borderRadius: 14, paddingVertical: 17,
    alignItems: "center", marginTop: 4,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32, shadowRadius: 14, elevation: 7,
  },
  btnTxt: { fontSize: 16, fontFamily: F.bold, color: "#fff", letterSpacing: 0.3 },
});

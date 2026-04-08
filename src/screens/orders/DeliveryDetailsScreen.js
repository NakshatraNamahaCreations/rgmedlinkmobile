import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";
import { getPatients, getAddresses } from "../../api/services";
import { useAuth } from "../../context/AuthContext";
import Shimmer, { ShimmerCard } from "../../components/Shimmer";

/* helper – pick an icon name based on address type */
const addressIcon = (type) => {
  switch ((type || "").toLowerCase()) {
    case "home":   return "home";
    case "work":   return "business";
    case "office": return "business";
    default:       return "location";
  }
};

/* ════════════════════════════════════════════════════
   SCREEN
════════════════════════════════════════════════════ */
export default function DeliveryDetailsScreen({ navigation, route }) {
  const { user } = useAuth();
  const userId = user?._id || user?.phone || "guest_device";

  const [patients, setPatients]       = useState([]);
  const [addresses, setAddresses]     = useState([]);
  const [loadingPatients, setLoadingPatients]   = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const [selPatient, setSelPatient] = useState(null);
  const [selAddress, setSelAddress] = useState(null);

  const canProceed = selPatient && selAddress;

  /* ── Fetch data whenever screen comes into focus ── */
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      let cancelled = false;

      const fetchPatients = async () => {
        try {
          setLoadingPatients(true);
          const data = await getPatients(userId);
          if (!cancelled) {
            const list = Array.isArray(data) ? data : data?.data || data?.patients || [];
            setPatients(list);
            /* auto-select default or first */
            const def = list.find((p) => p.isDefault) || list[0];
            if (def) setSelPatient(def._id);
          }
        } catch (e) {
          console.log("fetchPatients error:", e);
        } finally {
          if (!cancelled) setLoadingPatients(false);
        }
      };

      const fetchAddresses = async () => {
        try {
          setLoadingAddresses(true);
          const data = await getAddresses(userId);
          if (!cancelled) {
            const list = Array.isArray(data) ? data : data?.data || data?.addresses || [];
            setAddresses(list);
            const def = list.find((a) => a.isDefault) || list[0];
            if (def) setSelAddress(def._id);
          }
        } catch (e) {
          console.log("fetchAddresses error:", e);
        } finally {
          if (!cancelled) setLoadingAddresses(false);
        }
      };

      fetchPatients();
      fetchAddresses();

      return () => { cancelled = true; };
    }, [userId])
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Step indicator ── */}
        <View style={s.steps}>
          <View style={s.stepDone}><Ionicons name="checkmark" size={12} color="#fff" /></View>
          <View style={s.stepLine} />
          <View style={s.stepDone}><Ionicons name="checkmark" size={12} color="#fff" /></View>
          <View style={s.stepLine} />
          <View style={s.stepCurrent}><Text style={s.stepNum}>3</Text></View>
        </View>
        <Text style={s.stepLabel}>Almost there! Confirm delivery details</Text>

        {/* ═══════ Patient ═══════ */}
        <View style={s.sectionRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={s.sectionIcon}><Ionicons name="person" size={14} color={C.brand} /></View>
            <Text style={s.sectionTitle}>Patient</Text>
          </View>
          <TouchableOpacity
            style={s.addBtn}
            activeOpacity={0.75}
            onPress={() => navigation.navigate("PatientDetails")}
          >
            <Ionicons name="add" size={15} color={C.brand} />
            <Text style={s.addBtnTxt}>Add New</Text>
          </TouchableOpacity>
        </View>

        {loadingPatients ? (
          <><ShimmerCard /><ShimmerCard /></>
        ) : patients.length === 0 ? (
          <TouchableOpacity
            style={s.emptyCard}
            activeOpacity={0.75}
            onPress={() => navigation.navigate("PatientDetails")}
          >
            <View style={s.emptyIconWrap}><Ionicons name="person-add-outline" size={24} color={C.ink4} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.emptyTitle}>No patient added</Text>
              <Text style={s.emptySub}>Add patient details to continue</Text>
            </View>
            <View style={s.emptyArrow}><Ionicons name="arrow-forward" size={14} color={C.brand} /></View>
          </TouchableOpacity>
        ) : (
          <View style={s.cardGroup}>
            {patients.map((p, idx) => {
              const on = selPatient === p._id;
              return (
                <TouchableOpacity
                  key={p._id}
                  activeOpacity={0.8}
                  onPress={() => setSelPatient(p._id)}
                  style={[s.patientCard, on && s.patientCardOn, idx < patients.length - 1 && { marginBottom: 8 }]}
                >
                  <View style={[s.patientAvatar, on && s.patientAvatarOn]}>
                    <Text style={[s.patientInitial, on && { color: "#fff" }]}>{p.name?.[0]?.toUpperCase() ?? "?"}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[s.patientName, on && { color: C.brand }]}>{p.name}</Text>
                    <View style={s.patientMeta}>
                      {p.age ? <Text style={s.patientTag}>{p.age} yrs</Text> : null}
                      {p.gender ? <Text style={s.patientTag}>{p.gender}</Text> : null}
                      {p.primaryPhone && p.primaryPhone !== "0000000000" ? <Text style={s.patientTag}>{p.primaryPhone}</Text> : null}
                    </View>
                  </View>

                  <View style={[s.selectCircle, on && s.selectCircleOn]}>
                    {on && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ═══════ Address ═══════ */}
        <View style={[s.sectionRow, { marginTop: 24 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={[s.sectionIcon, { backgroundColor: "#ECFDF5" }]}><Ionicons name="location" size={14} color={C.green} /></View>
            <Text style={s.sectionTitle}>Delivery Address</Text>
          </View>
          <TouchableOpacity
            style={s.addBtn}
            activeOpacity={0.75}
            onPress={() => navigation.navigate("ChooseDeliveryArea")}
          >
            <Ionicons name="add" size={15} color={C.brand} />
            <Text style={s.addBtnTxt}>Add New</Text>
          </TouchableOpacity>
        </View>

        {loadingAddresses ? (
          <><ShimmerCard /><ShimmerCard /></>
        ) : addresses.length === 0 ? (
          <TouchableOpacity
            style={s.emptyCard}
            activeOpacity={0.75}
            onPress={() => navigation.navigate("ChooseDeliveryArea")}
          >
            <View style={[s.emptyIconWrap, { backgroundColor: "#ECFDF5" }]}><Ionicons name="location-outline" size={24} color={C.green} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.emptyTitle}>No address added</Text>
              <Text style={s.emptySub}>Add delivery address to continue</Text>
            </View>
            <View style={s.emptyArrow}><Ionicons name="arrow-forward" size={14} color={C.brand} /></View>
          </TouchableOpacity>
        ) : (
          <View style={s.cardGroup}>
            {addresses.map((a, idx) => {
              const on = selAddress === a._id;
              const displayLine = a.fullAddress || [a.house, a.street, a.city, a.state].filter(Boolean).join(", ");
              return (
                <TouchableOpacity
                  key={a._id}
                  activeOpacity={0.8}
                  onPress={() => setSelAddress(a._id)}
                  style={[s.addrCard, on && s.addrCardOn, idx < addresses.length - 1 && { marginBottom: 8 }]}
                >
                  <View style={[s.addrIcon, on && s.addrIconOn]}>
                    <Ionicons name={addressIcon(a.type)} size={18} color={on ? C.green : C.ink4} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <Text style={[s.addrType, on && { color: C.ink }]}>{a.type || "Home"}</Text>
                      {a.isDefault && <View style={s.defaultTag}><Text style={s.defaultTagText}>Default</Text></View>}
                    </View>
                    <Text style={s.addrLine} numberOfLines={2}>{displayLine}</Text>
                    {a.pincode && <Text style={s.addrPin}>{a.city} - {a.pincode}</Text>}
                  </View>

                  <View style={[s.selectCircle, on && s.selectCircleOn]}>
                    {on && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Trust strip ── */}
        <View style={s.trustRow}>
          <View style={s.trustItem}>
            <Ionicons name="medkit-outline" size={16} color={C.accent} />
            <Text style={s.trustTxt}>Verified{"\n"}Medicines</Text>
          </View>
          <View style={s.trustDivider} />
          <View style={s.trustItem}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#6366F1" />
            <Text style={s.trustTxt}>Secure{"\n"}Payments</Text>
          </View>
          <View style={s.trustDivider} />
          <View style={s.trustItem}>
            <Ionicons name="call-outline" size={16} color="#0EA5E9" />
            <Text style={s.trustTxt}>24/7{"\n"}Support</Text>
          </View>
        </View>

      </ScrollView>

      {/* ═══════ Footer ═══════ */}
      <View style={s.footer}>
        <View style={s.footerInfo}>
          <Ionicons name="shield-checkmark-outline" size={14} color={C.accent} />
          <Text style={s.footerInfoTxt}>100% secure checkout</Text>
        </View>
        <TouchableOpacity
          style={[s.btn, !canProceed && { opacity: 0.4 }]}
          activeOpacity={0.85}
          disabled={!canProceed}
          onPress={() => navigation.navigate("PaymentOptions", {
            total: route.params?.total || 0,
            items: route.params?.items || 0,
            prescriptionId: route.params?.prescriptionId || route.params?.prescription?.rxId,
            patientId: selPatient,
            addressId: selAddress,
            medicines: route.params?.medicines || [],
            pharmacistReview: route.params?.pharmacistReview || false,
            imageUri: route.params?.imageUri,
          })}
        >
          <Text style={s.btnTxt}>Proceed to checkout</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: "#FAFAFA" },
  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 },

  /* ── Steps ── */
  steps: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", marginBottom: 10,
  },
  stepDone: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.accent,
    justifyContent: "center", alignItems: "center",
  },
  stepLine: { width: 36, height: 2, backgroundColor: "#E2E8F0" },
  stepCurrent: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.brand,
    justifyContent: "center", alignItems: "center",
  },
  stepNum: { fontSize: 11, fontFamily: F.bold, color: "#fff" },
  stepLabel: {
    fontSize: 13, fontFamily: F.regular, color: C.ink4,
    textAlign: "center", marginBottom: 26,
  },

  /* ── Section header ── */
  sectionRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 14,
  },
  sectionIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center",
  },
  sectionTitle: { fontSize: 16, fontFamily: F.bold, color: C.ink },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.brandLt, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  addBtnTxt: { fontSize: 12, fontFamily: F.bold, color: C.brand },

  /* Card group */
  cardGroup: {
    backgroundColor: "#fff", borderRadius: 18, overflow: "hidden",
    borderWidth: 1, borderColor: "#F1F5F9",
  },

  /* ── Patient card ── */
  patientCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: "#F8FAFC",
  },
  patientCardOn: { backgroundColor: C.brandLt + "60" },
  patientAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "#F1F5F9",
    justifyContent: "center", alignItems: "center",
  },
  patientAvatarOn: { backgroundColor: C.brand },
  patientInitial: { fontSize: 18, fontFamily: F.extraBold, color: C.ink3 },
  patientName: { fontSize: 15, fontFamily: F.bold, color: C.ink },
  patientMeta: { flexDirection: "row", gap: 6, marginTop: 4 },
  patientTag: {
    fontSize: 11, fontFamily: F.medium, color: C.ink4,
    backgroundColor: "#F8FAFC", borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    overflow: "hidden",
  },

  /* Select circle */
  selectCircle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: "#D1D5DB",
    justifyContent: "center", alignItems: "center",
  },
  selectCircleOn: { borderColor: C.brand, backgroundColor: C.brand },

  /* ── Address card ── */
  addrCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: "#F8FAFC",
  },
  addrCardOn: { backgroundColor: "#ECFDF530" },
  addrIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "#F1F5F9",
    justifyContent: "center", alignItems: "center",
  },
  addrIconOn: { backgroundColor: "#ECFDF5" },
  addrType: { fontSize: 14, fontFamily: F.bold, color: C.ink3 },
  defaultTag: {
    backgroundColor: "#ECFDF5", borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  defaultTagText: { fontSize: 9, fontFamily: F.bold, color: C.green },
  addrLine: { fontSize: 12, fontFamily: F.regular, color: C.ink4, lineHeight: 17 },
  addrPin: { fontSize: 11, fontFamily: F.semiBold, color: C.ink3, marginTop: 3 },

  /* ── Empty card ── */
  emptyCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: "#E2E8F0", borderStyle: "dashed",
    marginBottom: 10,
  },
  emptyIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center",
  },
  emptyTitle: { fontSize: 14, fontFamily: F.bold, color: C.ink },
  emptySub: { fontSize: 12, fontFamily: F.regular, color: C.ink4, marginTop: 1 },
  emptyArrow: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center",
  },

  /* Edit (kept for backward compat) */
  editCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  editCircleOn: { backgroundColor: C.brandLt },

  /* ── Empty / add more ── */
  emptyCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1.5, borderColor: "#E2E8F0", borderStyle: "dashed",
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16,
    marginBottom: 10,
  },
  emptyDashed: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F8FAFC",
    justifyContent: "center", alignItems: "center",
  },
  emptyTxt: { flex: 1, fontSize: 13, fontFamily: F.medium, color: C.ink4 },

  /* ── Trust strip ── */
  trustRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-evenly",
    backgroundColor: "#fff", borderRadius: 16,
    paddingVertical: 16, marginTop: 20,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  trustItem: { alignItems: "center", gap: 6 },
  trustTxt: {
    fontSize: 10, fontFamily: F.semiBold, color: C.ink3,
    textAlign: "center", lineHeight: 14,
  },
  trustDivider: { width: 1, height: 30, backgroundColor: "#F1F5F9" },

  /* ── Footer ── */
  footer: {
    paddingHorizontal: 20, paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 30 : 18,
    backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: "#F1F5F9",
  },
  footerInfo: {
    flexDirection: "row", alignItems: "center", gap: 6,
    justifyContent: "center", marginBottom: 10,
  },
  footerInfoTxt: { fontSize: 11, fontFamily: F.medium, color: C.ink4 },
  btn: {
    backgroundColor: C.brand, borderRadius: 16,
    paddingVertical: 17, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  btnTxt: { fontSize: 16, fontFamily: F.bold, color: "#fff" },
});

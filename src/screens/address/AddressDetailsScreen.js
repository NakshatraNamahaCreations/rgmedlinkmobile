import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, SafeAreaView, Platform, KeyboardAvoidingView,
  Modal, Animated, Pressable, ActivityIndicator, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";
import { saveAddress, updateAddress } from "../../api/services";
import { useAuth } from "../../context/AuthContext";

/* ── Address type config ─────────────────────────────── */
const ADDRESS_TYPES = [
  { id: "Home", icon: "home-outline" },
  { id: "Work", icon: "briefcase-outline" },
  { id: "Other", icon: "location-outline" },
];

/* ── Underline input with error ──────────────────────── */
function Field({ label, value, onChangeText, placeholder, keyboardType, maxLength, half, error }) {
  const [focused, setFocused] = useState(false);
  const hasValue = value && value.length > 0;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 5, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  return (
    <Animated.View style={[fi.wrap, half && { flex: 1 }, { transform: [{ translateX: shakeAnim }] }]}>
      {hasValue && <Text style={[fi.label, error && { color: C.red }]}>{label}</Text>}
      <TextInput
        style={[fi.input, focused && fi.inputFocused, error && fi.inputError]}
        placeholder={placeholder || label}
        placeholderTextColor={C.ink4}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {error ? <Text style={fi.errorTxt}>{error}</Text> : null}
    </Animated.View>
  );
}
const fi = StyleSheet.create({
  wrap: { marginBottom: 6 },
  label: {
    fontSize: 11, fontFamily: F.semiBold, color: C.brand,
    marginBottom: 2, marginLeft: 2,
  },
  input: {
    borderBottomWidth: 1.5, borderBottomColor: "#E8ECF0",
    paddingVertical: 13, paddingHorizontal: 4,
    fontSize: 14, fontFamily: F.medium, color: C.ink,
  },
  inputFocused: { borderBottomColor: C.brand },
  inputError: { borderBottomColor: C.red },
  errorTxt: { fontSize: 11, fontFamily: F.regular, color: C.red, marginTop: 4, marginLeft: 2 },
});

/* ════════════════════════════════════════════════════════
   LOCATION PERMISSION MODAL
════════════════════════════════════════════════════════ */
function LocationModal({ visible, onClose, onGoToSettings }) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 200 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={lm.root}>
        <Animated.View style={[lm.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[lm.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={lm.illustrationWrap}>
            <View style={lm.mapBg}>
              <View style={lm.mapRoad1} />
              <View style={lm.mapRoad2} />
              <View style={lm.mapBlock1} />
              <View style={lm.mapBlock2} />
              <View style={lm.mapBlock3} />
            </View>
            <View style={lm.pinShadow} />
            <View style={lm.pin}>
              <Ionicons name="location" size={26} color={C.ink} />
            </View>
          </View>
          <Text style={lm.title}>Allow Location access</Text>
          <Text style={lm.desc}>
            RG Medlink uses your location to enhance your experience, ensuring you services available in your area.
          </Text>
          <TouchableOpacity style={lm.primaryBtn} activeOpacity={0.85} onPress={onGoToSettings}>
            <Text style={lm.primaryTxt}>Go to settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={lm.secondaryBtn} activeOpacity={0.75} onPress={onClose}>
            <Text style={lm.secondaryTxt}>Not now</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const lm = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 36 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,5,15,0.55)" },
  card: {
    backgroundColor: "#fff", borderRadius: 24,
    paddingHorizontal: 28, paddingTop: 32, paddingBottom: 24,
    alignItems: "center", width: "100%",
    shadowColor: "#000", shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18, shadowRadius: 28, elevation: 24,
  },
  illustrationWrap: { width: 100, height: 90, alignItems: "center", justifyContent: "flex-end", marginBottom: 20 },
  mapBg: {
    position: "absolute", bottom: 0, width: 100, height: 60, borderRadius: 14,
    backgroundColor: "#F1F5F9", overflow: "hidden",
  },
  mapRoad1: { position: "absolute", top: 20, left: 0, right: 0, height: 3, backgroundColor: "#E2E8F0" },
  mapRoad2: { position: "absolute", top: 0, bottom: 0, left: 40, width: 3, backgroundColor: "#E2E8F0" },
  mapBlock1: { position: "absolute", top: 6, left: 8, width: 22, height: 12, borderRadius: 3, backgroundColor: "#DBEAFE" },
  mapBlock2: { position: "absolute", top: 28, left: 10, width: 18, height: 10, borderRadius: 3, backgroundColor: "#FCE7F3" },
  mapBlock3: { position: "absolute", top: 8, right: 10, width: 26, height: 10, borderRadius: 3, backgroundColor: "#FEF3C7" },
  pinShadow: { position: "absolute", bottom: 8, width: 16, height: 6, borderRadius: 3, backgroundColor: "rgba(0,0,0,0.1)" },
  pin: {
    marginBottom: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 6,
  },
  title: { fontSize: 18, fontFamily: F.extraBold, color: C.ink, marginBottom: 10, textAlign: "center" },
  desc: { fontSize: 13, fontFamily: F.regular, color: C.ink3, lineHeight: 20, textAlign: "center", marginBottom: 24 },
  primaryBtn: { backgroundColor: C.brand, borderRadius: 12, paddingVertical: 15, alignItems: "center", width: "100%", marginBottom: 10 },
  primaryTxt: { fontSize: 15, fontFamily: F.bold, color: "#fff" },
  secondaryBtn: { borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 12, paddingVertical: 14, alignItems: "center", width: "100%" },
  secondaryTxt: { fontSize: 15, fontFamily: F.semiBold, color: C.ink3 },
});

/* ════════════════════════════════════════════════════
   SCREEN
════════════════════════════════════════════════════ */
function SuccessModal({ visible, onDone }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 150 }),
        Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 180 }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      checkScale.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <View style={sm.backdrop}>
        <Animated.View style={[sm.card, { transform: [{ scale: scaleAnim }] }]}>
          <Animated.View style={[sm.checkWrap, { transform: [{ scale: checkScale }] }]}>
            <View style={sm.checkCircle}>
              <Ionicons name="checkmark" size={32} color="#fff" />
            </View>
          </Animated.View>
          <Text style={sm.title}>Address Saved!</Text>
          <Text style={sm.sub}>Your delivery address has been saved successfully</Text>
          <TouchableOpacity style={sm.btn} activeOpacity={0.85} onPress={onDone}>
            <Text style={sm.btnText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
const sm = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", alignItems: "center", padding: 30,
  },
  card: {
    backgroundColor: "#fff", borderRadius: 24, padding: 32,
    alignItems: "center", width: "100%",
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15, shadowRadius: 30, elevation: 20,
  },
  checkWrap: { marginBottom: 20 },
  checkCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#10B981",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#10B981", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  title: { fontSize: 20, fontFamily: F.extraBold, color: C.ink, marginBottom: 6 },
  sub: { fontSize: 14, fontFamily: F.regular, color: C.ink3, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  btn: {
    backgroundColor: C.brand, borderRadius: 14,
    paddingVertical: 15, paddingHorizontal: 48,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  btnText: { fontSize: 15, fontFamily: F.bold, color: "#fff" },
});

export default function AddressDetailsScreen({ navigation, route }) {
  const { user } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const params = route.params || {};
  const addressId = params.addressId;
  const [pincode, setPincode]         = useState(params.pincode || "");
  const [address, setAddress]         = useState(params.address || "");
  const [area, setArea]               = useState(params.area || "");
  const [landmark, setLandmark]       = useState("");
  const [city, setCity]               = useState(params.city || "");
  const [state, setState]             = useState(params.state || "");
  const [addrType, setAddrType]       = useState("Home");
  const [showLocModal, setShowLocModal] = useState(false);
  const [errors, setErrors]           = useState({});
  const [saving, setSaving]           = useState(false);
  const scrollRef = useRef(null);

  const validate = () => {
    const e = {};
    if (!pincode.trim())                    e.pincode = "Pincode is required";
    else if (pincode.length !== 6)          e.pincode = "Enter a valid 6-digit pincode";
    if (!address.trim())                    e.address = "Address is required";
    if (!area.trim())                       e.area    = "Area / Colony is required";
    if (!city.trim())                       e.city    = "City is required";
    if (!state.trim())                      e.state   = "State is required";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const data = {
      userId: user?._id || user?.phone || "guest_device",
      type: addrType,
      house: address,
      street: area,
      landmark: landmark || "",
      city,
      state,
      pincode,
      fullAddress: [address, area, landmark, city, state, pincode].filter(Boolean).join(", "),
      latitude: route.params?.lat || 0,
      longitude: route.params?.lng || 0,
      isDefault: true,
    };

    try {
      setSaving(true);
      if (addressId) {
        await updateAddress(addressId, data);
      } else {
        await saveAddress(data);
      }

      // Check where we came from
      const state = navigation.getState();
      const fromSavedAddresses = state.routes.some(r => r.name === "SavedAddresses");

      if (fromSavedAddresses) {
        // Profile → SavedAddresses flow — show success and go back
        setShowSuccess(true);
      } else {
        // Order flow — go to DeliveryDetails to select address + patient
        navigation.navigate("DeliveryDetails", {
          ...route.params,
        });
      }
    } catch (err) {
      Alert.alert("Error", err?.message || "Failed to save address. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Clear individual error on edit
  const update = (key, setter) => (val) => {
    setter(val);
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Pincode + Use Location ── */}
          <View style={s.pincodeSection}>
            <View style={[s.pincodeWrap, errors.pincode && { borderWidth: 1, borderColor: C.red }]}>
              <Ionicons name="map-outline" size={16} color={errors.pincode ? C.red : C.ink4} style={{ marginLeft: 12 }} />
              <TextInput
                style={s.pincodeInput}
                placeholder="Enter Pincode"
                placeholderTextColor={C.ink4}
                keyboardType="number-pad"
                maxLength={6}
                value={pincode}
                onChangeText={(t) => {
                  const v = t.replace(/[^0-9]/g, "");
                  setPincode(v);
                  if (errors.pincode) setErrors((prev) => { const n = { ...prev }; delete n.pincode; return n; });
                }}
                returnKeyType="next"
              />
            </View>
            <TouchableOpacity
              style={s.locationBtn}
              activeOpacity={0.75}
              onPress={() => setShowLocModal(true)}
            >
              <Ionicons name="locate" size={15} color={C.brand} />
              <Text style={s.locationTxt}>Use Current Location</Text>
            </TouchableOpacity>
          </View>
          {errors.pincode ? <Text style={s.fieldError}>{errors.pincode}</Text> : null}

          {/* ── Address fields ── */}
          <View style={s.fieldsCard}>
            <Field
              label="Address"
              placeholder="House / Flat / Floor No."
              value={address}
              onChangeText={update("address", setAddress)}
              error={errors.address}
            />
            <Field
              label="Area"
              placeholder="Area / Colony / Street"
              value={area}
              onChangeText={update("area", setArea)}
              error={errors.area}
            />
            <Field
              label="Landmark"
              placeholder="Landmark (Optional)"
              value={landmark}
              onChangeText={setLandmark}
            />
            <View style={s.twoCol}>
              <Field label="City" value={city} onChangeText={update("city", setCity)} half error={errors.city} />
              <Field label="State" value={state} onChangeText={update("state", setState)} half error={errors.state} />
            </View>
          </View>

          {/* ── Save address as ── */}
          <Text style={s.typeLabel}>Save address as</Text>
          <View style={s.typeRow}>
            {ADDRESS_TYPES.map((type) => {
              const active = addrType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  activeOpacity={0.8}
                  onPress={() => setAddrType(type.id)}
                  style={[s.typePill, active && s.typePillActive]}
                >
                  <Ionicons name={type.icon} size={14} color={active ? "#fff" : C.ink3} />
                  <Text style={[s.typeTxt, active && s.typeTxtActive]}>{type.id}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* ── Save button ── */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.saveTxt}>Save and continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <LocationModal
        visible={showLocModal}
        onClose={() => setShowLocModal(false)}
        onGoToSettings={() => {
          setShowLocModal(false);
          setTimeout(() => navigation.navigate("ChooseDeliveryArea"), 300);
        }}
      />
      <SuccessModal
        visible={showSuccess}
        onDone={() => {
          setShowSuccess(false);
          navigation.navigate("SavedAddresses");
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },

  pincodeSection: {
    flexDirection: "row", alignItems: "center",
    gap: 14, marginBottom: 4,
  },
  pincodeWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12, flex: 0.55, overflow: "hidden",
  },
  pincodeInput: {
    flex: 1,
    paddingHorizontal: 10, paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontSize: 14, fontFamily: F.medium, color: C.ink,
  },
  locationBtn: {
    flexDirection: "row", alignItems: "center", gap: 5, flex: 0.45,
  },
  locationTxt: { fontSize: 12, fontFamily: F.bold, color: C.brand },
  fieldError: { fontSize: 11, fontFamily: F.regular, color: C.red, marginBottom: 10, marginLeft: 2 },

  fieldsCard: { gap: 10, marginBottom: 28, marginTop: 16 },
  twoCol: { flexDirection: "row", gap: 20 },

  typeLabel: {
    fontSize: 12, fontFamily: F.semiBold, color: C.ink4,
    letterSpacing: 0.3, marginBottom: 12, marginLeft: 2,
  },
  typeRow: { flexDirection: "row", gap: 10 },
  typePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1.5, borderColor: "#E2E8F0",
    borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11,
  },
  typePillActive: { borderColor: C.ink, backgroundColor: C.ink },
  typeTxt: { fontSize: 13, fontFamily: F.semiBold, color: C.ink3 },
  typeTxtActive: { color: "#fff" },

  footer: {
    paddingHorizontal: 20, paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 30 : 18,
    borderTopWidth: 1, borderTopColor: "#F1F5F9", backgroundColor: "#fff",
  },
  saveBtn: {
    backgroundColor: C.brand, borderRadius: 14, paddingVertical: 17, alignItems: "center",
    shadowColor: C.brand, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32, shadowRadius: 14, elevation: 7,
  },
  saveTxt: { fontSize: 16, fontFamily: F.bold, color: "#fff" },
});

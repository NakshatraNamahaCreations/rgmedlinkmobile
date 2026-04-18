  import React, { useState, useRef, useEffect } from "react";
  import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, SafeAreaView, Platform, KeyboardAvoidingView, Animated,
    ActivityIndicator, Alert,
  } from "react-native";
  import { Ionicons } from "@expo/vector-icons";
  import { C } from "../../theme/colors";
  import { F } from "../../theme/fonts";
  import { createPatient } from "../../api/services";
  import { useAuth } from "../../context/AuthContext";
  import API from "../../api";

  /* ── Gender options ── */
  const GENDERS = ["Male", "Female", "Other"];

  /* ── Ordering-for options ── */
  const ORDER_FOR = ["Myself", "Someone else"];

  /* ── Underline field with validation ── */
  function Field({ placeholder, value, onChangeText, keyboardType, maxLength, error }) {
    const [focused, setFocused] = useState(false);
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
      <Animated.View style={[fi.wrap, { transform: [{ translateX: shakeAnim }] }]}>
        <TextInput
          style={[fi.input, focused && fi.inputFocused, error && fi.inputError]}
          placeholder={placeholder}
          placeholderTextColor={error ? C.red : C.ink4}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
        />
        {error ? <Text style={fi.errorTxt}>{error}</Text> : null}
      </Animated.View>
    );
  }
  const fi = StyleSheet.create({
    wrap: { marginBottom: 4 },
    input: {
      borderBottomWidth: 1.5, borderBottomColor: "#E8ECF0",
      paddingVertical: 14, paddingHorizontal: 4,
      fontSize: 14, fontFamily: F.medium, color: C.ink,
    },
    inputFocused: { borderBottomColor: C.brand },
    inputError: { borderBottomColor: C.red },
    errorTxt: { fontSize: 11, fontFamily: F.regular, color: C.red, marginTop: 4, marginLeft: 2 },
  });

  /* ── Radio circle ── */
  function Radio({ selected, label, onPress }) {
    return (
      <TouchableOpacity style={rd.row} activeOpacity={0.75} onPress={onPress}>
        <View style={[rd.circle, selected && rd.circleSelected]}>
          {selected && <View style={rd.dot} />}
        </View>
        <Text style={[rd.label, selected && rd.labelSelected]}>{label}</Text>
      </TouchableOpacity>
    );
  }
  const rd = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 8, marginRight: 24 },
    circle: {
      width: 20, height: 20, borderRadius: 10,
      borderWidth: 2, borderColor: "#CBD5E1",
      justifyContent: "center", alignItems: "center",
    },
    circleSelected: { borderColor: C.brand },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.brand },
    label: { fontSize: 14, fontFamily: F.regular, color: C.ink3 },
    labelSelected: { fontFamily: F.semiBold, color: C.ink },
  });

  /* ════════════════════════════════════════════════════
    SCREEN
  ════════════════════════════════════════════════════ */
  export default function PatientDetailsScreen({ navigation, route }) {
    const { user } = useAuth();
    const isEdit = route.params?.isEdit;
    const patientData = route.params?.patientData;
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName]   = useState("");
    const [age, setAge]             = useState("");
    const [email, setEmail]         = useState("");
    const [gender, setGender]       = useState("");
    const [orderFor, setOrderFor]   = useState("Myself");
    const [errors, setErrors]       = useState({});
    const [saving, setSaving]       = useState(false);
    const scrollRef = useRef(null);
    const [secondaryPhone, setSecondaryPhone] = useState("");
    const from = route.params?.from;

    useEffect(() => {
    if (isEdit && patientData) {

    const nameParts = (patientData.name || "").trim().split(" ");

    setFirstName(nameParts[0] || "");
    setLastName(nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

    setAge(patientData.age ? String(patientData.age) : "");
    setEmail(patientData.email || "");
    setSecondaryPhone(patientData.secondaryPhone || "");

    setGender(
      patientData.gender
        ? patientData.gender.charAt(0).toUpperCase() + patientData.gender.slice(1).toLowerCase()
        : ""
    );

    setOrderFor(
      patientData.orderingFor === "someone"
        ? "Someone else"
        : "Myself"
    );
  }
}, [isEdit, patientData]);

    const validate = () => {
      const e = {};

      if (!firstName.trim())               e.firstName = "First name is required";
      else if (firstName.trim().length < 2) e.firstName = "At least 2 characters";

      if (!lastName.trim())                e.lastName = "Last name is required";

      if (!age.trim())                     e.age = "Age is required";
      else {
        const n = parseInt(age, 10);
        if (n < 1 || n > 120)             e.age = "Enter a valid age (1-120)";
      }

      if (email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) e.email = "Enter a valid email address";
      }

  if (secondaryPhone && secondaryPhone.length !== 10) {
    e.secondaryPhone = "Enter valid 10-digit number";
  }
      
      if (!gender)                         e.gender = "Please select gender";

      setErrors(e);
      if (Object.keys(e).length > 0) {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
      return Object.keys(e).length === 0;
    };



const handleSave = async () => {
  if (!validate()) return;

  setSaving(true);

  try {
    const data = {
      userId: user?.phone,
      name: `${firstName} ${lastName}`,
      age: parseInt(age, 10),
      email: email || undefined,
      primaryPhone: user?.phone || "",
      secondaryPhone: secondaryPhone || undefined,
      gender,
      orderingFor: orderFor === "Myself" ? "myself" : "someone",
    };

  let savedPatientId = "";

if (isEdit) {
  await API.put(`/patient-details/${patientData._id}`, data);
  savedPatientId = patientData._id;
} else {
  const res = await createPatient(data);

  // ✅ VERY IMPORTANT
  savedPatientId =
    res?.data?._id ||
    res?.data?.patient?._id ||
    res?._id;
}

    Alert.alert("Success", isEdit ? "Patient updated" : "Patient created");

    // ✅ USE EXISTING 'from'
    if (from === "profile") {
      navigation.goBack();
      return;
    }

  if (from === "review") {
    navigation.navigate({
      name: "ReviewPrescription",
      params: {
        ...route.params,
        patientId: savedPatientId,
      },
      merge: true,
    });
    return;
  }

    navigation.goBack();

  } catch (err) {
    const message =
      err?.response?.data?.message ||
      err?.message ||
      "Something went wrong. Please try again.";

    Alert.alert("Error", message);
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
            {/* ── Form fields ── */}
            <Field
              placeholder="Your First Name"
              value={firstName}
              onChangeText={update("firstName", setFirstName)}
              error={errors.firstName}
            />
            <Field
              placeholder="Your last Name"
              value={lastName}
              onChangeText={update("lastName", setLastName)}
              error={errors.lastName}
            />
            <Field
              placeholder="Your Age"
              value={age}
              onChangeText={(t) => {
                const v = t.replace(/[^0-9]/g, "");
                setAge(v);
                if (errors.age) setErrors((prev) => { const n = { ...prev }; delete n.age; return n; });
              }}
              keyboardType="number-pad"
              maxLength={3}
              error={errors.age}
            />
            <Field
              placeholder="Your Email Id"
              value={email}
              onChangeText={update("email", setEmail)}
              keyboardType="email-address"
              error={errors.email}
            />

              <Field
    placeholder="Secondary Phone Number (optional)"
    value={secondaryPhone}
    onChangeText={(t) => {
      const v = t.replace(/[^0-9]/g, "");
      setSecondaryPhone(v);
    }}
    keyboardType="number-pad"
    maxLength={10}
    error={errors.secondaryPhone}  // ✅ ADD THIS
  />

            {/* ── Gender ── */}
            <Text style={s.sectionLabel}>Gender</Text>
            <View style={s.radioRow}>
              {GENDERS.map((g) => (
                <Radio
                  key={g}
                  label={g}
                  selected={gender === g}
                  onPress={() => {
                    setGender(g);
                    if (errors.gender) setErrors((prev) => { const n = { ...prev }; delete n.gender; return n; });
                  }}
                />
              ))}
            </View>
            {errors.gender ? <Text style={s.errorTxt}>{errors.gender}</Text> : null}

            {/* ── Who are you ordering for? ── */}
            <Text style={s.sectionLabel}>Who are you ordering for?</Text>
            <View style={s.pillRow}>
              {ORDER_FOR.map((opt) => {
                const active = orderFor === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    activeOpacity={0.8}
                    onPress={() => setOrderFor(opt)}
                    style={[s.pill, active && s.pillActive]}
                  >
                    <Text style={[s.pillTxt, active && s.pillTxtActive]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Info note ── */}
            <View style={s.infoRow}>
              <Ionicons name="information-circle-outline" size={16} color={C.brand} />
              <Text style={s.infoTxt}>These details are used for generating invoice</Text>
            </View>
          </ScrollView>

          {/* ── Save button ── */}
          <View style={s.footer}>
            <TouchableOpacity
              style={[s.saveBtn, saving && s.saveBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.saveTxt}>
  {isEdit ? "Update Patient" : "Save and continue"}
</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const s = StyleSheet.create({
    safe:   { flex: 1, backgroundColor: "#fff" },
    scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },

    sectionLabel: {
      fontSize: 14, fontFamily: F.semiBold, color: C.ink,
      marginTop: 22, marginBottom: 14,
    },
    radioRow: {
      flexDirection: "row", alignItems: "center", flexWrap: "wrap",
    },
    errorTxt: {
      fontSize: 11, fontFamily: F.regular, color: C.red, marginTop: 8, marginLeft: 2,
    },

    pillRow: { flexDirection: "row", gap: 10 },
    pill: {
      borderWidth: 1.5, borderColor: "#E2E8F0",
      borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10,
    },
    pillActive: { borderColor: C.brand, backgroundColor: C.brandLt },
    pillTxt: { fontSize: 13, fontFamily: F.semiBold, color: C.ink3 },
    pillTxtActive: { color: C.brand, fontFamily: F.bold },

    infoRow: {
      flexDirection: "row", alignItems: "center", gap: 8,
      marginTop: 28, backgroundColor: "#FDF2F4",
      borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: `${C.brand}15`,
    },
    infoTxt: { flex: 1, fontSize: 13, fontFamily: F.regular, color: C.ink3 },

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
    saveBtnDisabled: { opacity: 0.7 },
    saveTxt: { fontSize: 16, fontFamily: F.bold, color: "#fff" },
  });

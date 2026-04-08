import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Platform, Animated, Image, ActivityIndicator,
  TextInput, Modal, Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";
import { uploadPrescriptionImage, uploadPrescriptionPDF } from "../../api/services";
import { useAuth } from "../../context/AuthContext";

const fCur = (v) => `₹${(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

const FREQ_OPTIONS = [
  { label: "1-0-1", desc: "Morning & Night", m: 1, a: 0, n: 1 },
  { label: "1-1-1", desc: "Morning, Afternoon & Night", m: 1, a: 1, n: 1 },
  { label: "1-0-0", desc: "Morning only", m: 1, a: 0, n: 0 },
  { label: "0-0-1", desc: "Night only", m: 0, a: 0, n: 1 },
  { label: "0-1-0", desc: "Afternoon only", m: 0, a: 1, n: 0 },
  { label: "1-1-0", desc: "Morning & Afternoon", m: 1, a: 1, n: 0 },
  { label: "0-1-1", desc: "Afternoon & Night", m: 0, a: 1, n: 1 },
];

export default function PrescriptionConfirmScreen({ navigation, route }) {
  const { user } = useAuth();
  const { imageUri, fileUri, source } = route.params || {};
  const [processing, setProcessing] = useState(true);
  const [editIdx, setEditIdx] = useState(-1);
  const [editName, setEditName] = useState("");
  const [editFreq, setEditFreq] = useState("1-0-1");
  const [editDur, setEditDur] = useState("5");
  const [showFreqPicker, setShowFreqPicker] = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse loader
  useEffect(() => {
    if (processing) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [processing]);

  // Upload & process
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        let res;
        if (source === "camera" || source === "gallery") {
          res = await uploadPrescriptionImage(imageUri);
        } else if (source === "pdf") {
          res = await uploadPrescriptionPDF(fileUri, user?._id || user?.phone || "temp");
        }

        if (cancelled) return;

        const rx = res?.prescription || {};
        setResult({
          rxId: rx.rxId || `RX-${Date.now()}`,
          doctor: rx.doctor,
          medicines: rx.medicines || [],
          subtotal: rx.subtotal || 0,
          gst: rx.gst || 0,
          total: rx.total || 0,
        });
      } catch (err) {
        console.log("Upload error:", err?.message, err?.response?.data);
        if (!cancelled) {
          setError(err?.response?.data?.message || err?.message || "Upload failed");
          setResult({
            rxId: `RX-${Date.now()}`,
            medicines: [],
            subtotal: 0, gst: 0, total: 0,
          });
        }
      } finally {
        if (!cancelled) {
          setProcessing(false);
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const handleContinue = () => {
    if (totalMeds > 0) {
      // Medicines found — go to review/delivery flow
      navigation.navigate("ReviewPrescription", {
        prescription: result,
        imageUri,
        mode: "all",
        prescriptionId: result?.rxId,
      });
    } else {
      
      navigation.navigate("DeliveryDetails", {
        prescription: result,
        imageUri,
        pharmacistReview: true,
        total: 0,
        items: 0,
      });
    }
  };

  const startEdit = (i, med) => {
    setEditIdx(i);
    setEditName(med.name);
    setEditFreq(med.freqLabel || "1-0-1");
    setEditDur(String(med.duration || 5));
  };

  const saveEdit = (i) => {
    const fo = FREQ_OPTIONS.find((f) => f.label === editFreq) || FREQ_OPTIONS[0];
    const dur = parseInt(editDur, 10) || 5;
    const daily = fo.m + fo.a + fo.n;
    const qty = daily * dur;
    const meds = [...result.medicines];
    const price = meds[i].price || 0;
    meds[i] = {
      ...meds[i],
      name: editName,
      freq: { m: fo.m, a: fo.a, n: fo.n },
      freqLabel: editFreq,
      duration: dur,
      qty,
      subtotal: qty * price,
    };
    const subtotal = meds.reduce((s, m) => s + (m.qty * (m.price || 0)), 0);
    const gst = Math.round(subtotal * 0.12 * 100) / 100;
    setResult({ ...result, medicines: meds, subtotal, gst, total: subtotal + gst });
    setEditIdx(-1);
  };

  const inStockCount = result?.medicines?.filter((m) => m.inStock !== false).length || 0;
  const totalMeds = result?.medicines?.length || 0;

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Processing state ── */}
      {processing && (
        <View style={s.loadingWrap}>
          <Animated.View style={[s.loadingCircle, { transform: [{ scale: pulseAnim }] }]}>
            <ActivityIndicator size="large" color={C.brand} />
          </Animated.View>
          <Text style={s.loadingTitle}>Reading Your Prescription</Text>
          <Text style={s.loadingSub}>Extracting medicine details...</Text>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={s.loadingThumb} resizeMode="cover" />
          )}
          <TouchableOpacity style={s.loadingCancelBtn} activeOpacity={0.7} onPress={() => navigation.goBack()}>
            <Text style={s.loadingCancelTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Result ── */}
      {!processing && result && (
        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
          {/* Header */}
          {/* <View style={s.header}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={C.ink} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Review Prescription</Text>
              <Text style={s.headerSub}>{result.rxId}</Text>
            </View>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={s.headerThumb} resizeMode="cover" />
            )}
          </View> */}

          {/* Status bar */}
          <View style={s.statusBar}>
            {totalMeds > 0 ? (
              <>
                <View style={[s.statusDot, { backgroundColor: inStockCount === totalMeds ? C.green : C.amber }]} />
                <Text style={s.statusText}>
                  {inStockCount === totalMeds
                    ? `All ${totalMeds} medicines available`
                    : `${inStockCount} of ${totalMeds} medicines in stock`}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="information-circle" size={16} color={C.amber} />
                <Text style={s.statusText}>No medicines detected — pharmacist will review</Text>
              </>
            )}
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {/* ── Medicines list ── */}
            {totalMeds > 0 ? (
              <>
                {result.medicines.map((med, i) => (
                  <View key={i} style={s.medCard}>
                    {/* Top row: name + stock + edit */}
                    <View style={s.medTop}>
                      <View style={s.medIcon}>
                        <Ionicons
                          name={med.category === "Syrup" ? "water" : med.category === "Capsule" ? "ellipse" : "tablet-portrait"}
                          size={18} color={C.brand}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.medName}>{med.name}</Text>
                        {med.dosage ? <Text style={s.medDosage}>{med.dosage} · {med.category || "Tablet"}</Text> : <Text style={s.medDosage}>{med.category || "Tablet"}</Text>}
                      </View>
                      <TouchableOpacity
                        style={s.editBtn}
                        activeOpacity={0.7}
                        onPress={() => editIdx === i ? setEditIdx(-1) : startEdit(i, med)}
                      >
                        <Ionicons name={editIdx === i ? "close" : "create-outline"} size={14} color={C.brand} />
                        <Text style={s.editBtnText}>{editIdx === i ? "Cancel" : "Edit"}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Stock badge */}
                    <View style={[s.stockBadge, med.inStock === false ? s.stockOut : s.stockIn]}>
                      <View style={[s.stockDot, { backgroundColor: med.inStock === false ? C.red : C.green }]} />
                      <Text style={[s.stockText, { color: med.inStock === false ? C.red : C.green }]}>
                        {med.inStock === false ? "Out of Stock" : "In Stock"}
                      </Text>
                    </View>

                    {/* ── Edit panel ── */}
                    {editIdx === i ? (
                      <View style={s.editPanel}>
                        {/* Medicine name */}
                        <Text style={s.editLabel}>MEDICINE NAME</Text>
                        <TextInput
                          style={s.editInput}
                          value={editName}
                          onChangeText={setEditName}
                          placeholder="Enter medicine name"
                          placeholderTextColor={C.ink4}
                        />

                        {/* Frequency */}
                        <Text style={s.editLabel}>FREQUENCY</Text>
                        <TouchableOpacity style={s.freqSelect} activeOpacity={0.7} onPress={() => setShowFreqPicker(true)}>
                          <Text style={s.freqVal}>{editFreq}</Text>
                          <Text style={s.freqDesc}>{FREQ_OPTIONS.find((f) => f.label === editFreq)?.desc}</Text>
                          <Ionicons name="chevron-down" size={14} color={C.ink4} />
                        </TouchableOpacity>

                        {/* Duration */}
                        <Text style={s.editLabel}>DURATION (DAYS)</Text>
                        <View style={s.durRow}>
                          <TouchableOpacity style={s.durBtn} onPress={() => setEditDur(String(Math.max(1, (parseInt(editDur) || 5) - 1)))}>
                            <Text style={s.durBtnTxt}>−</Text>
                          </TouchableOpacity>
                          <TextInput
                            style={s.durInput}
                            value={editDur}
                            onChangeText={setEditDur}
                            keyboardType="numeric"
                            maxLength={3}
                          />
                          <TouchableOpacity style={s.durBtn} onPress={() => setEditDur(String((parseInt(editDur) || 5) + 1))}>
                            <Text style={s.durBtnTxt}>+</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Live preview */}
                        <View style={s.calcPreview}>
                          <Ionicons name="calculator-outline" size={14} color="#2563EB" />
                          <Text style={s.calcText}>
                            {(() => {
                              const fo = FREQ_OPTIONS.find((f) => f.label === editFreq) || FREQ_OPTIONS[0];
                              const d = parseInt(editDur) || 5;
                              const daily = fo.m + fo.a + fo.n;
                              return `${daily}/day × ${d} days = ${daily * d} ${med.unit || "tablets"}`;
                            })()}
                          </Text>
                        </View>

                        {/* Save */}
                        <TouchableOpacity style={s.saveEditBtn} activeOpacity={0.85} onPress={() => saveEdit(i)}>
                          <Ionicons name="checkmark" size={16} color="#fff" />
                          <Text style={s.saveEditText}>Save Changes</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        {/* Details grid (read-only) */}
                        <View style={s.medGrid}>
                          <View style={s.gridItem}>
                            <Text style={s.gridLabel}>Frequency</Text>
                            <Text style={s.gridVal}>{med.freqLabel || "1-0-1"}</Text>
                            <Text style={s.gridSub}>
                              {[med.freq?.m && "Morn", med.freq?.a && "Aftn", med.freq?.n && "Night"].filter(Boolean).join(" · ")}
                            </Text>
                          </View>
                          <View style={s.gridItem}>
                            <Text style={s.gridLabel}>Duration</Text>
                            <Text style={s.gridVal}>{med.duration || 5} days</Text>
                            <Text style={s.gridSub}>
                              {(med.freq?.m || 0) + (med.freq?.a || 0) + (med.freq?.n || 0)}/day × {med.duration || 5}d
                            </Text>
                          </View>
                          <View style={s.gridItem}>
                            <Text style={s.gridLabel}>Qty Required</Text>
                            <Text style={[s.gridVal, { color: C.brand }]}>{med.qty}</Text>
                            <Text style={s.gridSub}>{med.unit || "Tablets"}</Text>
                          </View>
                        </View>
                        {med.price > 0 && (
                          <View style={s.priceRow}>
                            <Text style={s.priceLabel}>{fCur(med.price)}/{med.unit || "tab"} × {med.qty}</Text>
                            <Text style={s.priceVal}>{fCur(med.subtotal)}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                ))}

                {/* Frequency picker modal */}
                <Modal visible={showFreqPicker} transparent animationType="slide" onRequestClose={() => setShowFreqPicker(false)}>
                  <Pressable style={s.modalBg} onPress={() => setShowFreqPicker(false)}>
                    <View style={s.modalSheet}>
                      <Text style={s.modalTitle}>Select Frequency</Text>
                      {FREQ_OPTIONS.map((f) => (
                        <TouchableOpacity
                          key={f.label}
                          style={[s.modalRow, editFreq === f.label && s.modalRowActive]}
                          activeOpacity={0.7}
                          onPress={() => { setEditFreq(f.label); setShowFreqPicker(false); }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[s.modalFreq, editFreq === f.label && { color: C.brand }]}>{f.label}</Text>
                            <Text style={s.modalDesc}>{f.desc}</Text>
                          </View>
                          {editFreq === f.label && <Ionicons name="checkmark-circle" size={20} color={C.brand} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Pressable>
                </Modal>

                {/* ── Bill summary ── */}
                {result.subtotal > 0 && (
                  <View style={s.billCard}>
                    <Text style={s.billTitle}>Bill Summary</Text>
                    <View style={s.billRow}>
                      <Text style={s.billLabel}>Subtotal ({totalMeds} items)</Text>
                      <Text style={s.billVal}>{fCur(result.subtotal)}</Text>
                    </View>
                    <View style={s.billRow}>
                      <Text style={s.billLabel}>GST (12%)</Text>
                      <Text style={s.billVal}>{fCur(result.gst)}</Text>
                    </View>
                    <View style={s.billDivider} />
                    <View style={s.billRow}>
                      <Text style={s.billTotal}>Total</Text>
                      <Text style={s.billTotalVal}>{fCur(result.total)}</Text>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <>
              <View style={s.emptyCard}>
                {imageUri && (
                  <Image source={{ uri: imageUri }} style={s.emptyImg} resizeMode="contain" />
                )}
                <View style={s.emptyBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={C.green} />
                  <Text style={s.emptyBadgeText}>Prescription Uploaded</Text>
                </View>
                <Text style={s.emptyTitle}>We'll handle this for you</Text>
                <Text style={s.emptySub}>
                  Our pharmacist will review your prescription, verify the medicines, and prepare your order with the correct dosage.
                </Text>
              </View>

              {/* Steps */}
              <View style={s.stepsCard}>
                {[
                  { num: "1", icon: "location", text: "Add your delivery address", color: C.brand },
                  { num: "2", icon: "person", text: "Add patient details", color: "#7C3AED" },
                  { num: "3", icon: "shield-checkmark", text: "Pharmacist reviews your Rx", color: C.green },
                  { num: "4", icon: "bicycle", text: "Medicines delivered to you", color: "#D97706" },
                ].map((step, i) => (
                  <View key={i} style={[s.stepRow, i < 3 && s.stepBorder]}>
                    <View style={[s.stepIcon, { backgroundColor: step.color + "15" }]}>
                      <Ionicons name={step.icon} size={16} color={step.color} />
                    </View>
                    <Text style={s.stepText}>{step.text}</Text>
                    <Ionicons name="chevron-forward" size={14} color={C.ink5} />
                  </View>
                ))}
              </View>
              </>
            )}

            {/* Doctor info */}
            {result.doctor && result.doctor !== "To be verified" && (
              <View style={s.doctorRow}>
                <Ionicons name="person-circle-outline" size={18} color={C.ink3} />
                <Text style={s.doctorText}>Prescribed by {result.doctor}</Text>
              </View>
            )}
          </ScrollView>

          {/* ── Footer ── */}
          <View style={s.footer}>
            <TouchableOpacity style={s.continueBtn} activeOpacity={0.85} onPress={handleContinue}>
              <Text style={s.continueTxt}>
                {totalMeds > 0 ? "Proceed to Order" : "Add Delivery Details"}
              </Text>
              <View style={s.continueArrow}>
                <Ionicons name="arrow-forward" size={16} color={C.brand} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={s.retakeBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
              <Ionicons name="camera-outline" size={16} color={C.ink3} />
              <Text style={s.retakeTxt}>Retake / Upload Another</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },

  /* Loading */
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  loadingCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center", marginBottom: 20,
  },
  loadingTitle: { fontSize: 18, fontFamily: F.bold, color: C.ink, marginBottom: 4 },
  loadingSub: { fontSize: 13, fontFamily: F.regular, color: C.ink4 },
  loadingThumb: {
    width: 120, height: 80, borderRadius: 12,
    marginTop: 30, opacity: 0.4,
  },
  loadingCancelBtn: {
    marginTop: 24, paddingVertical: 10, paddingHorizontal: 28,
    borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 12,
  },
  loadingCancelTxt: { fontSize: 14, fontFamily: F.semiBold, color: C.ink3 },

  /* Header */
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 8 : 4, paddingBottom: 14,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 17, fontFamily: F.bold, color: C.ink },
  headerSub: { fontSize: 11, fontFamily: F.regular, color: C.ink4, marginTop: 1 },
  headerThumb: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0" },

  /* Status bar */
  statusBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontFamily: F.semiBold, color: C.ink2 },

  scroll: { padding: 16, paddingBottom: 20 },

  /* Medicine card */
  medCard: {
    backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  medTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  medIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center",
  },
  medName: { fontSize: 15, fontFamily: F.bold, color: C.ink },
  medDosage: { fontSize: 12, fontFamily: F.regular, color: C.ink4, marginTop: 1 },

  editBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, borderColor: C.brand + "30",
    backgroundColor: C.brandLt,
  },
  editBtnText: { fontSize: 11, fontFamily: F.bold, color: C.brand },

  stockBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    marginTop: 10,
  },
  stockIn: { backgroundColor: C.greenBg },
  stockOut: { backgroundColor: C.redBg },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockText: { fontSize: 10, fontFamily: F.bold },

  /* Grid */
  medGrid: {
    flexDirection: "row", gap: 8, marginBottom: 12,
  },
  gridItem: {
    flex: 1, backgroundColor: "#F8FAFC", borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  gridLabel: { fontSize: 9, fontFamily: F.semiBold, color: C.ink4, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 },
  gridVal: { fontSize: 16, fontFamily: F.extraBold, color: C.ink },
  gridSub: { fontSize: 10, fontFamily: F.regular, color: C.ink4, marginTop: 2 },

  /* Price row */
  priceRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9",
  },
  priceLabel: { fontSize: 12, fontFamily: F.regular, color: C.ink3 },
  priceVal: { fontSize: 15, fontFamily: F.extraBold, color: C.ink },

  /* Bill */
  billCard: {
    backgroundColor: "#fff", borderRadius: 18, padding: 18, marginBottom: 12,
    borderWidth: 1.5, borderColor: C.brand + "20",
  },
  billTitle: { fontSize: 15, fontFamily: F.bold, color: C.ink, marginBottom: 14 },
  billRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  billLabel: { fontSize: 13, fontFamily: F.regular, color: C.ink3 },
  billVal: { fontSize: 13, fontFamily: F.semiBold, color: C.ink2 },
  billDivider: { height: 1.5, backgroundColor: "#F1F5F9", marginVertical: 10 },
  billTotal: { fontSize: 15, fontFamily: F.bold, color: C.ink },
  billTotalVal: { fontSize: 17, fontFamily: F.extraBold, color: C.brand },

  /* Empty */
  emptyCard: {
    backgroundColor: "#fff", borderRadius: 18, padding: 20, alignItems: "center",
    borderWidth: 1, borderColor: "#F1F5F9", marginBottom: 14,
  },
  emptyImg: {
    width: "100%", height: 200, borderRadius: 14, marginBottom: 16,
    backgroundColor: "#F8FAFC",
  },
  emptyBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.greenBg, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, marginBottom: 12,
    borderWidth: 1, borderColor: "#D1FAE5",
  },
  emptyBadgeText: { fontSize: 12, fontFamily: F.bold, color: C.green },
  emptyTitle: { fontSize: 17, fontFamily: F.bold, color: C.ink, marginBottom: 6 },
  emptySub: { fontSize: 13, fontFamily: F.regular, color: C.ink3, textAlign: "center", lineHeight: 20 },

  /* Steps */
  stepsCard: {
    backgroundColor: "#fff", borderRadius: 18, overflow: "hidden",
    borderWidth: 1, borderColor: "#F1F5F9", marginBottom: 12,
  },
  stepRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  stepBorder: { borderBottomWidth: 1, borderBottomColor: "#F8FAFC" },
  stepIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },
  stepText: { flex: 1, fontSize: 14, fontFamily: F.medium, color: C.ink2 },

  /* Edit panel */
  editPanel: {
    marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: "#F1F5F9",
  },
  editLabel: {
    fontSize: 10, fontFamily: F.semiBold, color: C.ink3,
    marginBottom: 6, marginTop: 10, letterSpacing: 0.5,
  },
  editInput: {
    borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, fontFamily: F.medium, color: C.ink,
    backgroundColor: "#F8FAFC",
  },
  freqSelect: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#F8FAFC",
  },
  freqVal: { fontSize: 14, fontFamily: F.bold, color: C.ink },
  freqDesc: { flex: 1, fontSize: 12, fontFamily: F.regular, color: C.ink4 },
  durRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  durBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#F1F5F9",
    justifyContent: "center", alignItems: "center",
  },
  durBtnTxt: { fontSize: 18, fontFamily: F.bold, color: C.ink2 },
  durInput: {
    flex: 1, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 16, fontFamily: F.bold, color: C.ink, textAlign: "center",
    backgroundColor: "#F8FAFC",
  },
  calcPreview: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#EFF6FF", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, marginTop: 12,
  },
  calcText: { fontSize: 12, fontFamily: F.semiBold, color: "#2563EB" },
  saveEditBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: C.brand, borderRadius: 10, paddingVertical: 12, marginTop: 12,
  },
  saveEditText: { fontSize: 13, fontFamily: F.bold, color: "#fff" },

  /* Freq picker modal */
  modalBg: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  modalTitle: { fontSize: 16, fontFamily: F.bold, color: C.ink, marginBottom: 14 },
  modalRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F8FAFC",
  },
  modalRowActive: { backgroundColor: C.brandLt, borderRadius: 10, paddingHorizontal: 10 },
  modalFreq: { fontSize: 15, fontFamily: F.bold, color: C.ink },
  modalDesc: { fontSize: 12, fontFamily: F.regular, color: C.ink4, marginTop: 1 },

  /* Doctor */
  doctorRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    justifyContent: "center", paddingVertical: 12,
  },
  doctorText: { fontSize: 12, fontFamily: F.medium, color: C.ink3 },

  /* Footer */
  footer: {
    paddingHorizontal: 20, paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    gap: 10, borderTopWidth: 1, borderTopColor: "#F1F5F9",
    backgroundColor: "#fff",
  },
  continueBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: C.brand, borderRadius: 16, paddingVertical: 17,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 7,
  },
  continueTxt: { fontSize: 16, fontFamily: F.bold, color: "#fff" },
  continueArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
  },
  retakeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 14,
  },
  retakeTxt: { fontSize: 14, fontFamily: F.semiBold, color: C.ink3 },
});

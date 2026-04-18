  import React, { useState, useLayoutEffect, useEffect } from "react";
  import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    SafeAreaView, Platform, Alert,
  } from "react-native";
  import { Ionicons } from "@expo/vector-icons";
  import { C } from "../../theme/colors";
  import { F } from "../../theme/fonts";

  /* ── Logo header ─────────────────────────────────────── */
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
      backgroundColor: C.brand, justifyContent: "center", alignItems: "center",
    },
    text: { fontSize: 15, fontFamily: F.extraBold },
  });

  const fCur = (v) => `₹${(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

  /* ── Medicine card (read-only) ───────────────────────── */
  function MedicineCard({ med, selected, onToggle, onEdit }) {
    return (
      <View style={mc.card}>
        <View style={mc.topRow}>
          <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
            <Ionicons
              name={selected ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={selected ? C.accent : C.ink5}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onEdit(med)}>
    <Text style={{ color: "red", marginTop: 5 }}>Edit</Text>
  </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={mc.name}>{med.name}</Text>
            <Text style={mc.detail}>Frequency: {med.freqLabel}</Text>
            <Text style={mc.detail}>Duration: {med.duration}</Text>
            <Text style={mc.detail}>Quantity: {med.qty} {med.unit}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            {med.originalPrice > med.price && <Text style={mc.originalPrice}>₹{med.originalPrice}</Text>}
            {med.price > 0 && <Text style={mc.price}>₹{med.price}</Text>}
          </View>
        </View>
        {med.inStock ? (
          <View style={mc.stockBadge}>
            <Ionicons name="checkmark-circle" size={12} color={C.accent} />
            <Text style={mc.stockTxt}>In Stock</Text>
          </View>
        ) : (
          <View style={[mc.stockBadge, mc.outOfStockBadge]}>
            <Ionicons name="close-circle" size={12} color={C.red} />
            <Text style={mc.outOfStockTxt}>Out of Stock</Text>
          </View>
        )}
      </View>
    );
  }
  const mc = StyleSheet.create({
    card: {
      backgroundColor: "#fff", borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: "#F1F5F9", marginBottom: 12,
    },
    topRow: { flexDirection: "row", gap: 12 },
    name: { fontSize: 14, fontFamily: F.bold, color: C.ink, marginBottom: 4 },
    detail: { fontSize: 12, fontFamily: F.regular, color: C.ink4, lineHeight: 18 },
    originalPrice: {
      fontSize: 12, fontFamily: F.regular, color: C.ink4,
      textDecorationLine: "line-through",
    },
    price: { fontSize: 15, fontFamily: F.bold, color: C.ink, marginTop: 2 },
    stockBadge: {
      flexDirection: "row", alignItems: "center", gap: 4,
      marginTop: 10, marginLeft: 34, alignSelf: "flex-start",
      backgroundColor: "#ECFDF5", borderRadius: 6,
      paddingHorizontal: 8, paddingVertical: 3,
    },
    stockTxt: { fontSize: 11, fontFamily: F.semiBold, color: C.accent },
    outOfStockBadge: { backgroundColor: "#FEF2F2", borderRadius: 6, borderWidth: 0 },
    outOfStockTxt: { fontSize: 11, fontFamily: F.semiBold, color: C.red },
  });

  /* ── Bill row ────────────────────────────────────────── */
  function BillRow({ label, original, value, bold, underline, green }) {
    return (
      <View style={br.row}>
        <Text style={[br.label, underline && br.underline, bold && br.bold]}>{label}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {original ? <Text style={br.strike}>₹{original}</Text> : null}
          <Text style={[
            br.val,
            bold && br.bold,
            green && { color: C.accent },
          ]}>
            {typeof value === "number" ? `₹${value.toFixed(2)}` : value}
          </Text>
        </View>
      </View>
    );
  }
  const br = StyleSheet.create({
    row: {
      flexDirection: "row", justifyContent: "space-between",
      alignItems: "center", paddingVertical: 6,
    },
    label: { fontSize: 13, fontFamily: F.regular, color: C.ink3 },
    val: { fontSize: 13, fontFamily: F.semiBold, color: C.ink },
    bold: { fontFamily: F.bold, fontSize: 14, color: C.ink },
    strike: {
      fontSize: 12, fontFamily: F.regular, color: C.ink4,
      textDecorationLine: "line-through",
    },
    underline: { textDecorationLine: "underline" },
  });

  /* ════════════════════════════════════════════════════
    SCREEN
  ════════════════════════════════════════════════════ */
  export default function ReviewPrescriptionScreen({ navigation, route }) {
    const mode = route.params?.mode || "all";
    const isReview = mode === "review";
    const rx = route.params?.prescription || {};
  


    const calculateQty = (freqLabel, duration) => {
    if (!freqLabel || !duration) return 0;

    const parts = freqLabel.split("-").map(Number);

    const perDay = parts.reduce((sum, val) => sum + val, 0);

    return perDay * duration;
  };



  const handleUpdateMedicine = (updatedMedicine) => {
    setMedicines(prev => {
      const updatedList = prev.map(m => {
        if (m.id.toString() === updatedMedicine.id.toString()) {

          const newQty = calculateQty(
            updatedMedicine.freqLabel,
            updatedMedicine.duration
          );

          // ✅ SAFE UNIT PRICE
          const unitPrice =
            m.unitPrice && m.unitPrice > 0
              ? m.unitPrice
              : (m.price / (m.qty || 1));

          const newPrice = newQty * unitPrice;

          return {
            ...m,
            duration: updatedMedicine.duration,
            freqLabel: updatedMedicine.freqLabel,
            qty: newQty,
            unitPrice,
            price: newPrice,

            // ✅ IMPORTANT FIX (REMOVE STRIKE PRICE)
            originalPrice: newPrice,
          };
        }

        return m;
      });

      return updatedList;
    });

    // ✅ KEEP ITEM SELECTED AFTER EDIT
    setSelected(prev =>
      prev.includes(updatedMedicine.id)
        ? prev
        : [...prev, updatedMedicine.id]
    );
  };


  const handleEdit = (med) => {
    navigation.navigate("EditMedicineScreen", {
      medicine: med,
      onSave: handleUpdateMedicine, 
    });
  };
    // Build medicines from prescription data
const buildMeds = () => {
  const medsArray = rx.medicines || rx.meds || [];

  if (!medsArray.length) return [];

  return medsArray
    .map((m, i) => {
      const basePrice = m.subtotal || m.price || 0;
      const baseQty = m.qty || 1;

      // ✅ GET REAL MEDICINE ID ONLY
      const medicineId =
        m.medicineId ||                 // ✅ from upload API (MOST IMPORTANT)
        m.medicine?._id?.toString() ||  // ✅ populated object
        m.medicine?.toString();         // ✅ fallback

      return {
        // ⚠️ UI ID (safe fallback allowed here ONLY)
        id: medicineId || `temp-${i}`,

        // ✅ REAL ID (NO FALLBACK HERE)
        medicineId: medicineId,

        name: m.name || m.medicine?.name || "Unknown Medicine",

        freqLabel:
          m.freqLabel ||
          `${m.freq?.m || 0}-${m.freq?.a || 0}-${m.freq?.n || 0}`,

        duration: m.duration || 0,

        qty: baseQty,

        unitPrice: baseQty > 0 ? basePrice / baseQty : 0,

        unit: m.unit || m.medicine?.unit || "tablet",

        price: basePrice,
        originalPrice: basePrice,

        inStock: m.inStock !== false,
      };
    })

    // 🚨 CRITICAL: REMOVE INVALID MEDICINES
    .filter((m) => m.medicineId);
};

  const initialMeds = buildMeds();

  const [medicines, setMedicines] = useState(initialMeds);
  const [selected, setSelected]   = useState(initialMeds.map(m => m.id));
    const [coupon, setCoupon]       = useState(null);

  useEffect(() => {
    const meds = buildMeds();

    setMedicines(meds);
    setSelected(meds.map(m => m.id));

  }, [route.params?.prescription]);

    useLayoutEffect(() => {
      navigation.setOptions({ headerTitle: () => <LogoTitle /> });
    }, [navigation]);

  const toggleMed = (id) => {
    const med = medicines.find(m => m.id === id);

    if (!med.inStock) {
      Alert.alert("Out of Stock", `${med.name} is currently unavailable`);
      return;
    }

    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

    // Calculations from actual data
    const selectedMeds = medicines.filter(m => selected.includes(m.id));
    const itemTotal    = selectedMeds.reduce((s, m) => s + m.price, 0);
    const couponDisc   = coupon ? 49 : 0;
    const deliveryFee  = itemTotal >= 499 ? 0 : 50;
   const gst = selectedMeds.reduce((sum, m) => {
  const pct = m.gstPct || 12;
  return sum + (m.price * pct) / 100;
}, 0);
    const toPay        = itemTotal - couponDisc + deliveryFee + gst;
    const origTotal    = selectedMeds.reduce((s, m) => s + m.originalPrice, 0);

    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Title ── */}
          <Text style={s.title}>
            {isReview ? "Review Your Prescription" : "Order Summary"}
          </Text>
          <Text style={s.subtitle}>
            {isReview
              ? "Your Prescription has been digitized. Review medicines before placing your order"
              : "We will process all medicines from your prescription based on the prescribed dosage and duration"}
          </Text>

          {/* ── Prescription card ── */}
          <View style={s.rxCard}>
            <View style={s.rxRow}>
              <View style={s.rxIconWrap}>
                <Ionicons name="document-text" size={24} color={C.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={s.rxTitle}>Prescription Uploaded</Text>
                  <Ionicons name="checkmark-circle" size={14} color={C.accent} />
                </View>
                <Text style={s.rxDetail}>Date: <Text style={s.rxBold}>{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</Text></Text>
                {rx.doctor && rx.doctor !== "To be verified" && (
                  <Text style={s.rxDetail}>Doctor: <Text style={s.rxBold}>{rx.doctor}</Text></Text>
                )}
              </View>
            </View>
            <TouchableOpacity style={s.viewRxBtn} activeOpacity={0.8} onPress={() => Alert.alert("Prescription", "Your prescription has been uploaded and verified.")}>
              <Text style={s.viewRxTxt}>View Prescription</Text>
            </TouchableOpacity>
          </View>


          {/* ── Medicine list ── */}
          <View style={s.medHeader}>
            <View style={s.dividerFull} />
            <Text style={s.medCount}>{selectedMeds.length} items</Text>
          </View>

        {medicines.map((med, index) => (
            <MedicineCard
    key={med.id}
    med={med}
    selected={selected.includes(med.id)}
    onToggle={() => toggleMed(med.id)}
  onEdit={() => handleEdit(med)}
  />
          ))}

          {/* ── Discounts ── */}
          <View style={s.dividerFull} />
          <Text style={s.sectionTitle}>Get more discounts</Text>
          <View style={s.dividerFull} />

          {/* Coupon applied */}
          {coupon ? (
            <View style={s.couponCard}>
              <Ionicons name="checkmark-circle" size={18} color={C.accent} />
              <View style={{ flex: 1 }}>
                <Text style={s.couponName}>{coupon} applied</Text>
                <Text style={s.couponSaved}>You Saved ₹{couponDisc}</Text>
              </View>
              <TouchableOpacity onPress={() => setCoupon(null)} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={18} color={C.red} />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ── Bill details ── */}
          <View style={s.dividerFull} />
          <View style={s.billHeader}>
            <Text style={s.billTitle}>BILL DETAILS</Text>
            <Text style={s.billCount}>{selectedMeds.length} items</Text>
          </View>

          <BillRow label="Item Total" value={itemTotal} />
          {couponDisc > 0 && <BillRow label="Coupon Discount" value={`-₹${couponDisc}`} green />}
          <BillRow label="Delivery Fee" value={deliveryFee} />
          <BillRow label="GST and Charges" value={gst} underline />

          <View style={s.billDivider} />
          <BillRow label="To Pay" value={toPay} bold />

          {/* ── Cancellation note ── */}
          <View style={s.noteCard}>
            <Text style={s.noteTxt}>
              <Text style={s.noteBold}>NOTE: </Text>
              Orders cannot be cancelled and are non-refundable once packaged for delivery.
            </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => Alert.alert("Cancellation Policy", "Orders can be cancelled before they are packed for delivery. Once packed, orders cannot be cancelled or refunded. For assistance, please contact our support team.")}>
              <Text style={s.noteLink}>Read cancellation Policy</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* ── Sticky bottom ── */}
        <View style={s.footer}>
          {/* To Pay bar */}
          <View style={s.payBar}>
            <Text style={s.payBarLabel}>To Pay</Text>
            <Text style={s.payBarVal}>₹{toPay.toFixed(2)}</Text>
          </View>

          {/* Deliver to */}
          <View style={s.fInfoRow}>
            <View style={s.fBadge}><Text style={s.fBadgeTxt}>Deliver to</Text></View>
            <Text style={s.fInfoVal} numberOfLines={1}>Add delivery address</Text>
          </View>
          <View style={s.fAddrRow}>
            <Text style={s.fAddrTxt} numberOfLines={1}>Tap to add address</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate("ChooseDeliveryArea")}>
              <Text style={s.fChange}>Change</Text>
            </TouchableOpacity>
          </View>

          {/* Patient */}
          <View style={[s.fInfoRow, { marginTop: 8 }]}>
            <View style={s.fBadge}><Text style={s.fBadgeTxt}>Patient</Text></View>
          <Text style={s.fInfoVal}>
          "Select in next step"
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            navigation.navigate("PatientDetails", {
               ...route.params,
              from: "review",
               // ✅ VERY IMPORTANT
            })
          }
        >
          <Text style={s.fChange}>Change</Text>
        </TouchableOpacity>
          </View>

          {/* Pay + Place Order */}
          <View style={s.fPayRow}>
         <TouchableOpacity
          style={s.fPayMethod}
          activeOpacity={0.75}
          onPress={() =>
          navigation.navigate("DeliveryDetails", {
            total: toPay,
            items: selectedMeds.length,
            prescriptionId: rx._id, 
            prescription: rx,

            // ✅ ADD THESE
          

            medicines: selectedMeds.map(m => ({
              medicineId: m.medicineId,
              name: m.name,
              qty: m.qty,
              price: m.price,
              unit: m.unit,
              duration: m.duration,
              freqLabel: m.freqLabel
            }))
          })
          }
        >
              <View style={s.fPayIcon}>
                <Ionicons name="wallet-outline" size={16} color={C.ink2} />
              </View>
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <Text style={s.fPayLabel}>Pay Using</Text>
                  <Ionicons name="chevron-up" size={11} color={C.ink3} />
                </View>
                <Text style={s.fPayValue}>UPI</Text>
              </View>
            </TouchableOpacity>
     <TouchableOpacity
  style={s.placeBtn}
  activeOpacity={0.75}
  onPress={() => {
    // ✅ VALIDATION (VERY IMPORTANT)


    if (!selectedMeds?.length) {
      Alert.alert("No Medicines", "No medicines selected");
      return;
    }

    // ✅ NAVIGATION
    navigation.navigate("DeliveryDetails", {
      total: toPay,
      items: selectedMeds.length,
      prescriptionId: rx._id, 
      prescription: rx,



      // ✅ MEDICINES FORMAT
      medicines: selectedMeds.map((m) => ({
        medicineId: m.medicineId,
        name: m.name,
        qty: m.qty,
        price: m.price,
        unit: m.unit,
        duration: m.duration,
        freqLabel: m.freqLabel,
      })),
    });
  }}
>
              <Text style={s.placeBtnTxt}>Place Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const s = StyleSheet.create({
    safe:   { flex: 1, backgroundColor: "#FAFAFA" },
    scroll: { padding: 20, paddingBottom: 280 },

    /* Title */
    title:    { fontSize: 20, fontFamily: F.extraBold, color: C.ink, marginBottom: 6 },
    subtitle: { fontSize: 13, fontFamily: F.regular, color: C.ink4, lineHeight: 20, marginBottom: 20 },

    /* Rx card */
    rxCard: {
      backgroundColor: "#fff", borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: "#F1F5F9",
      marginBottom: 20,
    },
    rxRow: { flexDirection: "row", gap: 14, marginBottom: 14 },
    rxIconWrap: {
      width: 48, height: 48, borderRadius: 14,
      backgroundColor: "#ECFDF5",
      justifyContent: "center", alignItems: "center",
    },
    rxTitle: { fontSize: 14, fontFamily: F.bold, color: C.ink },
    rxDetail: { fontSize: 12, fontFamily: F.regular, color: C.ink4, marginTop: 3 },
    rxBold: { fontFamily: F.bold, color: C.ink },
    viewRxBtn: {
      backgroundColor: "#ECFDF5", borderRadius: 10,
      paddingVertical: 11, alignItems: "center",
      borderWidth: 1, borderColor: `${C.accent}30`,
    },
    viewRxTxt: { fontSize: 13, fontFamily: F.bold, color: C.accent },

    /* Duration */
    durationPill: {
      flexDirection: "row", alignItems: "center", gap: 6,
      alignSelf: "flex-end",
      backgroundColor: "#fff", borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 9,
      borderWidth: 1, borderColor: "#E2E8F0",
      marginBottom: 10,
    },
    durationTxt: { fontSize: 13, fontFamily: F.semiBold, color: C.ink },
    durationNote: {
      fontSize: 12, fontFamily: F.regular, color: C.ink4,
      textAlign: "center", lineHeight: 18, marginBottom: 16,
    },

    /* Med header */
    medHeader: {
      flexDirection: "row", alignItems: "center",
      justifyContent: "flex-end", marginBottom: 12,
    },
    medCount: { fontSize: 12, fontFamily: F.semiBold, color: C.ink4, marginLeft: 10 },

    /* Dividers */
    dividerFull: { height: 1, backgroundColor: "#E8ECF0", marginVertical: 16 },

    /* Section */
    sectionTitle: {
      fontSize: 16, fontFamily: F.bold, color: C.ink, marginBottom: 0,
    },

    /* Coupon */
    couponCard: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: "#fff", borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: "#F1F5F9", marginTop: 16,
    },
    couponName: { fontSize: 14, fontFamily: F.bold, color: C.ink },
    couponSaved: { fontSize: 12, fontFamily: F.semiBold, color: C.accent, marginTop: 2 },

    /* Bill */
    billHeader: {
      flexDirection: "row", justifyContent: "space-between",
      alignItems: "center", marginBottom: 8,
    },
    billTitle: { fontSize: 14, fontFamily: F.extraBold, color: C.ink, letterSpacing: 0.5 },
    billCount: { fontSize: 12, fontFamily: F.regular, color: C.ink4 },
    billDivider: {
      height: 1, borderStyle: "dashed",
      borderWidth: 0.8, borderColor: "#CBD5E1",
      marginVertical: 8,
    },

    /* Note */
    noteCard: {
      marginTop: 20, backgroundColor: "#fff",
      borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: "#F1F5F9",
    },
    noteTxt: { fontSize: 13, fontFamily: F.regular, color: C.ink3, lineHeight: 20 },
    noteBold: { fontFamily: F.bold, color: C.ink },
    noteLink: {
      fontSize: 13, fontFamily: F.bold, color: C.brand,
      textDecorationLine: "underline", marginTop: 8,
    },

    /* Sticky footer */
    footer: {
      position: "absolute", bottom: 0, left: 0, right: 0,
      backgroundColor: "#fff",
      paddingHorizontal: 16, paddingTop: 0,
      paddingBottom: Platform.OS === "ios" ? 28 : 14,
      borderTopWidth: 1, borderTopColor: "#F1F5F9",
      shadowColor: "#000", shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.08, shadowRadius: 16, elevation: 14,
    },
    payBar: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      backgroundColor: C.brand, borderRadius: 12,
      paddingHorizontal: 16, paddingVertical: 10, marginTop: 10, marginBottom: 12,
    },
    payBarLabel: { fontSize: 14, fontFamily: F.bold, color: "#fff" },
    payBarVal: { fontSize: 18, fontFamily: F.extraBold, color: "#fff" },

    fInfoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    fBadge: { backgroundColor: "#F1F5F9", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
    fBadgeTxt: { fontSize: 11, fontFamily: F.semiBold, color: C.ink3 },
    fInfoVal: { flex: 1, fontSize: 13, fontFamily: F.bold, color: C.ink },
    fAddrRow: { flexDirection: "row", alignItems: "center", marginTop: 4, paddingLeft: 2 },
    fAddrTxt: { flex: 1, fontSize: 12, fontFamily: F.regular, color: C.ink4 },
    fChange: { fontSize: 12, fontFamily: F.bold, color: C.brand },

    fPayRow: {
      flexDirection: "row", alignItems: "center", gap: 12,
      marginTop: 12, paddingTop: 10,
      borderTopWidth: 1, borderTopColor: "#F1F5F9",
    },
    fPayMethod: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
    fPayIcon: {
      width: 34, height: 34, borderRadius: 10, backgroundColor: "#F1F5F9",
      justifyContent: "center", alignItems: "center",
    },
    fPayLabel: { fontSize: 11, fontFamily: F.semiBold, color: C.ink3 },
    fPayValue: { fontSize: 13, fontFamily: F.bold, color: C.ink, marginTop: 1 },
    placeBtn: {
      backgroundColor: C.brand, borderRadius: 12,
      paddingVertical: 14, paddingHorizontal: 28,
      shadowColor: C.brand, shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
    },
    placeBtnTxt: { fontSize: 15, fontFamily: F.bold, color: "#fff" },
  });

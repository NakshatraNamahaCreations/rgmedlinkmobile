import { useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, StatusBar, ActivityIndicator, RefreshControl, Animated, Modal, Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import API from "../../api";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";

const TOP = Platform.OS === "ios" ? 54 : (StatusBar.currentHeight || 24) + 12;
const fDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fCur = (v) => `₹${(v || 0).toLocaleString("en-IN")}`;

const TABS = ["All", "Active", "Done"];

const STATUS_COLORS = {
  Pending: { color: "#D97706", bg: "#FFFBEB", icon: "time-outline" },
  Processing: { color: "#2563EB", bg: "#EFF6FF", icon: "reload-outline" },
  Packed: { color: "#7C3AED", bg: "#F5F3FF", icon: "cube-outline" },
  Shipped: { color: "#0EA5E9", bg: "#E0F2FE", icon: "car-outline" },
  Delivered: { color: "#059669", bg: "#ECFDF5", icon: "checkmark-done-outline" },
};

export default function PrescriptionHistoryScreen({ navigation }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [previewRx, setPreviewRx] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchPrescriptions = useCallback(async () => {
    try {
      const res = await API.get("/prescriptions").catch(() => ({ data: [] }));
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setPrescriptions(data);
    } catch {
      setPrescriptions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchPrescriptions(); }, [fetchPrescriptions]));

  const filtered = prescriptions;

  const totalCount = prescriptions.length;
  const activeCount = prescriptions.filter((r) => r.orderStatus !== "Delivered").length;
  const deliveredCount = prescriptions.filter((r) => r.orderStatus === "Delivered").length;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={C.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>My Prescriptions</Text>
          {totalCount > 0 && <Text style={s.headerSub}>{totalCount} total · {activeCount} active</Text>}
        </View>
        <TouchableOpacity
          style={s.uploadHeaderBtn}
          activeOpacity={0.7}
          onPress={() => navigation.getParent()?.navigate("OrdersTab", { screen: "UploadPrescription", initial: false })}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <View style={s.loadingIcon}>
            <ActivityIndicator size="large" color={C.brand} />
          </View>
          <Text style={s.loadingText}>Loading prescriptions...</Text>
        </View>
      ) : (
        <>

          {/* ── List ── */}
          <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={s.scroll}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPrescriptions(); }} colors={[C.brand]} />}
            >
              {filtered.length === 0 ? (
                <View style={s.emptyWrap}>
                  <View style={s.emptyCircle}>
                    <View style={s.emptyInner}>
                      <Ionicons name="document-text-outline" size={40} color={C.ink4} />
                    </View>
                  </View>
                  <Text style={s.emptyTitle}>
                    {totalCount === 0 ? "No prescriptions yet" : "No prescriptions found"}
                  </Text>
                  <Text style={s.emptySub}>
                    {totalCount === 0
                      ? "Upload your first prescription to start ordering medicines"
                      : "Try selecting a different filter above"}
                  </Text>
                  {totalCount === 0 && (
                    <TouchableOpacity
                      style={s.emptyBtn}
                      activeOpacity={0.85}
                      onPress={() => navigation.getParent()?.navigate("OrdersTab", { screen: "UploadPrescription", initial: false })}
                    >
                      <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                      <Text style={s.emptyBtnText}>Upload Prescription</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                filtered.map((rx, idx) => {
                  const sCfg = STATUS_COLORS[rx.orderStatus] || STATUS_COLORS.Pending;
                  const medsCount = rx.meds?.length || 0;
                  const isExpired = rx.expiry && new Date(rx.expiry) < new Date();
                  const medNames = rx.meds?.slice(0, 3).map((m) => m.medicine?.name || "Medicine").join(", ") || "";

                  return (
                    <View key={rx._id} style={s.rxCard}>
                      {/* Header */}
                      <View style={s.rxHeader}>
                        <View style={[s.rxIcon, { backgroundColor: sCfg.bg }]}>
                          <Ionicons name={sCfg.icon} size={18} color={sCfg.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.rxId}>{rx.rxId || `RX-${idx + 1}`}</Text>
                          <Text style={s.rxDate}>
                            {fDate(rx.createdAt)}
                            {rx.doctor ? `  ·  ${rx.doctor}` : ""}
                          </Text>
                        </View>
                        {isExpired && (
                          <View style={s.expiredBadge}>
                            <Text style={s.expiredText}>Expired</Text>
                          </View>
                        )}
                      </View>

                      {/* Info chips */}
                      <View style={s.chipRow}>
                        <View style={[s.chip, { backgroundColor: sCfg.bg }]}>
                          <Text style={[s.chipText, { color: sCfg.color }]}>{rx.orderStatus || "Pending"}</Text>
                        </View>
                        <View style={[s.chip, { backgroundColor: rx.payStatus === "Paid" ? "#ECFDF5" : "#FEF2F2" }]}>
                          <Text style={[s.chipText, { color: rx.payStatus === "Paid" ? C.green : C.red }]}>{rx.payStatus || "Unpaid"}</Text>
                        </View>
                        {medsCount > 0 && (
                          <View style={[s.chip, { backgroundColor: "#F8FAFC" }]}>
                            <Text style={[s.chipText, { color: C.ink3 }]}>{medsCount} med{medsCount > 1 ? "s" : ""}</Text>
                          </View>
                        )}
                      </View>

                      {/* Bottom */}
                      <View style={s.rxBottom}>
                        {rx.total > 0 && <Text style={s.rxAmount}>{fCur(rx.total)}</Text>}
                        <View style={s.rxActions}>
                          <TouchableOpacity style={s.previewBtn} activeOpacity={0.7}
                            onPress={() => setPreviewRx(rx)}
                          >
                            <Ionicons name="eye-outline" size={14} color={C.ink2} />
                            <Text style={s.previewText}>Preview</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={s.reorderBtn} activeOpacity={0.7}
                            onPress={() => setPreviewRx({ ...rx, _reorder: true })}
                          >
                            <Ionicons name="refresh-outline" size={14} color={C.brand} />
                            <Text style={s.reorderText}>Reorder</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </Animated.View>

          {/* ── Preview Modal ── */}
      <Modal visible={!!previewRx} transparent animationType="slide" onRequestClose={() => setPreviewRx(null)}>
        <Pressable style={s.modalBg} onPress={() => setPreviewRx(null)}>
          <View style={s.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Prescription Details</Text>
              <TouchableOpacity onPress={() => setPreviewRx(null)}>
                <Ionicons name="close" size={22} color={C.ink3} />
              </TouchableOpacity>
            </View>

            {previewRx && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                {/* Rx info */}
                <View style={s.previewInfo}>
                  <View style={s.previewRow}>
                    <Ionicons name="document-text-outline" size={16} color={C.ink4} />
                    <Text style={s.previewLabel}>ID</Text>
                    <Text style={s.previewVal}>{previewRx.rxId}</Text>
                  </View>
                  {previewRx.doctor && (
                    <View style={s.previewRow}>
                      <Ionicons name="person-outline" size={16} color={C.ink4} />
                      <Text style={s.previewLabel}>Doctor</Text>
                      <Text style={s.previewVal}>{previewRx.doctor}</Text>
                    </View>
                  )}
                  <View style={s.previewRow}>
                    <Ionicons name="calendar-outline" size={16} color={C.ink4} />
                    <Text style={s.previewLabel}>Date</Text>
                    <Text style={s.previewVal}>{fDate(previewRx.createdAt)}</Text>
                  </View>
                  {previewRx.expiry && (
                    <View style={s.previewRow}>
                      <Ionicons name="shield-checkmark-outline" size={16} color={C.ink4} />
                      <Text style={s.previewLabel}>Valid till</Text>
                      <Text style={s.previewVal}>{fDate(previewRx.expiry)}</Text>
                    </View>
                  )}
                </View>

                {/* Medicines */}
                {previewRx.meds?.length > 0 && (
                  <View style={s.previewMeds}>
                    <Text style={s.previewMedsTitle}>Medicines ({previewRx.meds.length})</Text>
                    {previewRx.meds.map((m, i) => (
                      <View key={i} style={[s.previewMedRow, i < previewRx.meds.length - 1 && s.previewMedBorder]}>
                        <View style={s.previewMedIcon}>
                          <Ionicons name="medkit" size={14} color={C.brand} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.previewMedName}>{m.medicine?.name || "Medicine"}</Text>
                          <Text style={s.previewMedDetail}>
                            {m.freq?.m || 0}-{m.freq?.a || 0}-{m.freq?.n || 0}  ·  {m.duration || 5} days  ·  Qty: {m.qty || 0}
                          </Text>
                        </View>
                        {m.subtotal > 0 && <Text style={s.previewMedPrice}>{fCur(m.subtotal)}</Text>}
                      </View>
                    ))}
                  </View>
                )}

                {/* Totals */}
                {previewRx.total > 0 && (
                  <View style={s.previewTotals}>
                    <View style={s.previewTotalRow}>
                      <Text style={s.previewTotalLabel}>Subtotal</Text>
                      <Text style={s.previewTotalVal}>{fCur(previewRx.subtotal)}</Text>
                    </View>
                    <View style={s.previewTotalRow}>
                      <Text style={s.previewTotalLabel}>GST</Text>
                      <Text style={s.previewTotalVal}>{fCur(previewRx.gst)}</Text>
                    </View>
                    <View style={s.previewDivider} />
                    <View style={s.previewTotalRow}>
                      <Text style={s.previewGrandLabel}>Total</Text>
                      <Text style={s.previewGrandVal}>{fCur(previewRx.total)}</Text>
                    </View>
                  </View>
                )}

                {/* Reorder button */}
                {previewRx._reorder && (
                  <TouchableOpacity
                    style={s.reorderFullBtn}
                    activeOpacity={0.85}
                    onPress={() => {
                      const meds = (previewRx.meds || []).map((m) => ({
                        medicineId: m.medicine?._id || m.medicine,
                        name: m.medicine?.name || "Medicine",
                        freq: m.freq || { m: 1, a: 0, n: 1 },
                        freqLabel: `${m.freq?.m || 1}-${m.freq?.a || 0}-${m.freq?.n || 1}`,
                        duration: m.duration || 5,
                        qty: m.qty || 0,
                        price: m.price || 0,
                        subtotal: m.subtotal || 0,
                        unit: "Tablet",
                        category: "Tablet",
                        inStock: true,
                      }));
                      setPreviewRx(null);
                      navigation.navigate("ReviewPrescription", {
                        prescription: {
                          rxId: previewRx.rxId,
                          doctor: previewRx.doctor,
                          medicines: meds,
                          subtotal: previewRx.subtotal || 0,
                          gst: previewRx.gst || 0,
                          total: previewRx.total || 0,
                        },
                        mode: "all",
                      });
                    }}
                  >
                    <Ionicons name="cart" size={18} color="#fff" />
                    <Text style={s.reorderFullText}>Reorder This Prescription</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </Pressable>
      </Modal>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAFA" },

  /* Header */
  header: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingTop: TOP, paddingBottom: 16, paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontFamily: F.bold, color: C.ink },
  headerSub: { fontSize: 11, fontFamily: F.regular, color: C.ink4, marginTop: 1 },
  uploadHeaderBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: C.brand,
    justifyContent: "center", alignItems: "center",
    shadowColor: C.brand, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },

  /* Loading */
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center", marginBottom: 14,
  },
  loadingText: { fontSize: 14, fontFamily: F.medium, color: C.ink4 },

  /* Tabs */
  tabsRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  tab: {
    paddingHorizontal: 20, paddingVertical: 7,
    borderRadius: 20, backgroundColor: "#F1F5F9",
  },
  tabActive: { backgroundColor: C.brand },
  tabText: { fontSize: 12, fontFamily: F.semiBold, color: C.ink3 },
  tabTextActive: { color: "#fff" },

  scroll: { padding: 16, paddingBottom: 40 },

  /* Empty */
  emptyWrap: { alignItems: "center", paddingTop: 50 },
  emptyCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#F1F5F9",
    justifyContent: "center", alignItems: "center", marginBottom: 20,
  },
  emptyInner: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#E8ECF0",
    justifyContent: "center", alignItems: "center",
  },
  emptyTitle: { fontSize: 18, fontFamily: F.bold, color: C.ink, marginBottom: 6 },
  emptySub: { fontSize: 13, fontFamily: F.regular, color: C.ink4, textAlign: "center", paddingHorizontal: 30, lineHeight: 20 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.brand, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 14, marginTop: 24,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  emptyBtnText: { fontSize: 14, fontFamily: F.bold, color: "#fff" },

  /* Rx card */
  rxCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: "#F1F5F9",
  },
  rxHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  rxIcon: {
    width: 42, height: 42, borderRadius: 13,
    justifyContent: "center", alignItems: "center",
  },
  rxId: { fontSize: 14, fontFamily: F.bold, color: C.ink },
  rxDate: { fontSize: 11, fontFamily: F.regular, color: C.ink4, marginTop: 2 },
  expiredBadge: {
    backgroundColor: "#FEF2F2", borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  expiredText: { fontSize: 10, fontFamily: F.bold, color: C.red },

  chipRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
  chip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  chipText: { fontSize: 10, fontFamily: F.bold },

  rxBottom: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F8FAFC",
  },
  rxAmount: { fontSize: 16, fontFamily: F.extraBold, color: C.ink },
  rxActions: { flexDirection: "row", gap: 8 },
  previewBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  previewText: { fontSize: 12, fontFamily: F.semiBold, color: C.ink2 },
  reorderBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 8, borderWidth: 1, borderColor: C.brand + "25",
    backgroundColor: C.brandLt,
  },
  reorderText: { fontSize: 12, fontFamily: F.bold, color: C.brand },

  /* Preview Modal */
  modalBg: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0",
    alignSelf: "center", marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontFamily: F.bold, color: C.ink },

  previewInfo: {
    backgroundColor: "#F8FAFC", borderRadius: 14, padding: 14, marginBottom: 14,
  },
  previewRow: {
    flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8,
  },
  previewLabel: { flex: 1, fontSize: 13, fontFamily: F.regular, color: C.ink4 },
  previewVal: { fontSize: 13, fontFamily: F.bold, color: C.ink },

  previewMeds: { marginBottom: 14 },
  previewMedsTitle: { fontSize: 14, fontFamily: F.bold, color: C.ink, marginBottom: 10 },
  previewMedRow: {
    flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10,
  },
  previewMedBorder: { borderBottomWidth: 1, borderBottomColor: "#F8FAFC" },
  previewMedIcon: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center",
  },
  previewMedName: { fontSize: 13, fontFamily: F.bold, color: C.ink },
  previewMedDetail: { fontSize: 11, fontFamily: F.regular, color: C.ink4, marginTop: 2 },
  previewMedPrice: { fontSize: 13, fontFamily: F.bold, color: C.ink },

  previewTotals: {
    backgroundColor: "#F8FAFC", borderRadius: 14, padding: 14,
  },
  previewTotalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  previewTotalLabel: { fontSize: 13, fontFamily: F.regular, color: C.ink3 },
  previewTotalVal: { fontSize: 13, fontFamily: F.semiBold, color: C.ink2 },
  previewDivider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 8 },
  previewGrandLabel: { fontSize: 15, fontFamily: F.bold, color: C.ink },
  previewGrandVal: { fontSize: 16, fontFamily: F.extraBold, color: C.brand },

  reorderFullBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.brand, borderRadius: 14, paddingVertical: 16, marginTop: 16,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  reorderFullText: { fontSize: 15, fontFamily: F.bold, color: "#fff" },
});

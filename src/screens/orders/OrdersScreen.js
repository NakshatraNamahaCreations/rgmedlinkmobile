import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput,
} from "react-native";
import API from "../../api";
import { useAuth } from "../../context/AuthContext";
import StatusChip from "../../components/StatusChip";
import EmptyState from "../../components/EmptyState";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";

const fDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fCur = (v) => `₹${(v || 0).toLocaleString("en-IN")}`;

const TABS = ["All", "Created", "Processing", "Shipped", "Delivered"];

export default function OrdersScreen({ navigation }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");

  const fetchOrders = useCallback(async (pg = 1, append = false) => {
    const userId = user?._id || user?.phone;
    if (!userId) { setOrders([]); setLoading(false); return; }
    try {
      if (!append) setLoading(true);
      const params = { page: pg, limit: 10, userId };
      if (tab !== "All") params.orderStatus = tab;
      if (search) params.search = search;

      const res = await API.get("/orders", { params });
      const data = res.data.data || [];
      const pag = res.data.pagination || {};

      setOrders(append ? (prev) => [...prev, ...data] : data);
      setTotalPages(pag.totalPages || 1);
      setPage(pg);
    } catch (err) {
      console.error("Fetch orders error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, search, user]);

  useEffect(() => { fetchOrders(1); }, [fetchOrders]);

  const onRefresh = () => { setRefreshing(true); fetchOrders(1); };
  const loadMore = () => { if (page < totalPages) fetchOrders(page + 1, true); };

  const renderOrder = ({ item: o }) => (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate("OrderDetail", { order: o })}
    >
      <View style={s.cardTop}>
        <View>
          <Text style={s.orderId}>{o.orderId}</Text>
          <Text style={s.customer}>{o.patientDetails?.name || "—"}</Text>
        </View>
        <Text style={s.amount}>{fCur(o.totalAmount)}</Text>
      </View>
      <View style={s.cardBot}>
        <StatusChip label={o.orderStatus || "Created"} />
        <StatusChip label={o.paymentStatus || "Pending"} />
        <Text style={s.date}>{fDate(o.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && orders.length === 0) return <LoadingSpinner message="Loading orders..." />;

  return (
    <View style={s.container}>
      {/* Search */}
      <View style={s.searchWrap}>
        <Text style={{ fontSize: 16 }}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search orders..."
          placeholderTextColor={C.ink4}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => fetchOrders(1)}
          returnKeyType="search"
        />
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[s.tab, tab === t && s.tabActive]}
          >
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Upload Prescription button */}
      <TouchableOpacity
        style={s.uploadBar}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("UploadPrescription")}
      >
        <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
        <Text style={s.uploadBarText}>Upload Prescription</Text>
        <Ionicons name="arrow-forward" size={16} color="#fff" />
      </TouchableOpacity>

      <FlatList
        data={orders}
        keyExtractor={(o) => o._id}
        renderItem={renderOrder}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.brand]} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <View style={s.emptyIcon}>
              <Ionicons name="document-text-outline" size={40} color={C.brand} />
            </View>
            <Text style={s.emptyTitle}>No orders yet</Text>
            <Text style={s.emptySub}>Upload your prescription to order medicines</Text>
            <TouchableOpacity
              style={s.uploadBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("UploadPrescription")}
            >
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              <Text style={s.uploadBtnText}>Upload Prescription</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  uploadBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.brand, borderRadius: 12,
    marginHorizontal: 16, marginTop: 12, paddingVertical: 13,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  uploadBarText: { fontSize: 14, fontFamily: F.bold, color: "#fff" },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.card, margin: 16, marginBottom: 0,
    borderRadius: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.ink, paddingVertical: 12 },
  tabRow: {
    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 6,
  },
  tab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  tabActive: { backgroundColor: C.brand, borderColor: C.brand },
  tabText: { fontSize: 12, fontFamily: F.semiBold, color: C.ink3 },
  tabTextActive: { color: C.white },
  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: C.border,
  },
  cardTop: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 12,
  },
  orderId: { fontSize: 14, fontFamily: F.extraBold, color: C.ink },
  customer: { fontSize: 12, color: C.ink3, marginTop: 2, fontFamily: F.regular },
  amount: { fontSize: 17, fontFamily: F.extraBold, color: C.ink },
  cardBot: { flexDirection: "row", alignItems: "center", gap: 8 },
  date: { fontSize: 11, color: C.ink4, marginLeft: "auto" },
  emptyWrap: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontFamily: F.extraBold, color: C.ink },
  emptySub: { fontSize: 13, fontFamily: F.regular, color: C.ink4, marginTop: 6, textAlign: "center", paddingHorizontal: 40 },
  uploadBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.brand, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 14, marginTop: 20,
  },
  uploadBtnText: { fontSize: 15, fontFamily: F.bold, color: "#fff" },
});

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl,
} from "react-native";
import API from "../../api";
import StatusChip from "../../components/StatusChip";
import EmptyState from "../../components/EmptyState";
import LoadingSpinner from "../../components/LoadingSpinner";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";

const fDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—";
const timeAgo = (d) => {
  if (!d) return "";
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const TABS = ["All", "Open", "In Progress", "Resolved", "Closed"];

export default function TicketsScreen({ navigation }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tab, setTab] = useState("All");

  const fetchTickets = useCallback(async (pg = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      const params = { page: pg, limit: 10 };
      if (tab !== "All") params.status = tab;

      const res = await API.get("/tickets", { params });
      const data = res.data.data || [];
      const pag = res.data.pagination || {};

      setTickets(append ? (prev) => [...prev, ...data] : data);
      setTotalPages(pag.totalPages || 1);
      setPage(pg);
    } catch (err) {
      console.error("Fetch tickets error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useEffect(() => { fetchTickets(1); }, [fetchTickets]);

  const onRefresh = () => { setRefreshing(true); fetchTickets(1); };
  const loadMore = () => { if (page < totalPages) fetchTickets(page + 1, true); };

  const renderTicket = ({ item: t }) => (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate("TicketDetail", { ticket: t })}
    >
      <View style={s.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.subject} numberOfLines={1}>{t.subject}</Text>
          <Text style={s.meta}>{t.ticketId} · {t.category}</Text>
        </View>
        <StatusChip label={t.priority || "Medium"} />
      </View>
      <Text style={s.desc} numberOfLines={2}>{t.description}</Text>
      <View style={s.cardBot}>
        <StatusChip label={t.status || "Open"} />
        <Text style={s.ago}>{timeAgo(t.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && tickets.length === 0) return <LoadingSpinner message="Loading tickets..." />;

  return (
    <View style={s.container}>
      {/* Tabs */}
      <FlatList
        data={TABS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(t) => t}
        contentContainerStyle={s.tabRow}
        renderItem={({ item: t }) => (
          <TouchableOpacity
            onPress={() => setTab(t)}
            style={[s.tab, tab === t && s.tabActive]}
          >
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={tickets}
        keyExtractor={(t) => t._id}
        renderItem={renderTicket}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.brand]} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={<EmptyState icon="🎫" title="No tickets" subtitle="Raise a ticket if you need help" />}
      />

      {/* FAB: Create Ticket */}
      <TouchableOpacity
        style={s.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("CreateTicket")}
      >
        <Text style={s.fabText}>+ New Ticket</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  tabRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 6 },
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
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  subject: { fontSize: 15, fontFamily: F.extraBold, color: C.ink },
  meta: { fontSize: 11, color: C.ink4, marginTop: 3 },
  desc: { fontSize: 13, color: C.ink3, lineHeight: 19, marginBottom: 10 },
  cardBot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ago: { fontSize: 11, color: C.ink4 },
  fab: {
    position: "absolute", bottom: 24, right: 20, left: 20,
    backgroundColor: C.brand, borderRadius: 16, paddingVertical: 16,
    alignItems: "center", shadowColor: C.brand,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35,
    shadowRadius: 12, elevation: 8,
  },
  fabText: { fontSize: 16, fontFamily: F.extraBold, color: C.white },
});

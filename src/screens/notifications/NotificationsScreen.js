import { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, StatusBar, Animated, RefreshControl, Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API from "../../api";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";

const TOP = Platform.OS === "ios" ? 54 : (StatusBar.currentHeight || 24) + 12;

const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const NOTIF_CONFIG = {
  order_placed:       { icon: "checkmark-circle", color: C.green, bg: "#ECFDF5" },
  order_confirmed:    { icon: "cube",             color: "#2563EB", bg: "#EFF6FF" },
  order_delivered:    { icon: "gift",             color: C.green, bg: "#ECFDF5" },
  prescription_expiry:{ icon: "time",             color: "#D97706", bg: "#FFFBEB" },
  new_product:        { icon: "sparkles",         color: "#7C3AED", bg: "#F5F3FF" },
  offer:              { icon: "pricetag",         color: C.brand, bg: C.brandLt },
  welcome:            { icon: "heart",            color: "#EC4899", bg: "#FDF2F8" },
  default:            { icon: "notifications",    color: C.ink3, bg: "#F1F5F9" },
};

function buildNotifications(orders) {
  const notifs = [];

  orders.forEach((ord) => {
    notifs.push({
      id: `order_${ord._id}`,
      type: "order_placed",
      title: "Order Placed Successfully!",
      message: `${ord.orderId} — ₹${ord.totalAmount || 0}`,
      time: ord.createdAt,
      data: ord,
      unread: true,
    });
    if (["Confirmed", "Processing"].includes(ord.orderStatus)) {
      notifs.push({
        id: `confirmed_${ord._id}`,
        type: "order_confirmed",
        title: "Order Being Prepared",
        message: `${ord.orderId} is being processed by our pharmacist`,
        time: ord.updatedAt || ord.createdAt,
        data: ord,
      });
    }
    if (ord.orderStatus === "Delivered") {
      notifs.push({
        id: `delivered_${ord._id}`,
        type: "order_delivered",
        title: "Order Delivered! 🎉",
        message: `${ord.orderId} has been delivered. Hope you feel better!`,
        time: ord.updatedAt || ord.createdAt,
        data: ord,
      });
    }
  });

  notifs.push({
    id: "rx_expiry", type: "prescription_expiry",
    title: "Prescription Expiring Soon",
    message: "Reorder medicines before your prescription expires",
    time: new Date(Date.now() - 2 * 3600000).toISOString(),
  });
  notifs.push({
    id: "new_product", type: "new_product",
    title: "New: Immunity Boosters",
    message: "Multivitamins, Zinc & Vitamin D now available",
    time: new Date(Date.now() - 5 * 3600000).toISOString(),
  });
  notifs.push({
    id: "offer", type: "offer",
    title: "Flat 20% OFF 💊",
    message: "On all medicines — upload prescription to avail",
    time: new Date(Date.now() - 12 * 3600000).toISOString(),
  });
  notifs.push({
    id: "welcome", type: "welcome",
    title: "Welcome to RG Medlink!",
    message: "Your trusted healthcare partner. We're glad to have you.",
    time: new Date(Date.now() - 24 * 3600000).toISOString(),
  });

  notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
  return notifs;
}

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/orders?page=1&limit=10").catch(() => ({ data: { data: [] } }));
      setNotifications(buildNotifications(res.data.data || []));
    } catch {
      setNotifications(buildNotifications([]));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={C.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Notifications</Text>
          {unreadCount > 0 && <Text style={s.headerSub}>{unreadCount} new</Text>}
        </View>
        <TouchableOpacity style={s.markAllBtn} activeOpacity={0.7} onPress={() => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))}>
          <Ionicons name="checkmark-done" size={18} color={C.brand} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} colors={[C.brand]} />}
      >
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={s.skelCard}>
              <View style={s.skelCircle} />
              <View style={{ flex: 1, gap: 8 }}>
                <View style={[s.skelLine, { width: "55%" }]} />
                <View style={[s.skelLine, { width: "85%" }]} />
                <View style={[s.skelLine, { width: "30%" }]} />
              </View>
            </View>
          ))
        ) : notifications.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={44} color={C.ink4} />
            </View>
            <Text style={s.emptyTitle}>All caught up!</Text>
            <Text style={s.emptySub}>No new notifications right now</Text>
          </View>
        ) : (
          <>
            {/* Today section */}
            <Text style={s.sectionLabel}>Recent</Text>
            {notifications.map((notif) => {
              const cfg = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.default;
              return (
                <TouchableOpacity
                  key={notif.id}
                  style={[s.card, notif.unread && s.cardUnread]}
                  activeOpacity={0.7}
                  onPress={() => notif.data && navigation.getParent()?.navigate("OrdersTab", { screen: "OrderDetail", params: { order: notif.data } })}
                >
                  {/* Unread dot */}
                  {notif.unread && <View style={s.unreadDot} />}

                  {/* Icon */}
                  <View style={[s.iconWrap, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon} size={22} color={cfg.color} />
                  </View>

                  {/* Content */}
                  <View style={s.cardBody}>
                    <Text style={[s.cardTitle, notif.unread && s.cardTitleBold]}>{notif.title}</Text>
                    <Text style={s.cardMsg} numberOfLines={2}>{notif.message}</Text>
                    <View style={s.cardFooter}>
                      <Ionicons name="time-outline" size={12} color={C.ink4} />
                      <Text style={s.cardTime}>{timeAgo(notif.time)}</Text>
                    </View>
                  </View>

                  {/* Arrow for actionable */}
                  {notif.data && <Ionicons name="chevron-forward" size={16} color={C.ink5} />}
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingTop: TOP, paddingBottom: 14, paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontFamily: F.extraBold, color: C.ink },
  headerSub: { fontSize: 12, fontFamily: F.semiBold, color: C.brand, marginTop: 1 },
  markAllBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center",
  },

  // List
  listContent: { paddingBottom: 40 },
  sectionLabel: {
    fontSize: 13, fontFamily: F.bold, color: C.ink4,
    letterSpacing: 0.5, marginLeft: 20, marginTop: 16, marginBottom: 8,
    textTransform: "uppercase",
  },

  // Card
  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    marginHorizontal: 12, marginBottom: 2,
    backgroundColor: "#fff", borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  cardUnread: {
    backgroundColor: "#FFFBFC",
    borderLeftWidth: 3, borderLeftColor: C.brand,
  },
  unreadDot: {
    position: "absolute", top: 16, left: 8,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: C.brand,
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 16,
    justifyContent: "center", alignItems: "center",
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontFamily: F.semiBold, color: C.ink, marginBottom: 2 },
  cardTitleBold: { fontFamily: F.bold },
  cardMsg: { fontSize: 13, fontFamily: F.regular, color: C.ink3, lineHeight: 19 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  cardTime: { fontSize: 12, fontFamily: F.medium, color: C.ink4 },

  // Empty
  empty: { alignItems: "center", paddingTop: 80 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#F1F5F9",
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontFamily: F.bold, color: C.ink },
  emptySub: { fontSize: 13, fontFamily: F.regular, color: C.ink4, marginTop: 4 },

  // Skeleton
  skelCard: {
    flexDirection: "row", gap: 14,
    marginHorizontal: 12, marginTop: 8,
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
  },
  skelCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#F1F5F9" },
  skelLine: { height: 12, borderRadius: 6, backgroundColor: "#F1F5F9" },
});

import { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Share, Platform, StatusBar, Image, Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import API from "../../api";
import { useAuth } from "../../context/AuthContext";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";

const TOP = Platform.OS === "ios" ? 54 : (StatusBar.currentHeight || 24) + 12;

const QUICK_ACTIONS = [
  { icon: "cube", label: "Orders", color: C.brand, bg: C.brandLt, screen: "OrdersTab", isTab: true },
  { icon: "people", label: "Patients", color: "#8B5CF6", bg: "#F3E8FF", screen: "PatientList" },
  { icon: "location", label: "Addresses", color: "#10B981", bg: "#ECFDF5", screen: "SavedAddresses" },
  { icon: "document-text", label: "Rx", color: "#F59E0B", bg: "#FFFBEB", screen: "PrescriptionHistory" },
 {
  icon: "chatbubble-ellipses",
  label: "Tickets",
  color: "#0EA5E9",
  bg: "#E0F2FE",
  screen: "Tickets"
}
];

const MENU_ITEMS = [
  { icon: "cube-outline", label: "My Orders", sub: "Track, manage & reorder", screen: "OrdersTab", isTab: true, badge: null },
  {
  icon: "people-outline",
  label: "My Patients",
  sub: "Manage patient profiles",
  screen: "PatientList"
},
  {
    icon: "chatbubble-ellipses-outline",
    label: "My Tickets",
    sub: "View & track your support tickets",
    screen: "Tickets"
  },
  { icon: "location-outline", label: "Saved Addresses", sub: "Manage delivery locations", screen: "SavedAddresses" },
  { icon: "document-text-outline", label: "My Prescriptions", sub: "View prescription history", screen: "PrescriptionHistory" },
  { icon: "card-outline", label: "Payment Methods", sub: "UPI, cards & wallets", screen: null },
];

const SUPPORT_ITEMS = [
  {
    icon: "ticket-outline",
    label: "Raise Ticket",
    sub: "Create a new support request",
    screen: "CreateTicket"
  },

  {
    icon: "chatbubble-ellipses-outline",
    label: "My Tickets",
    sub: "View your conversations",
    screen: "Tickets"
  },

  { icon: "star-outline", label: "Rate Us", sub: "Love the app? Rate us 5 stars", screen: null },
  { icon: "share-social-outline", label: "Share App", sub: "Share RG Medlink with friends", screen: null },
  { icon: "shield-checkmark-outline", label: "Privacy Policy", sub: "How we protect your data", screen: null },
  { icon: "document-outline", label: "Terms & Conditions", sub: "Usage terms and guidelines", screen: null },
];

export default function ProfileScreen({ navigation }) {
  const { user, logout, requireAuth } = useAuth();
  const [stats, setStats] = useState({ orders: 0, prescriptions: 0, tickets: 0 });

  const initial = (user?.name || user?.phone || "U")[0].toUpperCase();
  const name = user?.name || "Guest";
  const phone = user?.phone;

  useFocusEffect(useCallback(() => {
    if (!user) return;
    (async () => {
      try {
        const userId = user._id || user.phone;
        const [ordRes, rxRes, tkRes] = await Promise.all([
          API.get(`/orders?page=1&limit=1&userId=${userId}`).catch(() => ({ data: { pagination: { total: 0 } } })),
          API.get(`/prescriptions?userId=${userId}`).catch(() => ({ data: [] })),
          API.get(`/tickets?userId=${userId}`).catch(() => ({ data: [] })),
        ]);
        const orderCount = ordRes.data.pagination?.total || ordRes.data.data?.length || 0;
        const rxData = Array.isArray(rxRes.data) ? rxRes.data : rxRes.data.data || [];
        const tkData = Array.isArray(tkRes.data) ? tkRes.data : tkRes.data.data || [];
        setStats({ orders: orderCount, prescriptions: rxData.length, tickets: tkData.length });
      } catch {}
    })();
  }, []));

  const confirmLogout = () =>
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: logout },
    ]);

  const handleNav = (item) => {
    if (item.label === "Share App") {
      Share.share({
        message: "Download RG Medlink — Order medicines online and get them delivered to your doorstep!\nhttps://rgmedlink.com",
        title: "RG Medlink",
      }).catch(() => {});
      return;
    }
    if (item.label === "Privacy Policy") {
      Alert.alert(
        "Privacy Policy",
        "RG Medlink collects only the information necessary to provide our services, including your phone number and delivery address. We do not sell or share your personal data with third parties. Your data is stored securely and used solely for order fulfillment and app improvement. For queries, contact us at support@rgmedlink.com.",
        [{ text: "OK" }]
      );
      return;
    }
    if (item.label === "Terms & Conditions") {
      Alert.alert(
        "Terms & Conditions",
        "By using RG Medlink, you agree to our terms of service. Medicines are dispensed only against valid prescriptions where required by law. RG Medlink is not liable for delays caused by third-party logistics. Orders once packed cannot be cancelled. For the full terms, visit rgmedlink.com/terms.",
        [{ text: "OK" }]
      );
      return;
    }
    if (!item.screen) {
      Alert.alert("Coming Soon", "This feature will be available in the next update.");
      return;
    }
    if (item.isTab) {
      navigation.getParent()?.navigate(item.screen);
    } else {
      navigation.navigate(item.screen);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerLabel}>My Account</Text>

        <TouchableOpacity style={s.profileRow} activeOpacity={0.8} onPress={() => { if (!user) requireAuth(() => {}); }}>
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initial}</Text>
            </View>
            {user && <View style={s.onlineDot} />}
          </View>

          <View style={s.profileInfo}>
            <Text style={s.profileName}>{name}</Text>
            <Text style={s.profilePhone}>{phone ? `+91 ${phone}` : "Tap to login"}</Text>
          </View>

          {!user && <Ionicons name="log-in-outline" size={20} color={C.brand} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.body}
        contentContainerStyle={s.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Stats ── */}
        <View style={s.statsRow}>
          {[
            { val: stats.orders, label: "Orders", icon: "cube", color: C.brand },
            { val: stats.prescriptions, label: "Prescriptions", icon: "document-text", color: "#7C3AED" },
            { val: stats.tickets, label: "Tickets", icon: "chatbubble", color: "#0EA5E9" },
          ].map((st, i) => (
            <View key={i} style={s.statCard}>
              <View style={[s.statIconWrap, { backgroundColor: st.color + "12" }]}>
                <Ionicons name={st.icon} size={16} color={st.color} />
              </View>
              <Text style={s.statVal}>{st.val}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Quick Actions ── */}
        <View style={s.quickRow}>
          {QUICK_ACTIONS.map((a, i) => (
            <TouchableOpacity key={i} style={s.quickItem} activeOpacity={0.7} onPress={() => handleNav(a)}>
              <View style={[s.quickIcon, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon} size={20} color={a.color} />
              </View>
              <Text style={s.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Account section ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ACCOUNT</Text>
          <View style={s.menuCard}>
            {MENU_ITEMS.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[s.menuRow, i < MENU_ITEMS.length - 1 && s.menuBorder]}
                activeOpacity={0.65}
                onPress={() => handleNav(item)}
              >
                <View style={s.menuIconWrap}>
                  <Ionicons name={item.icon} size={20} color={C.ink2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  <Text style={s.menuSub}>{item.sub}</Text>
                </View>
                {item.badge && (
                  <View style={s.menuBadge}>
                    <Text style={s.menuBadgeText}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={16} color={C.ink5} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Support section ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>SUPPORT & INFO</Text>
          <View style={s.menuCard}>
            {SUPPORT_ITEMS.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[s.menuRow, i < SUPPORT_ITEMS.length - 1 && s.menuBorder]}
                activeOpacity={0.65}
                onPress={() => handleNav(item)}
              >
                <View style={s.menuIconWrap}>
                  <Ionicons name={item.icon} size={20} color={C.ink2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  <Text style={s.menuSub}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.ink5} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Logout / Login ── */}
        {user ? (
          <TouchableOpacity style={s.logoutBtn} activeOpacity={0.75} onPress={confirmLogout}>
            <View style={s.logoutIcon}>
              <Ionicons name="log-out-outline" size={20} color={C.red} />
            </View>
            <Text style={s.logoutText}>Log Out</Text>
            <Ionicons name="chevron-forward" size={16} color={C.red} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.logoutBtn, { borderColor: C.brand + "20" }]} activeOpacity={0.75} onPress={() => requireAuth(() => {})}>
            <View style={[s.logoutIcon, { backgroundColor: C.brandLt }]}>
              <Ionicons name="log-in-outline" size={20} color={C.brand} />
            </View>
            <Text style={[s.logoutText, { color: C.brand }]}>Login / Sign Up</Text>
            <Ionicons name="chevron-forward" size={16} color={C.brand} />
          </TouchableOpacity>
        )}

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Image source={require("../../../assets/logo.png")} style={s.footerLogo} resizeMode="contain" />
          <Text style={s.footerName}>RG Medlink</Text>
          <Text style={s.footerVersion}>Version 1.0.0</Text>
          <Text style={s.footerCopy}>Made with love in India</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAFA" },

  /* Header */
  header: {
    backgroundColor: "#fff",
    paddingTop: TOP, paddingBottom: 20, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  headerLabel: { fontSize: 13, fontFamily: F.semiBold, color: C.ink4, marginBottom: 16 },

  /* Profile row */
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: C.brand,
    justifyContent: "center", alignItems: "center",
    shadowColor: C.brand, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  avatarText: { fontSize: 26, fontFamily: F.extraBold, color: "#fff" },
  onlineDot: {
    position: "absolute", bottom: -1, right: -1,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: "#34D399", borderWidth: 3, borderColor: "#fff",
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontFamily: F.extraBold, color: C.ink },
  profilePhone: { fontSize: 13, fontFamily: F.regular, color: C.ink4, marginTop: 2 },
  editProfileBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center",
  },

  /* Body */
  body: { flex: 1 },
  bodyContent: { paddingBottom: Platform.OS === "ios" ? 100 : 80 },

  /* Stats */
  statsRow: {
    flexDirection: "row", gap: 10,
    marginHorizontal: 16, marginTop: 20, marginBottom: 20,
  },
  statCard: {
    flex: 1, alignItems: "center",
    backgroundColor: "#fff", borderRadius: 16, paddingVertical: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  statIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: "center", alignItems: "center", marginBottom: 6,
  },
  statVal: { fontSize: 22, fontFamily: F.extraBold, color: C.ink },
  statLabel: { fontSize: 10, fontFamily: F.medium, color: C.ink4, marginTop: 2 },

  /* Quick Actions */
  quickRow: {
    flexDirection: "row", justifyContent: "space-between",
    marginHorizontal: 16, marginBottom: 20,
  },
  quickItem: { alignItems: "center", width: 70 },
  quickIcon: {
    width: 52, height: 52, borderRadius: 16,
    justifyContent: "center", alignItems: "center", marginBottom: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  quickLabel: { fontSize: 11, fontFamily: F.semiBold, color: C.ink2 },

  /* Sections */
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: {
    fontSize: 11, fontFamily: F.bold, color: C.ink4,
    letterSpacing: 1, marginBottom: 8, marginLeft: 4,
  },
  menuCard: {
    backgroundColor: "#fff", borderRadius: 18, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  menuRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 15, paddingHorizontal: 16,
  },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: "#F8FAFC" },
  menuIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#F8FAFC",
    justifyContent: "center", alignItems: "center",
  },
  menuLabel: { fontSize: 14, fontFamily: F.semiBold, color: C.ink },
  menuSub: { fontSize: 11, fontFamily: F.regular, color: C.ink4, marginTop: 1 },
  menuBadge: {
    backgroundColor: C.brand, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2, marginRight: 4,
  },
  menuBadgeText: { fontSize: 10, fontFamily: F.bold, color: "#fff" },

  /* Logout */
  logoutBtn: {
    flexDirection: "row", alignItems: "center", gap: 14,
    marginHorizontal: 16, marginBottom: 24,
    backgroundColor: "#fff", borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: C.red + "15",
  },
  logoutIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.redBg,
    justifyContent: "center", alignItems: "center",
  },
  logoutText: { flex: 1, fontSize: 14, fontFamily: F.semiBold, color: C.red },

  /* Footer */
  footer: { alignItems: "center", paddingVertical: 20 },
  footerLogo: { width: 36, height: 36, borderRadius: 10, marginBottom: 8 },
  footerName: { fontSize: 14, fontFamily: F.bold, color: C.ink3 },
  footerVersion: { fontSize: 11, fontFamily: F.regular, color: C.ink4, marginTop: 2 },
  footerCopy: { fontSize: 11, fontFamily: F.regular, color: C.ink5, marginTop: 4 },
});

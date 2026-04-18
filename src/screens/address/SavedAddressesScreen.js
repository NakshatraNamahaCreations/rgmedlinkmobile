import { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, StatusBar, ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { getAddresses, deleteAddress } from "../../api/services";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";

const TOP = Platform.OS === "ios" ? 54 : (StatusBar.currentHeight || 24) + 12;

const TYPE_ICONS = {
  Home: "home",
  Work: "briefcase",
  Other: "location",
};

export default function SavedAddressesScreen({ navigation, route }) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userId = user?._id || user?.phone || "guest_device";

  const fetchAddresses = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const res = await getAddresses(userId);
      setAddresses(res.data || res || []);
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { fetchAddresses(); }, [fetchAddresses]));

  const handleDelete = (id) => {
    Alert.alert("Delete Address", "Are you sure you want to remove this address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await deleteAddress(id);
            setAddresses((prev) => prev.filter((a) => a._id !== id));
          } catch {
            Alert.alert("Error", "Failed to delete address");
          }
        },
      },
    ]);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={C.ink} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Saved Addresses</Text>
        <TouchableOpacity
          style={s.addBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate("ChooseDeliveryArea")}
        >
          <Ionicons name="add" size={20} color={C.brand} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAddresses(); }} colors={[C.brand]} />}
        >
          {/* Add new address button */}
          <TouchableOpacity
            style={s.addCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("ChooseDeliveryArea")}
          >
            <View style={s.addIconWrap}>
              <Ionicons name="add-circle" size={22} color={C.brand} />
            </View>
            <Text style={s.addText}>Add New Address</Text>
            <Ionicons name="chevron-forward" size={16} color={C.ink4} />
          </TouchableOpacity>

          {addresses.length === 0 ? (
            <View style={s.emptyWrap}>
              <View style={s.emptyIcon}>
                <Ionicons name="location-outline" size={48} color={C.ink4} />
              </View>
              <Text style={s.emptyTitle}>No saved addresses</Text>
              <Text style={s.emptySub}>Add a delivery address to get started</Text>
            </View>
          ) : (
            <>
              <Text style={s.sectionLabel}>{addresses.length} saved address{addresses.length > 1 ? "es" : ""}</Text>

            {addresses.map((addr) => (
            <TouchableOpacity
              key={addr._id}
              activeOpacity={0.85}
              onPress={() => {
                navigation.navigate("ReviewPrescription", {
                  ...route.params,              // ✅ VERY IMPORTANT (keeps medicines, prescription, etc.)
                  addressId: addr._id           // ✅ SEND selected address
                });
              }}
            >
              <View style={[s.addrCard, addr.isDefault && s.addrCardDefault]}>
                
                {addr.isDefault && (
                  <View style={s.defaultBadge}>
                    <Ionicons name="checkmark-circle" size={12} color={C.green} />
                    <Text style={s.defaultText}>Default</Text>
                  </View>
                )}

                <View style={s.addrTop}>
                  <View style={s.addrIconWrap}>
                    <Ionicons name={TYPE_ICONS[addr.type] || "location"} size={18} color={C.brand} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={s.addrType}>{addr.type || "Address"}</Text>

                    <Text style={s.addrFull} numberOfLines={2}>
                      {addr.fullAddress || [addr.house, addr.street, addr.city].filter(Boolean).join(", ")}
                    </Text>

                    {addr.landmark ? (
                      <Text style={s.addrLandmark}>Near {addr.landmark}</Text>
                    ) : null}
                  </View>
                </View>

                {/* ACTION BUTTONS (EDIT / DELETE) */}
                <View style={s.addrActions}>
                  
                  {/* 🔧 EDIT */}
                  <TouchableOpacity
                    style={s.actionBtn}
                    activeOpacity={0.7}
                    onPress={(e) => {
                      e.stopPropagation(); // ✅ prevent selecting address when editing
                      navigation.navigate("AddressDetails", {
                        addressId: addr._id,
                        address: addr.house,
                        area: addr.street,
                        city: addr.city,
                        state: addr.state,
                        pincode: addr.pincode,
                        lat: addr.latitude,
                        lng: addr.longitude,
                      });
                    }}
                  >
                    <Ionicons name="create-outline" size={14} color={C.brand} />
                    <Text style={s.actionText}>Edit</Text>
                  </TouchableOpacity>

                  {/* 🗑 DELETE */}
                  <TouchableOpacity
                    style={[s.actionBtn, s.deleteBtn]}
                    activeOpacity={0.7}
                    onPress={(e) => {
                      e.stopPropagation(); // ✅ prevent selecting address when deleting
                      handleDelete(addr._id);
                    }}
                  >
                    <Ionicons name="trash-outline" size={14} color={C.red} />
                    <Text style={[s.actionText, { color: C.red }]}>Delete</Text>
                  </TouchableOpacity>

                </View>
              </View>
            </TouchableOpacity>
          ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAFA" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: TOP, paddingBottom: 14, paddingHorizontal: 16,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 17, fontFamily: F.bold, color: C.ink },
  addBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center",
  },

  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16, paddingBottom: 40 },

  /* Add card */
  addCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: C.brand + "20",
    borderStyle: "dashed", marginBottom: 20,
  },
  addIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center",
  },
  addText: { flex: 1, fontSize: 14, fontFamily: F.bold, color: C.brand },

  /* Empty */
  emptyWrap: { alignItems: "center", paddingTop: 60 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#F1F5F9",
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontFamily: F.bold, color: C.ink },
  emptySub: { fontSize: 13, fontFamily: F.regular, color: C.ink4, marginTop: 4 },

  sectionLabel: { fontSize: 12, fontFamily: F.semiBold, color: C.ink4, marginBottom: 12 },

  /* Address card */
  addrCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#F1F5F9", marginBottom: 12,
  },
  addrCardDefault: { borderColor: C.green + "30" },
  defaultBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-start", marginBottom: 10,
    backgroundColor: C.greenBg, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  defaultText: { fontSize: 10, fontFamily: F.bold, color: C.green },

  addrTop: { flexDirection: "row", gap: 12 },
  addrIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center",
  },
  addrType: { fontSize: 14, fontFamily: F.bold, color: C.ink, marginBottom: 2 },
  addrFull: { fontSize: 13, fontFamily: F.regular, color: C.ink3, lineHeight: 19 },
  addrLandmark: { fontSize: 12, fontFamily: F.regular, color: C.ink4, marginTop: 2 },

  addrActions: {
    flexDirection: "row", gap: 10,
    marginTop: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: "#F8FAFC",
  },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, borderColor: C.brand + "25",
    backgroundColor: C.brandLt,
  },
  deleteBtn: {
    borderColor: C.red + "20",
    backgroundColor: C.redBg,
  },
  actionText: { fontSize: 12, fontFamily: F.bold, color: C.brand },
});

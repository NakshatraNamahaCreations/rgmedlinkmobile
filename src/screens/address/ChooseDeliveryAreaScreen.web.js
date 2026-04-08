import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, ActivityIndicator, StatusBar, Animated,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";

const MYSORE = { latitude: 12.3051, longitude: 76.6551 };

export default function ChooseDeliveryAreaScreen({ navigation }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const [pin, setPin]             = useState(MYSORE);
  const [address, setAddress]     = useState("");
  const [subAddr, setSubAddr]     = useState("");
  const [geoData, setGeoData]     = useState(null);
  const [locating, setLocating]   = useState(false);
  const [geocoding, setGeocoding] = useState(true);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 160 }),
    ]).start();
  }, [navigation]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        reverseGeocode(MYSORE);
        return;
      }
      const last = await Location.getLastKnownPositionAsync();
      if (last) {
        const c = { latitude: last.coords.latitude, longitude: last.coords.longitude };
        setPin(c);
        reverseGeocode(c);
      }
      try {
        const fresh = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
        const c = { latitude: fresh.coords.latitude, longitude: fresh.coords.longitude };
        setPin(c);
        reverseGeocode(c);
      } catch {}
    })();
  }, []);

  const reverseGeocode = useCallback(async (coords) => {
    setGeocoding(true);
    try {
      const results = await Location.reverseGeocodeAsync(coords);
      if (results.length > 0) {
        const r = results[0];
        setGeoData(r);
        const main = [r.name, r.street].filter(Boolean).join(", ") || "Selected Location";
        const sub  = [r.city, r.region].filter(Boolean).join(", ");
        setAddress(main);
        setSubAddr(sub);
      }
    } catch {
      setAddress("Selected Location");
      setSubAddr("Drag map to update");
    } finally {
      setGeocoding(false);
    }
  }, []);

  const handleRecenter = useCallback(async () => {
    setLocating(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const c = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setPin(c);
      reverseGeocode(c);
    } catch {}
    finally { setLocating(false); }
  }, [reverseGeocode]);

  const handleConfirm = () => {
    navigation.navigate("AddressDetails", {
      address: geoData?.name || "",
      area: geoData?.street || geoData?.district || address,
      city: geoData?.city || "",
      state: geoData?.region || "",
      pincode: geoData?.postalCode || "",
      lat: pin.latitude,
      lng: pin.longitude,
    });
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ══════ Map placeholder (not available on web) ══════ */}
      <View style={[StyleSheet.absoluteFill, s.mapPlaceholder]}>
        <Ionicons name="map-outline" size={48} color={C.ink4} />
        <Text style={s.mapPlaceholderTxt}>Map is not available on web</Text>
      </View>

      {/* ── Top bar ── */}
      <Animated.View style={[s.topBar, { opacity: fadeAnim }]}>
        <TouchableOpacity style={s.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={C.ink} />
        </TouchableOpacity>
        <TouchableOpacity style={s.searchBar} activeOpacity={0.8}>
          <Ionicons name="search-outline" size={16} color={C.ink4} />
          <Text style={s.searchTxt}>Search for area, street name...</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── GPS recenter ── */}
      <TouchableOpacity style={s.gpsBtn} activeOpacity={0.8} onPress={handleRecenter}>
        {locating
          ? <ActivityIndicator size="small" color={C.brand} />
          : <Ionicons name="navigate" size={18} color={C.brand} />
        }
      </TouchableOpacity>

      {/* ── Use current location ── */}
      <TouchableOpacity style={s.locPill} activeOpacity={0.8} onPress={handleRecenter}>
        <View style={s.locPillDot} />
        <Text style={s.locPillTxt}>Use current location</Text>
      </TouchableOpacity>

      {/* ══════ Bottom card ══════ */}
      <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={s.handle} />

        <View style={s.addrRow}>
          <View style={s.addrDot}>
            <Ionicons name="location" size={16} color="#fff" />
          </View>

          <View style={{ flex: 1 }}>
            {geocoding ? (
              <>
                <View style={[s.skel, { width: 140 }]} />
                <View style={[s.skel, { width: 90, marginTop: 6 }]} />
              </>
            ) : (
              <>
                <Text style={s.addrTitle} numberOfLines={1}>{address}</Text>
                <Text style={s.addrSub} numberOfLines={1}>{subAddr}</Text>
              </>
            )}
          </View>

          <TouchableOpacity style={s.changePill} activeOpacity={0.75}>
            <Text style={s.changeTxt}>Change</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.confirmBtn} activeOpacity={0.85} onPress={handleConfirm}>
          <Text style={s.confirmTxt}>Confirm location</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const TOP = (StatusBar.currentHeight || 24) + 12;

const s = StyleSheet.create({
  root: { flex: 1 },

  mapPlaceholder: {
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  mapPlaceholderTxt: { fontSize: 14, fontFamily: F.regular, color: C.ink4 },

  topBar: {
    position: "absolute", top: TOP, left: 16, right: 16,
    flexDirection: "row", alignItems: "center", gap: 10, zIndex: 10,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  searchBar: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fff",
    borderRadius: 22, paddingHorizontal: 16, height: 44,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  searchTxt: { fontSize: 13, fontFamily: F.regular, color: C.ink4 },

  gpsBtn: {
    position: "absolute", right: 16, bottom: 220,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },

  locPill: {
    position: "absolute", bottom: 190, alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fff",
    borderRadius: 24, paddingHorizontal: 18, paddingVertical: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  locPillDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#34D399" },
  locPillTxt: { fontSize: 13, fontFamily: F.semiBold, color: C.ink },

  card: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center", marginBottom: 14,
  },

  addrRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#F8FAFC", borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: "#F1F5F9",
    marginBottom: 16,
  },
  addrDot: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: C.brand,
    justifyContent: "center", alignItems: "center",
  },
  addrTitle: { fontSize: 14, fontFamily: F.bold, color: C.ink },
  addrSub:   { fontSize: 12, fontFamily: F.regular, color: C.ink4, marginTop: 2 },
  changePill: {
    backgroundColor: C.brandLt, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  changeTxt: { fontSize: 12, fontFamily: F.bold, color: C.brand },

  skel: { height: 10, borderRadius: 4, backgroundColor: "#E8ECF0" },

  confirmBtn: {
    backgroundColor: C.brand, borderRadius: 16,
    paddingVertical: 17, alignItems: "center",
    shadowColor: C.brand, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 7,
  },
  confirmTxt: { fontSize: 16, fontFamily: F.bold, color: "#fff" },
});

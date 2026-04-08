import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  Platform, ActivityIndicator, StatusBar, Animated,
  Modal, TextInput, FlatList, Keyboard,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";

const { width } = Dimensions.get("window");
const MYSORE = { latitude: 12.3051, longitude: 76.6551 };
const DELTA  = { latitudeDelta: 0.005, longitudeDelta: 0.005 };
const TOP = Platform.OS === "ios" ? 54 : (StatusBar.currentHeight || 24) + 14;

/* ── Premium map style ── */
const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f8f9fa" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "simplified" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5f6368" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#dadce0" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#e8f5e9" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#c8e6c9" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a77" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e0e0e0" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#fff3e0" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#ffcc80" }] },
  { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#bbdefb" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#64b5f6" }] },
];

export default function ChooseDeliveryAreaScreen({ navigation }) {
  const mapRef      = useRef(null);
  const debounceRef = useRef(null);
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(60)).current;
  const bounceY     = useRef(new Animated.Value(0)).current;
  const shadowScale = useRef(new Animated.Value(1)).current;
  const pulseAnim   = useRef(new Animated.Value(0)).current;
  const isDragging  = useRef(false);

  const [pin, setPin]             = useState(MYSORE);
  const [addrParts, setAddrParts] = useState({ road: "", cross: "", area: "", city: "", state: "", pincode: "", full: "" });
  const [geoData, setGeoData]     = useState(null);
  const [locating, setLocating]   = useState(false);
  const [geocoding, setGeocoding] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  /* Entry animation */
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 140 }),
    ]).start();
  }, [navigation]);

  /* Pulse animation for pin ring */
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  /* Fast location on mount */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { reverseGeocode(MYSORE); return; }
      const last = await Location.getLastKnownPositionAsync();
      if (last) {
        const c = { latitude: last.coords.latitude, longitude: last.coords.longitude };
        setPin(c);
        mapRef.current?.animateToRegion({ ...c, ...DELTA }, 600);
        reverseGeocode(c);
      }
      try {
        const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const c = { latitude: fresh.coords.latitude, longitude: fresh.coords.longitude };
        setPin(c);
        mapRef.current?.animateToRegion({ ...c, ...DELTA }, 600);
        reverseGeocode(c);
      } catch {}
    })();
  }, []);

  /* Reverse geocode — extract road, cross, area, pincode */
  const reverseGeocode = useCallback(async (coords) => {
    setGeocoding(true);
    try {
      const results = await Location.reverseGeocodeAsync(coords);
      if (results.length > 0) {
        const r = results[0];
        setGeoData(r);

        // Build detailed parts
        const road    = r.street || r.name || "";
        const cross   = r.streetNumber || "";
        const area    = r.district || r.subregion || "";
        const city    = r.city || "";
        const state   = r.region || "";
        const pincode = r.postalCode || "";

        setAddrParts({ road, cross, area, city, state, pincode, full: r.formattedAddress || "" });
      }
    } catch {
      setAddrParts((prev) => ({ ...prev, road: "Selected Location", area: "Drag map to update" }));
    } finally { setGeocoding(false); }
  }, []);

  /* Pin lift */
  const liftPin = useCallback(() => {
    isDragging.current = true;
    Animated.parallel([
      Animated.spring(bounceY, { toValue: -22, useNativeDriver: true, speed: 20, bounciness: 0 }),
      Animated.timing(shadowScale, { toValue: 1.6, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  /* Pin drop */
  const dropPin = useCallback(() => {
    isDragging.current = false;
    Animated.sequence([
      Animated.timing(bounceY, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(bounceY, { toValue: -6, duration: 100, useNativeDriver: true }),
      Animated.spring(bounceY, { toValue: 0, useNativeDriver: true, damping: 10, stiffness: 400 }),
    ]).start();
    Animated.spring(shadowScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 0 }).start();
  }, []);

  /* Debounced region change */
  const handleRegionChangeComplete = useCallback((r) => {
    dropPin();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const c = { latitude: r.latitude, longitude: r.longitude };
      setPin(c);
      reverseGeocode(c);
    }, 300);
  }, [reverseGeocode, dropPin]);

  /* Recenter */
  const handleRecenter = useCallback(async () => {
    setLocating(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const c = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setPin(c);
      mapRef.current?.animateToRegion({ ...c, ...DELTA }, 600);
      reverseGeocode(c);
    } catch {} finally { setLocating(false); }
  }, [reverseGeocode]);

  /* Search for places */
  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    if (query.length < 3) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const results = await Location.geocodeAsync(query);
      const detailed = [];
      for (const r of results.slice(0, 5)) {
        const rev = await Location.reverseGeocodeAsync({ latitude: r.latitude, longitude: r.longitude });
        const info = rev[0] || {};
        detailed.push({
          latitude: r.latitude,
          longitude: r.longitude,
          name: [info.name, info.street].filter(Boolean).join(", ") || query,
          sub: [info.city, info.region, info.postalCode].filter(Boolean).join(", "),
        });
      }
      setSearchResults(detailed);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }, []);

  const selectSearchResult = (item) => {
    const c = { latitude: item.latitude, longitude: item.longitude };
    setPin(c);
    mapRef.current?.animateToRegion({ ...c, ...DELTA }, 600);
    reverseGeocode(c);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    Keyboard.dismiss();
  };

  /* Confirm */
  const handleConfirm = () => {
    navigation.navigate("AddressDetails", {
      address: addrParts.road || geoData?.name || "",
      cross: addrParts.cross || "",
      area: addrParts.area || geoData?.district || "",
      city: addrParts.city || "",
      state: addrParts.state || "",
      pincode: addrParts.pincode || "",
      lat: pin.latitude,
      lng: pin.longitude,
    });
  };

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ══════ Map ══════ */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        customMapStyle={MAP_STYLE}
        initialRegion={{ ...MYSORE, ...DELTA }}
        onRegionChange={() => { if (!isDragging.current) liftPin(); }}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        loadingEnabled
        loadingIndicatorColor={C.brand}
        loadingBackgroundColor="#FAFAFA"
        mapPadding={{ bottom: 240 }}
      />

      {/* ── Gradient top overlay ── */}
      <View style={s.topGradient} pointerEvents="none" />

      {/* ── Top bar ── */}
      <Animated.View style={[s.topBar, { opacity: fadeAnim }]}>
        <TouchableOpacity style={s.backBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={C.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.topTitle}>Set delivery location</Text>
          <Text style={s.topSub}>Move the map to adjust pin</Text>
        </View>
      </Animated.View>

      {/* ── Search bar ── */}
      <Animated.View style={[s.searchWrap, { opacity: fadeAnim }]}>
        <TouchableOpacity style={s.searchBar} activeOpacity={0.8} onPress={() => setShowSearch(true)}>
          <Ionicons name="search" size={18} color={C.ink4} />
          <Text style={s.searchTxt}>Search for area, street name...</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Search Modal ── */}
      <Modal visible={showSearch} animationType="slide" onRequestClose={() => setShowSearch(false)}>
        <View style={s.searchModal}>
          <View style={s.searchModalHeader}>
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }}>
              <Ionicons name="arrow-back" size={22} color={C.ink} />
            </TouchableOpacity>
            <TextInput
              style={s.searchInput}
              placeholder="Search area, street, city..."
              placeholderTextColor={C.ink4}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(""); setSearchResults([]); }}>
                <Ionicons name="close-circle" size={20} color={C.ink4} />
              </TouchableOpacity>
            )}
          </View>

          {searching && <ActivityIndicator color={C.brand} style={{ marginTop: 20 }} />}

          <FlatList
            data={searchResults}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={searchQuery.length >= 3 && !searching ? (
              <View style={{ alignItems: "center", paddingTop: 40 }}>
                <Ionicons name="location-outline" size={40} color={C.ink4} />
                <Text style={{ fontSize: 14, fontFamily: F.medium, color: C.ink4, marginTop: 10 }}>No results found</Text>
              </View>
            ) : null}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.searchResultItem} activeOpacity={0.7} onPress={() => selectSearchResult(item)}>
                <View style={s.searchResultIcon}>
                  <Ionicons name="location" size={18} color={C.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.searchResultName}>{item.name}</Text>
                  {item.sub ? <Text style={s.searchResultSub}>{item.sub}</Text> : null}
                </View>
                <Ionicons name="arrow-forward" size={14} color={C.ink5} />
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* ── Center pin ── */}
      <View style={s.pinWrap} pointerEvents="none">
        <Animated.View style={{ alignItems: "center", transform: [{ translateY: bounceY }] }}>
          {/* Custom pin */}
          <View style={s.pinHead}>
            <View style={s.pinHeadInner}>
              <Ionicons name="medkit" size={16} color="#fff" />
            </View>
          </View>
          <View style={s.pinStick} />
        </Animated.View>
        {/* Shadow + Pulse */}
        <View style={s.pinShadowWrap}>
          <Animated.View style={[s.pinPulse, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
          <Animated.View style={[s.pinShadow, { transform: [{ scaleX: shadowScale }] }]} />
        </View>
      </View>

      {/* ── GPS + Location pills ── */}
      <View style={s.actionRow}>
        <TouchableOpacity style={s.locPill} activeOpacity={0.8} onPress={handleRecenter}>
          <View style={s.locPillIcon}>
            {locating
              ? <ActivityIndicator size="small" color={C.brand} />
              : <Ionicons name="navigate" size={16} color={C.brand} />
            }
          </View>
          <View>
            <Text style={s.locPillTitle}>Use current location</Text>
            <Text style={s.locPillSub}>Using GPS</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.ink4} style={{ marginLeft: "auto" }} />
        </TouchableOpacity>
      </View>

      {/* ══════ Bottom card ══════ */}
      <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={s.handle} />

        {/* Delivery badge */}
        <View style={s.deliveryBadge}>
          <Ionicons name="bicycle" size={14} color={C.green} />
          <Text style={s.deliveryBadgeText}>Delivery available in this area</Text>
        </View>

        {/* Address row */}
        <View style={s.addrRow}>
          <View style={s.addrIconWrap}>
            <View style={s.addrIcon}>
              <Ionicons name="location" size={18} color="#fff" />
            </View>
            <View style={s.addrDash} />
          </View>
          <View style={s.addrContent}>
            {geocoding ? (
              <>
                <View style={[s.skel, { width: 180 }]} />
                <View style={[s.skel, { width: 140, marginTop: 8 }]} />
                <View style={[s.skel, { width: 100, marginTop: 8 }]} />
              </>
            ) : (
              <>
                <View style={s.addrTitleRow}>
                  <Text style={s.addrTitle} numberOfLines={1}>
                    {[addrParts.road, addrParts.cross].filter(Boolean).join(", ") || "Selected Location"}
                  </Text>
                  <TouchableOpacity
                    style={s.editPill}
                    activeOpacity={0.75}
                    onPress={() => navigation.navigate("AddressDetails", {
                      address: addrParts.road || geoData?.name || "",
                      cross: addrParts.cross || "",
                      area: addrParts.area || geoData?.district || "",
                      city: addrParts.city || "",
                      state: addrParts.state || "",
                      pincode: addrParts.pincode || "",
                      lat: pin.latitude,
                      lng: pin.longitude,
                    })}
                  >
                    <Text style={s.editTxt}>Edit</Text>
                  </TouchableOpacity>
                </View>
                {!!addrParts.area && (
                  <Text style={s.addrArea} numberOfLines={1}>{addrParts.area}</Text>
                )}
                <Text style={s.addrSub} numberOfLines={1}>
                  {[addrParts.city, addrParts.state, addrParts.pincode].filter(Boolean).join(", ")}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Confirm button */}
        <TouchableOpacity style={s.confirmBtn} activeOpacity={0.85} onPress={handleConfirm}>
          <Text style={s.confirmTxt}>Confirm & proceed</Text>
          <View style={s.confirmArrow}>
            <Ionicons name="arrow-forward" size={16} color={C.brand} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f9fa" },

  /* Top gradient overlay */
  topGradient: {
    position: "absolute", top: 0, left: 0, right: 0, height: TOP + 80,
    backgroundColor: "rgba(255,255,255,0.85)",
    zIndex: 5,
  },

  /* Top bar */
  topBar: {
    position: "absolute", top: TOP, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 16, zIndex: 10,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  topTitle: { fontSize: 16, fontFamily: F.bold, color: C.ink },
  topSub: { fontSize: 12, fontFamily: F.regular, color: C.ink4, marginTop: 1 },

  /* Search */
  searchWrap: {
    position: "absolute", top: TOP + 56, left: 16, right: 16, zIndex: 10,
  },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#fff", borderRadius: 14,
    paddingHorizontal: 14, height: 48,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  searchTxt: { flex: 1, fontSize: 14, fontFamily: F.regular, color: C.ink4 },

  /* Search modal */
  searchModal: { flex: 1, backgroundColor: "#fff", paddingTop: TOP },
  searchModalHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  searchInput: {
    flex: 1, fontSize: 15, fontFamily: F.medium, color: C.ink,
    paddingVertical: 10,
  },
  searchResultItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F8FAFC",
  },
  searchResultIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center",
  },
  searchResultName: { fontSize: 14, fontFamily: F.semiBold, color: C.ink },
  searchResultSub: { fontSize: 12, fontFamily: F.regular, color: C.ink4, marginTop: 2 },

  /* Pin */
  pinWrap: {
    position: "absolute",
    top: "50%", left: "50%",
    marginLeft: -24, marginTop: -68,
    width: 48, alignItems: "center",
    zIndex: 8,
  },
  pinHead: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.brand,
    justifyContent: "center", alignItems: "center",
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  pinHeadInner: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.brand,
    borderWidth: 2.5, borderColor: "rgba(255,255,255,0.6)",
    justifyContent: "center", alignItems: "center",
  },
  pinStick: {
    width: 3, height: 16,
    backgroundColor: C.brand,
    borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
    alignSelf: "center",
  },
  pinShadowWrap: {
    alignItems: "center", marginTop: -2,
  },
  pinShadow: {
    width: 14, height: 6, borderRadius: 7,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  pinPulse: {
    position: "absolute",
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: C.brand,
    top: -4,
  },

  /* Action row */
  actionRow: {
    position: "absolute", bottom: 235, left: 16, right: 16,
    zIndex: 8,
  },
  locPill: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  locPillIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.brandLt,
    justifyContent: "center", alignItems: "center",
  },
  locPillTitle: { fontSize: 14, fontFamily: F.bold, color: C.ink },
  locPillSub: { fontSize: 11, fontFamily: F.regular, color: C.ink4, marginTop: 1 },

  /* Bottom card */
  card: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 36 : 22,
    shadowColor: "#000", shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 16,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center", marginBottom: 16,
  },

  /* Delivery badge */
  deliveryBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.greenBg, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14,
    alignSelf: "flex-start",
  },
  deliveryBadgeText: { fontSize: 12, fontFamily: F.semiBold, color: C.green },

  /* Address */
  addrRow: {
    flexDirection: "row", gap: 14, marginBottom: 18,
  },
  addrIconWrap: { alignItems: "center" },
  addrIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: C.brand,
    justifyContent: "center", alignItems: "center",
  },
  addrDash: {
    flex: 1, width: 2, marginTop: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 1,
  },
  addrContent: { flex: 1 },
  addrTitleRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  addrTitle: { fontSize: 15, fontFamily: F.bold, color: C.ink, flex: 1, marginRight: 8 },
  addrArea: { fontSize: 13, fontFamily: F.semiBold, color: C.ink2, marginTop: 4 },
  addrSub: { fontSize: 12, fontFamily: F.regular, color: C.ink4, marginTop: 3, lineHeight: 18 },
  editPill: {
    borderWidth: 1.5, borderColor: C.brand, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  editTxt: { fontSize: 12, fontFamily: F.bold, color: C.brand },

  /* Skeleton */
  skel: { height: 12, borderRadius: 6, backgroundColor: "#F1F5F9" },

  /* Confirm */
  confirmBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: C.brand, borderRadius: 16,
    paddingVertical: 17, gap: 10,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  confirmTxt: { fontSize: 16, fontFamily: F.bold, color: "#fff" },
  confirmArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
  },
});

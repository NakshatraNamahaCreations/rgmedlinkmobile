import { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Pressable,
  RefreshControl, Platform, Animated, Dimensions, Image, FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import API from "../../api";
import { useAuth } from "../../context/AuthContext";
import StatusChip from "../../components/StatusChip";
import ScalePress from "../../components/ScalePress";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
const { width } = Dimensions.get("window");
const BANNER_W = width;
const BANNER_H = 160;
const fDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—";
const fCur = (v) => `₹${(v || 0).toLocaleString("en-IN")}`;

/* ── stagger ── */
function useStagger(n, d = 70) {
  const o = useRef(Array.from({ length: n }, () => new Animated.Value(0))).current;
  const y = useRef(Array.from({ length: n }, () => new Animated.Value(20))).current;
  const play = () => o.forEach((a, i) => {
    Animated.parallel([
      Animated.timing(a, { toValue: 1, duration: 350, delay: i * d, useNativeDriver: true }),
      Animated.spring(y[i], { toValue: 0, tension: 80, friction: 12, delay: i * d, useNativeDriver: true }),
    ]).start();
  });
  return { o, y, play };
}

const SPOTLIGHTS = [
  { ionicon: "pricetag", title: "Flat 20% OFF", sub: "On all medicines", bg: C.brand, tag: "NEW", iconColor: "#F87171" },
  { ionicon: "car", title: "Free Delivery", sub: "Orders above ₹499", bg: "#036C33", tag: "FREE", iconColor: "#34D399" },
  { ionicon: "flash", title: "Express Delivery", sub: "Get in 2 hours", bg: "#5C0A1B", tag: "FAST", iconColor: "#FBBF24" },
  { ionicon: "document-text", title: "Upload Rx", sub: "Get medicines in minutes", bg: "#7C3AED", tag: "EASY", iconColor: "#A78BFA" },
  { ionicon: "shield-checkmark", title: "100% Genuine", sub: "Certified pharmacies only", bg: "#1E40AF", tag: "TRUST", iconColor: "#60A5FA" },
];

const CATEGORIES = [
  { icon: "medkit", label: "Tablets", bg: "#FDF2F4", color: C.brand },
  { icon: "fitness", label: "Injections", bg: "#F5F3FF", color: "#7C3AED" },
  { icon: "water", label: "Syrups", bg: "#ECFDF5", color: "#059669" },
  { icon: "bandage", label: "First Aid", bg: "#FEF2F2", color: "#E23744" },
  { icon: "flask", label: "Lab Tests", bg: "#FFFBEB", color: "#D97706" },
  { icon: "leaf", label: "Wellness", bg: "#F0FDFA", color: "#0D9488" },
];

const HEALTH_ARTICLES = [
  { id: "morning_habits", emoji: "🧘", title: "5 Morning Habits for Better Health", time: "3 min read", color: "#059669" },
  { id: "hydration", emoji: "💧", title: "Why Hydration Matters More Than You Think", time: "4 min read", color: C.brand },
  { id: "balanced_diet", emoji: "🥗", title: "Balanced Diet: A Simple Guide", time: "5 min read", color: "#D97706" },
];

const TESTIMONIALS = [
  { text: "I didn't have to figure out the quantity of tablets. The system automatically calculated everything!", name: "Priya S.", rating: 5 },
  { text: "Uploading my prescription was so easy. Medicines delivered next day at great prices.", name: "Rahul M.", rating: 5 },
  { text: "Best pharmacy experience! Support team resolved my issue within minutes.", name: "Anita K.", rating: 4 },
];

const SEARCH_HINTS = [
  "Search for medicines...",
  "Search for Paracetamol",
  "Search for Vitamins",
  "Search for health products...",
  "Search for Dolo 650",
  "Upload your prescription",
];

function AnimatedSearchText() {
  const [idx, setIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out + slide up
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -10, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setIdx((prev) => (prev + 1) % SEARCH_HINTS.length);
        slideAnim.setValue(10);
        // Fade in + slide down
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ flex: 1, overflow: "hidden", height: 20, justifyContent: "center" }}>
      <Animated.Text
        style={{
          fontSize: 13, fontFamily: F.regular, color: "rgba(255,255,255,0.4)",
          opacity: fadeAnim, transform: [{ translateY: slideAnim }],
        }}
        numberOfLines={1}
      >
        {SEARCH_HINTS[idx]}
      </Animated.Text>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { user, requireAuth } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const { o, y, play } = useStagger(12, 60);
  const [spotIdx, setSpotIdx] = useState(0);
  const tabNav = navigation.getParent();
    const tabBarHeight = useBottomTabBarHeight();

  // Slide animation
  const slideFade = useRef(new Animated.Value(1)).current;
  const slideY = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  // Background floating particles
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;
  const glow1 = useRef(new Animated.Value(0.3)).current;

  // Promo icon pulse + text + scan line
  const promoIconPulse = useRef(new Animated.Value(1)).current;
  const promoIconGlow = useRef(new Animated.Value(0.2)).current;
  const promoTextFade = useRef(new Animated.Value(0.8)).current;
  const promoLine1 = useRef(new Animated.Value(0)).current;  // "Upload Prescription &"
  const promoLine2 = useRef(new Animated.Value(0)).current;  // "Get 10% OFF"
  const promoSubFade = useRef(new Animated.Value(0)).current; // sub text
  const promoBtnSlide = useRef(new Animated.Value(20)).current; // button
  const promoBtnFade = useRef(new Animated.Value(0)).current;
  const scanLineY = useRef(new Animated.Value(0)).current;
  const scanLineOpacity = useRef(new Animated.Value(0)).current;
  // Bike ride animation
  const bikeRide = useRef(new Animated.Value(-80)).current;
  const housePop = useRef(new Animated.Value(1)).current;
  const plusPop = useRef(new Animated.Value(0)).current;
  // Delivery banner text + bg
  const delTextFade = useRef(new Animated.Value(0)).current;
  const delTextSlide = useRef(new Animated.Value(15)).current;
  const delSubFade = useRef(new Animated.Value(0)).current;
  const delBgFloat1 = useRef(new Animated.Value(0)).current;
  const delBgFloat2 = useRef(new Animated.Value(0)).current;
  // Upload Rx spotlight pulse
  const rxPulse = useRef(new Animated.Value(1)).current;
  const rxGlow = useRef(new Animated.Value(0.3)).current;
  // Shimmer sweep
  const shimmerX = useRef(new Animated.Value(-width)).current;
  // Sparkle particles
  const spark1 = useRef(new Animated.Value(0)).current;
  const spark2 = useRef(new Animated.Value(0)).current;
  const sparkFade1 = useRef(new Animated.Value(0)).current;
  const sparkFade2 = useRef(new Animated.Value(0)).current;

  // Background floating animations (loop forever)
  useEffect(() => {
    const loop = (anim, toVal, duration) =>
      Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: toVal, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
      ]));
    const l1 = loop(float1, -20, 4000);
    const l2 = loop(float2, 15, 3500);
    const l3 = loop(float3, -12, 5000);
    const l4 = Animated.loop(Animated.sequence([
      Animated.timing(glow1, { toValue: 0.6, duration: 3000, useNativeDriver: true }),
      Animated.timing(glow1, { toValue: 0.2, duration: 3000, useNativeDriver: true }),
    ]));
    // Shimmer sweep across the section
    const l5 = Animated.loop(Animated.sequence([
      Animated.timing(shimmerX, { toValue: width * 2, duration: 3000, useNativeDriver: true }),
      Animated.delay(4000),
      Animated.timing(shimmerX, { toValue: -width, duration: 0, useNativeDriver: true }),
    ]));
    // Sparkle particles that pop in and out
    const l6 = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(spark1, { toValue: -30, duration: 2500, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(sparkFade1, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(sparkFade1, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ]),
      ]),
      Animated.timing(spark1, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    const l7 = Animated.loop(Animated.sequence([
      Animated.delay(1200),
      Animated.parallel([
        Animated.timing(spark2, { toValue: -25, duration: 2000, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(sparkFade2, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(sparkFade2, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ]),
      ]),
      Animated.timing(spark2, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    // Promo icon pulse
    const l8 = Animated.loop(Animated.sequence([
      Animated.timing(promoIconPulse, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
      Animated.timing(promoIconPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ]));
    // Promo icon glow
    const l9 = Animated.loop(Animated.sequence([
      Animated.timing(promoIconGlow, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
      Animated.timing(promoIconGlow, { toValue: 0.15, duration: 1000, useNativeDriver: true }),
    ]));
    // Promo text highlight shimmer
    const l10 = Animated.loop(Animated.sequence([
      Animated.timing(promoTextFade, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(promoTextFade, { toValue: 0.7, duration: 1200, useNativeDriver: true }),
    ]));

    // Staggered text reveal for promo
    const l12 = Animated.loop(Animated.sequence([
      // Reset
      Animated.parallel([
        Animated.timing(promoLine1, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(promoLine2, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(promoSubFade, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(promoBtnFade, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(promoBtnSlide, { toValue: 20, duration: 0, useNativeDriver: true }),
      ]),
      // Line 1 slides in
      Animated.timing(promoLine1, { toValue: 1, duration: 400, useNativeDriver: true }),
      // Line 2 slides in
      Animated.timing(promoLine2, { toValue: 1, duration: 400, useNativeDriver: true }),
      // Sub text fades in
      Animated.timing(promoSubFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      // Button slides up
      Animated.parallel([
        Animated.timing(promoBtnFade, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(promoBtnSlide, { toValue: 0, useNativeDriver: true, damping: 12, stiffness: 100 }),
      ]),
      // Hold
      Animated.delay(4000),
    ]));

    // Scan line sweeping over prescription
    const l11 = Animated.loop(Animated.sequence([
      Animated.timing(scanLineOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(scanLineY, { toValue: 50, duration: 1200, useNativeDriver: true }),
      Animated.timing(scanLineOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scanLineY, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.delay(2000),
    ]));

    // Delivery bg floating circles
    const l17 = Animated.loop(Animated.sequence([
      Animated.timing(delBgFloat1, { toValue: -10, duration: 3000, useNativeDriver: true }),
      Animated.timing(delBgFloat1, { toValue: 10, duration: 3000, useNativeDriver: true }),
    ]));
    const l18 = Animated.loop(Animated.sequence([
      Animated.timing(delBgFloat2, { toValue: 8, duration: 2500, useNativeDriver: true }),
      Animated.timing(delBgFloat2, { toValue: -8, duration: 2500, useNativeDriver: true }),
    ]));
    l17.start(); l18.start();

    // ALL delivery animations in ONE synced loop
    const l13 = Animated.loop(Animated.sequence([
      // ── Reset everything ──
      Animated.parallel([
        Animated.timing(bikeRide, { toValue: -80, duration: 0, useNativeDriver: true }),
        Animated.timing(housePop, { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.timing(plusPop, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(delTextFade, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(delTextSlide, { toValue: 15, duration: 0, useNativeDriver: true }),
        Animated.timing(delSubFade, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
      // ── Bike starts + title appears together ──
      Animated.parallel([
        Animated.timing(bikeRide, { toValue: width - 130, duration: 2500, useNativeDriver: true }),
        Animated.timing(delTextFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(delTextSlide, { toValue: 0, useNativeDriver: true, damping: 14, stiffness: 120 }),
      ]),
      // ── Bike arrives at house — house pops + plus + subtitle all together ──
      Animated.parallel([
        Animated.spring(housePop, { toValue: 1.3, useNativeDriver: true, damping: 6, stiffness: 120 }),
        Animated.spring(plusPop, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 150 }),
        Animated.timing(delSubFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      // ── Hold ──
      Animated.delay(1500),
      // ── House shrinks, bike rides away ──
      Animated.parallel([
        Animated.timing(housePop, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(bikeRide, { toValue: width + 50, duration: 800, useNativeDriver: true }),
      ]),
      // ── Everything fades out ──
      Animated.parallel([
        Animated.timing(plusPop, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(delTextFade, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(delSubFade, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
      // ── Pause before next loop ──
      Animated.delay(1500),
    ]));

    l1.start(); l2.start(); l3.start(); l4.start(); l5.start(); l6.start(); l7.start(); l8.start(); l9.start(); l10.start(); l11.start(); l12.start(); l13.start();
    return () => { l1.stop(); l2.stop(); l3.stop(); l4.stop(); l5.stop(); l6.stop(); l7.stop(); l8.stop(); l9.stop(); l10.stop(); l11.stop(); l12.stop(); l13.stop(); l17.stop(); l18.stop(); };
  }, []);

  // Upload Rx pulse — only when slide 3 (Upload Rx) is active
  useEffect(() => {
    if (spotIdx === 3) {
      const pulse = Animated.loop(Animated.sequence([
        Animated.timing(rxPulse, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(rxPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]));
      const glow = Animated.loop(Animated.sequence([
        Animated.timing(rxGlow, { toValue: 0.7, duration: 600, useNativeDriver: true }),
        Animated.timing(rxGlow, { toValue: 0.2, duration: 600, useNativeDriver: true }),
      ]));
      pulse.start(); glow.start();
      return () => { pulse.stop(); glow.stop(); rxPulse.setValue(1); rxGlow.setValue(0.3); };
    }
  }, [spotIdx]);

  // Auto-rotate slides with animation
  const SLIDE_DURATIONS = [2000, 3000, 3000, 3000, 3000];
  useEffect(() => {
    // Reset
    slideFade.setValue(0);
    slideY.setValue(14);
    iconScale.setValue(0.7);

    // All together
    Animated.parallel([
      Animated.timing(slideFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, damping: 14, stiffness: 120 }),
      Animated.spring(iconScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 100 }),
    ]).start();

    // Schedule next
    const delay = SLIDE_DURATIONS[spotIdx] || 3000;
    const timeout = setTimeout(() => {
      // Quick fade out then instant change
      Animated.timing(slideFade, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
        setSpotIdx((prev) => (prev + 1) % SPOTLIGHTS.length);
      });
    }, delay);
    return () => clearTimeout(timeout);
  }, [spotIdx]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userId = user?._id || user?.phone;
      if (!userId) { setOrders([]); setLoading(false); setTimeout(() => play(), 50); return; }
      const params = new URLSearchParams({ page: "1", limit: "3" });
      params.set("userId", userId);
      const res = await API.get(`/orders?${params.toString()}`).catch(() => ({ data: { data: [] } }));
      setOrders(res.data.data || []);
    } catch {}
    setLoading(false);
    setTimeout(() => play(), 50);
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const A = ({ i, children, style }) => (
    <Animated.View style={[style, { opacity: o[i], transform: [{ translateY: y[i] }] }]}>{children}</Animated.View>
  );

  return (
    <ScrollView
       style={s.container}
  contentContainerStyle={{
    paddingBottom: tabBarHeight + 60, // increase space
    flexGrow: 1, // IMPORTANT
  }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.brand]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ══════ DARK HERO SECTION ══════ */}
      <View style={s.darkSection}>

      {/* Floating background elements */}
      <Animated.View style={[s.bgFloat, s.bgFloat1, { transform: [{ translateY: float1 }], opacity: glow1 }]} />
      <Animated.View style={[s.bgFloat, s.bgFloat2, { transform: [{ translateY: float2 }, { translateX: float3 }] }]} />
      <Animated.View style={[s.bgFloat, s.bgFloat3, { transform: [{ translateY: float3 }] }]} />
      <Animated.View style={[s.bgFloat, s.bgFloat4, { transform: [{ translateX: float1 }, { translateY: float2 }], opacity: glow1 }]} />

      {/* Shimmer sweep */}
      <Animated.View style={[s.shimmer, { transform: [{ translateX: shimmerX }, { rotate: "15deg" }] }]} />

      {/* Sparkle particles */}
      <Animated.View style={[s.sparkle, s.sparkle1, { transform: [{ translateY: spark1 }], opacity: sparkFade1 }]}>
        <Ionicons name="add" size={10} color="rgba(255,255,255,0.5)" />
      </Animated.View>
      <Animated.View style={[s.sparkle, s.sparkle2, { transform: [{ translateY: spark2 }], opacity: sparkFade2 }]}>
        <Ionicons name="add" size={8} color="rgba(255,255,255,0.4)" />
      </Animated.View>

      {/* ── TOP BAR with Logo ── */}
      <View style={s.topBar}>
        <View style={s.topLeft}>
          <View style={s.logoWrap}>
            <Image source={require("../../../assets/logo.png")} style={s.logoImg} resizeMode="contain" />
          </View>
          <View>
            <Text style={s.brandTitle}>RG Medlink</Text>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              activeOpacity={0.7}
              onPress={() => { if (!tabNav) return; tabNav.navigate("OrdersTab", { screen: "ChooseDeliveryArea" }); }}
            >
              <Ionicons name="location" size={11} color={C.brand} />
              <Text style={s.locationText}>Deliver to {user?.name || "Home"}</Text>
              <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity style={s.topIcon} onPress={() => navigation.navigate("Notifications")}>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
            {orders.length > 0 && <View style={s.badge}><Text style={s.badgeText}>{orders.length}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity style={s.topIcon} onPress={() => { if (!tabNav) return; tabNav.navigate("ProfileTab"); }}>
            <Ionicons name="person-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>


      {/* ── ANIMATED SEARCH ── */}
      <A i={0}>
        <ScalePress onPress={() => requireAuth(() => navigation.navigate("UploadPrescription"))} scaleTo={0.98}>
          <View style={s.searchBar}>
            <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.4)" />
            <AnimatedSearchText />
          </View>
        </ScalePress>
      </A>

      {/* ── HERO BANNER (fade transition) ── */}
      <A i={1}>
        <TouchableOpacity activeOpacity={1} onPress={() => requireAuth(() => navigation.navigate("UploadPrescription"))}>
          <View style={s.bannerSlide}>
            <View style={s.bannerCard}>
              <Animated.View style={[s.bannerContent, { opacity: slideFade, transform: [{ translateY: slideY }] }]}>
                <View style={s.bannerTagRow}>
                  <View style={s.bannerTag}>
                    <Text style={s.bannerTagText}>{SPOTLIGHTS[spotIdx].tag}</Text>
                  </View>
                </View>
                <Text style={s.bannerTitle}>{SPOTLIGHTS[spotIdx].title}</Text>
                <Text style={s.bannerSub}>{SPOTLIGHTS[spotIdx].sub}</Text>
                <View style={s.bannerBtn}>
                  <Text style={s.bannerBtnText}>Shop Now</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </View>
              </Animated.View>
              <Animated.View style={[s.bannerIconOuter, {
                borderColor: (SPOTLIGHTS[spotIdx].iconColor || "#fff") + "25",
                opacity: slideFade,
                transform: [{ scale: Animated.multiply(iconScale, spotIdx === 3 ? rxPulse : new Animated.Value(1)) }],
              }]}>
                {spotIdx === 3 && (
                  <Animated.View style={[s.rxGlowRing, { opacity: rxGlow, transform: [{ scale: rxPulse }] }]} />
                )}
                <View style={[s.bannerIconInner, { backgroundColor: (SPOTLIGHTS[spotIdx].iconColor || "#fff") + "18" }]}>
                  <Ionicons name={SPOTLIGHTS[spotIdx].ionicon} size={38} color={SPOTLIGHTS[spotIdx].iconColor || "#fff"} />
                </View>
              </Animated.View>
              <View style={[s.bannerCircle, s.bannerCircle1]} />
              <View style={[s.bannerCircle, s.bannerCircle2]} />
            </View>
          </View>
        </TouchableOpacity>
      </A>

      {/* ── QUICK SERVICES ── */}
      <A i={2}>
        <View style={s.servSection}>
          <View style={s.servGrid}>
            {[
              { icon: "medkit", label: "Order\nMedicine", color: "#fff", nav: "HomeStack", screen: "UploadPrescription" },
              { icon: "document-text", label: "Upload\nRx", color: "#fff", nav: "HomeStack", screen: "UploadPrescription" },
              { icon: "cube", label: "Track\nOrder", color: "#fff", nav: "OrdersTab" },
              {
  icon: "chatbubbles",
  label: "Chat\nSupport",
  color: "#fff",
  nav: "ProfileTab",
  screen: "ChatScreen"
}
            ].map((srv, i) => (
              <ScalePress key={i} onPress={() => requireAuth(() => {
              if (srv.nav === "HomeStack") {
                navigation.navigate(srv.screen);
              } else if (!tabNav) {
                return;
              } else if (srv.screen) {
                tabNav.navigate(srv.nav, { screen: srv.screen, initial: false });
              } else {
                tabNav.navigate(srv.nav, { screen: srv.nav === "OrdersTab" ? "OrdersList" : srv.nav === "ProfileTab" ? "ProfileHome" : undefined });
              }
            })} scaleTo={0.9}>
                <View style={s.servItem}>
                  <View style={[s.servIcon, { backgroundColor: srv.bg }]}>
                    <Ionicons name={srv.icon} size={26} color={srv.color} />
                  </View>
                  <Text style={s.servLabel}>{srv.label}</Text>
                </View>
              </ScalePress>
            ))}
          </View>
        </View>
      </A>

      </View>
      {/* ══════ END DARK SECTION ══════ */}

      {/* ── ASSISTANCE STRIP ── */}
      <A i={3}>
   <ScalePress onPress={() => requireAuth(() => { 
  if (!tabNav) return; 
  tabNav.navigate("ProfileTab", { screen: "ChatScreen" }); 
})}>
          <View style={s.assistStrip}>
            <Ionicons name="headset-outline" size={20} color={C.brand} />
            <Text style={s.assistText}>Need order assistance?</Text>
            <View style={s.assistBtn}>
              <Ionicons name="chatbubbles" size={13} color="#fff" />
              <Text style={s.assistBtnText}>Chat Now</Text>
            </View>
          </View>
        </ScalePress>
      </A>


      {/* ── PROMO BANNER ── */}
      <A i={5}>
        <View style={s.promoCard}>
          <View style={s.promoLeft}>
            <View style={s.promoTag}>
              <Text style={s.promoTagText}>LIMITED OFFER</Text>
            </View>
            <Animated.Text style={[s.promoTitle, { opacity: promoLine1 }]}>Upload Prescription &</Animated.Text>
            <Animated.Text style={[s.promoTitle, { opacity: promoLine2 }]}>Get <Text style={s.promoHighlight}>10% OFF</Text></Animated.Text>
            <Animated.Text style={[s.promoSub, { opacity: promoSubFade }]}>On your first medicine order</Animated.Text>
            <Animated.View style={{ opacity: promoBtnFade, transform: [{ translateY: promoBtnSlide }] }}>
              <TouchableOpacity style={s.promoBtn} activeOpacity={0.85} onPress={() => requireAuth(() => navigation.navigate("UploadPrescription"))}>
                <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                <Text style={s.promoBtnText}>Upload Now</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
          <View style={s.promoRight}>
            {/* Prescription scan animation */}
            <View style={s.scanCard}>
              {/* Prescription icon */}
              <View style={s.scanDoc}>
                <View style={s.scanDocLine} />
                <View style={[s.scanDocLine, { width: 28 }]} />
                <View style={s.scanDocLine} />
                <View style={[s.scanDocLine, { width: 20 }]} />
                <View style={s.scanDocLine} />
              </View>
              {/* Scan line sweeping */}
              <Animated.View style={[s.scanLine, { transform: [{ translateY: scanLineY }], opacity: scanLineOpacity }]} />
              {/* Scan corners */}
              <View style={[s.scanCorner, s.scanTL]} />
              <View style={[s.scanCorner, s.scanTR]} />
              <View style={[s.scanCorner, s.scanBL]} />
              <View style={[s.scanCorner, s.scanBR]} />
            </View>
            {/* Badge */}
            <Animated.View style={[s.promoBadge, { transform: [{ scale: promoIconPulse }] }]}>
              <Text style={s.promoBadgeText}>10%</Text>
              <Text style={s.promoBadgeSub}>OFF</Text>
            </Animated.View>
          </View>
          <View style={[s.promoCircle, s.promoCircle1]} />
          <View style={[s.promoCircle, s.promoCircle2]} />
        </View>
      </A>

      <A i={6}>
        <View style={s.trustRow}>
          {[
            { icon: "shield-checkmark", label: "Certified", sub: "Medicines" },
            { icon: "document-text", label: "Accurate", sub: "Prescriptions" },
            { icon: "pricetag", label: "Affordable", sub: "Prices" },
          ].map((b, i) => (
            <View key={i} style={s.trustItem}>
              <View style={s.trustIcon}><Ionicons name={b.icon} size={18} color={C.brand} /></View>
              <Text style={s.trustLabel}>{b.label}</Text>
              <Text style={s.trustSub}>{b.sub}</Text>
            </View>
          ))}
        </View>
      </A>

      {/* ── MY ORDERS ── */}
      <A i={7}>
        <View style={s.secRow}>
          <Text style={s.secTitle}>My Orders</Text>
          <TouchableOpacity onPress={() => { if (!tabNav) return; tabNav.navigate("OrdersTab", { screen: "OrdersList" }); }}>
            <Text style={s.seeAll}>View all →</Text>
          </TouchableOpacity>
        </View>
        {orders.length === 0 ? (
          <View style={s.emptyCard}>
            <Ionicons name="document-text-outline" size={36} color={C.brand} />
            <Text style={s.emptyTitle}>No orders yet</Text>
            <Text style={s.emptySub}>Upload your prescription to get started</Text>
            <ScalePress onPress={() => { if (!tabNav) return; tabNav.navigate("OrdersTab", { screen: "UploadPrescription" }); }} scaleTo={0.95}>
              <View style={s.uploadBtn}>
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                <Text style={s.uploadBtnText}>Upload Prescription</Text>
              </View>
            </ScalePress>
          </View>
        ) : orders.slice(0, 3).map((ord) => (
          <ScalePress key={ord._id} onPress={() => { if (!tabNav) return; tabNav.navigate("OrdersTab", { screen: "OrderDetail", params: { order: ord } }); }}>
            <View style={s.orderCard}>
              <View style={s.orderDot}><Ionicons name="cube" size={16} color={C.brand} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.orderId}>{ord.orderId}</Text>
                <Text style={s.orderMeta}>{ord.patientDetails?.name || "—"} · {fDate(ord.createdAt)}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={s.orderAmt}>{fCur(ord.totalAmount)}</Text>
                <StatusChip label={ord.orderStatus || "Created"} />
              </View>
            </View>
          </ScalePress>
        ))}
      </A>

      {/* ── DELIVERY BANNER — bike rides to house ── */}
      <A i={7}>
        <View style={s.bikeBanner}>
          {/* Floating bg circles */}
          <Animated.View style={[s.delBgCircle1, { transform: [{ translateY: delBgFloat1 }] }]} />
          <Animated.View style={[s.delBgCircle2, { transform: [{ translateX: delBgFloat2 }] }]} />
          <Animated.View style={[s.delBgCircle3, { transform: [{ translateY: delBgFloat2 }, { translateX: delBgFloat1 }] }]} />

          <Animated.Text style={[s.bikeBannerTitle, { opacity: delTextFade, transform: [{ translateY: delTextSlide }] }]}>We deliver to your home</Animated.Text>
          <Animated.Text style={[s.bikeBannerSub, { opacity: delSubFade }]}>Medicines at your doorstep</Animated.Text>
          <View style={s.bikeTrack}>
            <View style={s.bikeRoad} />
            <Animated.View style={[s.bikeIconWrap, { transform: [{ translateX: bikeRide }] }]}>
              <Ionicons name="bicycle" size={48} color={C.accent} />
              <View style={s.bikeBox}>
                <Ionicons name="add" size={10} color="#fff" />
              </View>
            </Animated.View>
            <Animated.View style={[s.bikeHouse, { transform: [{ scale: housePop }] }]}>
              <Ionicons name="home" size={28} color={C.accent} />
              <Animated.View style={[s.housePlus, { transform: [{ scale: plusPop }] }]}>
                <Ionicons name="add" size={12} color="#fff" />
              </Animated.View>
            </Animated.View>
          </View>
        </View>
      </A>

      {/* ── HEALTH ARTICLES ── */}
      <A i={8}>
        <Text style={[s.secTitle, { marginTop: 24 }]}>Health Articles</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
          {HEALTH_ARTICLES.map((a, i) => (
            <TouchableOpacity key={i} activeOpacity={0.85} onPress={() => navigation.navigate("HealthArticle", { articleId: a.id })}>
              <View style={s.articleCard}>
                <Text style={{ fontSize: 32 }}>{a.emoji}</Text>
                <Text style={s.articleTitle}>{a.title}</Text>
                <View style={s.articleBot}>
                  <Ionicons name="time-outline" size={12} color="#94A3B8" />
                  <Text style={s.articleTime}>{a.time}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </A>

      {/* ── TESTIMONIALS ── */}
      <A i={9}>
        <Text style={[s.secTitle, { marginTop: 24 }]}>What our customers say</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
          {TESTIMONIALS.map((t, i) => (
            <View key={i} style={s.testiCard}>
              <View style={s.testiStars}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <Ionicons key={j} name={j < t.rating ? "star" : "star-outline"} size={14} color="#F59E0B" />
                ))}
              </View>
              <Text style={s.testiText}>{t.text}</Text>
              <View style={s.testiAuth}>
                <View style={s.testiAv}><Text style={s.testiAvT}>{t.name[0]}</Text></View>
                <Text style={s.testiName}>{t.name}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </A>

      {/* ── FOOTER ── */}
      <View style={s.footer}>
        <View style={s.footerBrand}>
          <Image source={require("../../../assets/logo.png")} style={s.footerLogo} resizeMode="contain" />
          <Text style={s.footerName}>RG Medlink</Text>
        </View>
        <Text style={s.footerTagline}>Your Health, Delivered</Text>
        <View style={s.footerDivider} />
        <Text style={s.footerCopy}>© 2026 RG Medlink. All rights reserved.</Text>
      </View>

    </ScrollView>

  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Dark hero section
  darkSection: {
    backgroundColor: "#2D0810",
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },

  // Floating bg elements
  bgFloat: { position: "absolute", borderRadius: 999 },
  bgFloat1: {
    width: 140, height: 140, top: -30, right: -20,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  bgFloat2: {
    width: 80, height: 80, top: 120, left: 20,
    backgroundColor: "rgba(127,14,37,0.25)",
  },
  bgFloat3: {
    width: 60, height: 60, bottom: 80, right: 40,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  bgFloat4: {
    width: 100, height: 100, bottom: 30, left: -30,
    backgroundColor: "rgba(127,14,37,0.15)",
  },

  // Shimmer sweep line
  shimmer: {
    position: "absolute", top: 0, width: 40, height: "100%",
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  // Sparkle plus signs
  sparkle: { position: "absolute" },
  sparkle1: { top: 100, right: 50 },
  sparkle2: { top: 200, left: 80 },

  // Top bar
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: Platform.OS === "ios" ? 56 : 42, paddingBottom: 10,
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoWrap: {
    width: 38, height: 38, borderRadius: 10, overflow: "hidden",
    backgroundColor: "#fff",
  },
  logoImg: { width: 38, height: 38 },
  brandTitle: { fontSize: 16, fontFamily: F.extraBold, color: "#fff" },
  locationText: { fontSize: 12, fontFamily: F.medium, color: "rgba(255,255,255,0.5)" },
  topIcon: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center", alignItems: "center",
  },
  badge: {
    position: "absolute", top: -2, right: -2,
    width: 16, height: 16, borderRadius: 8, backgroundColor: "#E23744",
    justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderColor: "#2D0810",
  },
  badgeText: { fontSize: 8, fontFamily: F.bold, color: "#fff" },

  // Notification panel — Facebook style
  notifOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
  },
  notifPanel: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    paddingTop: Platform.OS === "ios" ? 54 : 40,
    maxHeight: "80%",
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 20,
  },
  notifHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  notifHeaderTitle: { fontSize: 22, fontFamily: F.extraBold, color: C.ink },
  notifList: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  notifItem: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#F8FAFC",
  },
  notifItemIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#ECFDF5",
    justifyContent: "center", alignItems: "center",
  },
  notifItemTitle: { fontSize: 14, fontFamily: F.bold, color: C.ink },
  notifItemSub: { fontSize: 13, fontFamily: F.regular, color: C.ink3, marginTop: 2, lineHeight: 18 },
  notifItemTime: { fontSize: 12, fontFamily: F.medium, color: C.ink4, marginTop: 4 },
  notifEmpty: { alignItems: "center", paddingVertical: 10 },
  notifEmptyText: { fontSize: 13, fontFamily: F.regular, color: C.ink4 },

  // Search
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12,
    marginHorizontal: 20, marginBottom: 14, paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  searchText: { flex: 1, fontSize: 13, fontFamily: F.regular, color: "#94A3B8" },
  searchMic: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0",
  },

  // Hero Banner — no card/box, just content on dark bg
  bannerWrap: { marginBottom: 6 },
  bannerSlide: { width: BANNER_W, paddingHorizontal: 24 },
  bannerCard: {
    padding: 10, height: BANNER_H,
    flexDirection: "row", alignItems: "center",
  },
  bannerContent: { flex: 1, zIndex: 2 },
  bannerTagRow: { flexDirection: "row", marginBottom: 8 },
  bannerTag: {
    backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  bannerTagText: { fontSize: 12, fontFamily: F.extraBold, color: "#fff", letterSpacing: 1.2 },
  bannerTitle: { fontSize: 26, fontFamily: F.extraBold, color: "#fff", lineHeight: 32 },
  bannerSub: { fontSize: 14, fontFamily: F.medium, color: "rgba(255,255,255,0.5)", marginTop: 4 },
  bannerBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)", borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 9, alignSelf: "flex-start", marginTop: 16,
  },
  bannerBtnText: { fontSize: 13, fontFamily: F.bold, color: "#fff" },
  bannerIconOuter: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 2,
    justifyContent: "center", alignItems: "center", zIndex: 2,
  },
  bannerIconInner: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: "center", alignItems: "center",
  },
  rxGlowRing: {
    position: "absolute",
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: "#A78BFA",
  },
  bannerCircle: {
    position: "absolute", borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  bannerCircle1: { width: 160, height: 160, top: -40, right: -30 },
  bannerCircle2: { width: 100, height: 100, bottom: -30, left: -20 },
  dotRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 12 },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 24, backgroundColor: "#fff" },
  dotInactive: { width: 8, backgroundColor: "rgba(255,255,255,0.25)" },

  // Services — horizontal scroll cards
  servSection: { marginTop: 16 },
  servGrid: {
    flexDirection: "row", justifyContent: "space-evenly",
    marginHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 18, paddingVertical: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  servItem: { alignItems: "center", width: (width - 56) / 4 },
  servIcon: {
    width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  servLabel: { fontSize: 13, fontFamily: F.semiBold, color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 17 },

  // Assist strip
  assistStrip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 20, marginTop: 16, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#F8FAFC", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0",
  },
  assistText: { flex: 1, fontSize: 13, fontFamily: F.semiBold, color: "#334155" },
  assistBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.brand, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
  },
  assistBtnText: { fontSize: 12, fontFamily: F.bold, color: "#fff" },

  // Categories
  catItem: { alignItems: "center", width: 72 },
  catIcon: {
    width: 56, height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center", marginBottom: 6,
  },
  catLabel: { fontSize: 12, fontFamily: F.semiBold, color: "#334155" },

  // Promo
  promoCard: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 20, marginTop: 20, borderRadius: 20, padding: 22,
    backgroundColor: C.brandLt, overflow: "hidden",
    borderWidth: 1.5, borderColor: "rgba(127,14,37,0.1)",
  },
  promoLeft: { flex: 1, zIndex: 2 },
  promoTag: {
    backgroundColor: C.brand, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: "flex-start", marginBottom: 10,
  },
  promoTagText: { fontSize: 12, fontFamily: F.extraBold, color: "#fff", letterSpacing: 1 },
  promoTitle: { fontSize: 16, fontFamily: F.bold, color: C.ink, lineHeight: 22 },
  promoHighlight: { color: C.brand, fontFamily: F.extraBold },
  promoSub: { fontSize: 12, fontFamily: F.regular, color: C.ink3, marginTop: 4 },
  promoBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.brand, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    alignSelf: "flex-start", marginTop: 14,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  promoBtnText: { fontSize: 12, fontFamily: F.bold, color: "#fff" },
  promoRight: { alignItems: "center", zIndex: 2, marginLeft: 12 },
  // Scan card — prescription being scanned
  scanCard: {
    width: 72, height: 80, borderRadius: 12,
    backgroundColor: "#fff",
    padding: 10, justifyContent: "center",
    overflow: "hidden",
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 3,
  },
  scanDoc: { gap: 5 },
  scanDocLine: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "#E8ECF0",
  },
  scanLine: {
    position: "absolute", left: 4, right: 4,
    height: 2, backgroundColor: C.brand,
    borderRadius: 1,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 6, elevation: 3,
  },
  scanCorner: {
    position: "absolute", width: 14, height: 14,
    borderColor: C.brand,
  },
  scanTL: { top: -1, left: -1, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 12 },
  scanTR: { top: -1, right: -1, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 12 },
  scanBL: { bottom: -1, left: -1, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 12 },
  scanBR: { bottom: -1, right: -1, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 12 },
  promoBadge: {
    backgroundColor: C.brand, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 4,
    alignItems: "center", marginTop: -8,
  },
  promoBadgeText: { fontSize: 16, fontFamily: F.extraBold, color: "#fff" },
  promoBadgeSub: { fontSize: 8, fontFamily: F.bold, color: "rgba(255,255,255,0.7)", marginTop: -2 },
  promoCircle: {
    position: "absolute", borderRadius: 999,
    backgroundColor: "rgba(127,14,37,0.06)",
  },
  promoCircle1: { width: 140, height: 140, top: -40, right: -30 },
  promoCircle2: { width: 90, height: 90, bottom: -30, left: -20 },

  // Promo 2 — Free Delivery
  promo2Card: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 20, marginTop: 24, borderRadius: 20, padding: 22,
    backgroundColor: C.accentLt, overflow: "hidden",
    borderWidth: 1.5, borderColor: "rgba(3,108,51,0.1)",
  },
  promo2Left: { flex: 1, zIndex: 2 },
  promo2Tag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.accent, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: "flex-start", marginBottom: 10,
  },
  promo2TagText: { fontSize: 12, fontFamily: F.extraBold, color: "#fff", letterSpacing: 1 },
  promo2Title: { fontSize: 16, fontFamily: F.bold, color: C.ink, lineHeight: 22 },
  promo2Highlight: { color: C.accent, fontFamily: F.extraBold },
  promo2Sub: { fontSize: 12, fontFamily: F.regular, color: C.ink3, marginTop: 4 },
  promo2Btn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.accent, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    alignSelf: "flex-start", marginTop: 14,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  promo2BtnText: { fontSize: 12, fontFamily: F.bold, color: "#fff" },
  // Bike delivery banner
  bikeBanner: {
    marginHorizontal: 20, marginTop: 24, borderRadius: 20, padding: 20,
    backgroundColor: C.accentLt, overflow: "hidden",
    borderWidth: 1.5, borderColor: "rgba(3,108,51,0.1)",
  },
  delBgCircle1: {
    position: "absolute", width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(3,108,51,0.06)", top: -20, right: -10,
  },
  delBgCircle2: {
    position: "absolute", width: 50, height: 50, borderRadius: 25,
    backgroundColor: "rgba(3,108,51,0.05)", bottom: 10, left: 10,
  },
  delBgCircle3: {
    position: "absolute", width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(3,108,51,0.04)", top: 30, left: 80,
  },
  bikeBannerTitle: { fontSize: 22, fontFamily: F.extraBold, color: C.ink, zIndex: 2 },
  bikeBannerSub: { fontSize: 15, fontFamily: F.regular, color: C.ink3, marginTop: 4, zIndex: 2 },
  bikeTrack: {
    height: 65, marginTop: 14, justifyContent: "flex-end",
  },
  bikeRoad: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: 3, backgroundColor: "rgba(3,108,51,0.15)", borderRadius: 2,
  },
  bikeIconWrap: { position: "absolute", bottom: -2 },
  bikeBox: {
    position: "absolute", top: 4, left: -4,
    width: 18, height: 16, borderRadius: 3,
    backgroundColor: C.accent,
    justifyContent: "center", alignItems: "center",
  },
  bikeHouse: {
    position: "absolute", bottom: 2, right: 10,
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "rgba(3,108,51,0.12)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1.5, borderColor: "rgba(3,108,51,0.15)",
  },
  housePlus: {
    position: "absolute", top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.accent,
    justifyContent: "center", alignItems: "center",
  },
  promo2Badge: {
    backgroundColor: C.accent, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 4,
    alignItems: "center", alignSelf: "center",
  },
  promo2BadgeText: { fontSize: 14, fontFamily: F.extraBold, color: "#fff" },
  promo2Circle: {
    position: "absolute", borderRadius: 999,
    backgroundColor: "rgba(3,108,51,0.06)",
  },
  promo2Circle1: { width: 140, height: 140, top: -40, right: -30 },
  promo2Circle2: { width: 90, height: 90, bottom: -30, left: -20 },

  // Trust
  trustRow: {
    flexDirection: "row", justifyContent: "space-around",
    marginHorizontal: 20, marginTop: 16, paddingVertical: 16,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#F1F5F9",
  },
  trustItem: { alignItems: "center", flex: 1 },
  trustIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#FDF2F4",
    justifyContent: "center", alignItems: "center", marginBottom: 6,
  },
  trustLabel: { fontSize: 12, fontFamily: F.extraBold, color: "#0F172A" },
  trustSub: { fontSize: 12, fontFamily: F.regular, color: "#94A3B8", marginTop: 1 },

  // Section
  secTitle: { fontSize: 17, fontFamily: F.extraBold, color: "#0F172A", paddingHorizontal: 20, marginBottom: 12 },
  secRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, marginTop: 24, marginBottom: 12,
  },
  seeAll: { fontSize: 13, fontFamily: F.bold, color: C.brand },

  // Orders
  orderCard: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 20, marginBottom: 10, borderRadius: 14, padding: 14,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#F1F5F9",
  },
  orderDot: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: "#FDF2F4",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  orderId: { fontSize: 13, fontFamily: F.bold, color: "#0F172A" },
  orderMeta: { fontSize: 12, fontFamily: F.regular, color: "#94A3B8", marginTop: 2 },
  orderAmt: { fontSize: 14, fontFamily: F.extraBold, color: "#0F172A" },
  emptyCard: {
    alignItems: "center", paddingVertical: 28,
    marginHorizontal: 20, borderRadius: 14, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#F1F5F9",
  },
  emptyTitle: { fontSize: 14, fontFamily: F.bold, color: "#334155", marginTop: 8 },
  emptySub: { fontSize: 12, fontFamily: F.regular, color: "#94A3B8", marginTop: 3, marginBottom: 16 },
  uploadBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.brand, borderRadius: 12,
    paddingHorizontal: 22, paddingVertical: 13,
  },
  uploadBtnText: { fontSize: 14, fontFamily: F.bold, color: "#fff" },

  // Articles
  articleCard: {
    width: 170, backgroundColor: "#F8FAFC", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  articleTitle: { fontSize: 13, fontFamily: F.bold, color: "#0F172A", marginTop: 10, lineHeight: 18 },
  articleBot: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  articleTime: { fontSize: 12, fontFamily: F.medium, color: "#94A3B8" },

  // Testimonials
  testiCard: {
    width: width * 0.7, backgroundColor: "#F8FAFC", borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  testiStars: { flexDirection: "row", gap: 2, marginBottom: 8 },
  testiText: { fontSize: 13, fontFamily: F.regular, color: "#334155", lineHeight: 20 },
  testiAuth: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  testiAv: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: C.brand,
    justifyContent: "center", alignItems: "center",
  },
  testiAvT: { fontSize: 12, fontFamily: F.bold, color: "#fff" },
  testiName: { fontSize: 12, fontFamily: F.semiBold, color: "#64748B" },

  // Footer — compact
  footer: {
    alignItems: "center", marginTop: 16, paddingVertical: 16, paddingBottom: 80,
  },
  footerBrand: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerLogo: { width: 28, height: 28, borderRadius: 8 },
  footerName: { fontSize: 15, fontFamily: F.bold, color: C.ink3 },
  footerTagline: { fontSize: 12, fontFamily: F.regular, color: C.ink4, marginTop: 2 },
  footerDivider: { width: 40, height: 1, backgroundColor: "#E2E8F0", marginVertical: 10 },
  footerCopy: { fontSize: 12, fontFamily: F.regular, color: "#CBD5E1" },
});

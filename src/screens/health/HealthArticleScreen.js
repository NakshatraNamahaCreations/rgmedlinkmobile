import { useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, StatusBar, Animated, Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";

const TOP = Platform.OS === "ios" ? 54 : (StatusBar.currentHeight || 24) + 14;

const ARTICLES = {
  morning_habits: {
    emoji: "🧘",
    title: "5 Morning Habits for Better Health",
    author: "Dr. Meera Sharma",
    date: "Mar 2026",
    time: "3 min read",
    color: "#059669",
    heroColor: "#ECFDF5",
    sections: [
      {
        heading: "Why mornings matter",
        body: "How you start your morning sets the tone for your entire day. Research shows that people with consistent morning routines report lower stress, better focus, and improved overall health. Here are five habits backed by science that can transform your daily life.",
      },
      {
        heading: "1. Wake up with water",
        body: "After 7-8 hours of sleep, your body is naturally dehydrated. Drinking a glass of warm water with lemon first thing in the morning kickstarts your metabolism, flushes out toxins, and aids digestion. Studies show that people who hydrate immediately after waking up have 24% higher metabolic rates throughout the day.",
        tip: "Keep a glass of water on your bedside table so it's the first thing you reach for.",
      },
      {
        heading: "2. Move your body for 15 minutes",
        body: "You don't need an hour-long gym session. Just 15 minutes of stretching, yoga, or a brisk walk can increase blood flow, release endorphins, and boost your energy levels. Morning exercise has been linked to better sleep quality and improved mood throughout the day.",
        tip: "Try 5 minutes of stretching, 5 minutes of bodyweight exercises, and 5 minutes of walking.",
      },
      {
        heading: "3. Practice mindful breathing",
        body: "Take 5 minutes to sit quietly and focus on your breath. Deep breathing activates your parasympathetic nervous system, reducing cortisol levels and calming your mind. The 4-7-8 technique — breathe in for 4 seconds, hold for 7, exhale for 8 — is particularly effective for reducing anxiety.",
        tip: "Use a simple breathing app or just set a timer for 5 minutes.",
      },
      {
        heading: "4. Eat a protein-rich breakfast",
        body: "Skipping breakfast leads to energy crashes and overeating later. A breakfast rich in protein — eggs, paneer, sprouts, or a handful of nuts — keeps you full longer and stabilizes blood sugar levels. Studies show that people who eat a nutritious breakfast are 30% less likely to develop type 2 diabetes.",
        tip: "Prepare overnight oats or boiled eggs the night before for a quick healthy breakfast.",
      },
      {
        heading: "5. Avoid screens for the first 30 minutes",
        body: "Checking your phone immediately triggers a reactive mindset — you start responding to others' demands instead of setting your own intentions. Give yourself 30 minutes of screen-free time to journal, plan your day, or simply enjoy your breakfast mindfully. This simple change can significantly reduce morning stress and improve focus.",
        tip: "Charge your phone in another room overnight to avoid the temptation.",
      },
      {
        heading: "Start small, stay consistent",
        body: "You don't have to adopt all five habits at once. Pick one that resonates with you and practice it for a week. Once it feels natural, add another. Small, consistent changes compound into remarkable results over time. Your future self will thank you.",
      },
    ],
  },
  hydration: {
    emoji: "💧",
    title: "Why Hydration Matters More Than You Think",
    author: "Dr. Arun Patel",
    date: "Mar 2026",
    time: "4 min read",
    color: "#2563EB",
    heroColor: "#EFF6FF",
    sections: [
      {
        heading: "The silent health crisis",
        body: "75% of Indians are chronically dehydrated without even knowing it. Water makes up 60% of your body weight and is essential for virtually every bodily function — from regulating temperature to transporting nutrients. Even mild dehydration (just 1-2%) can impair cognitive function, mood, and energy levels.",
      },
      {
        heading: "How much water do you really need?",
        body: "The classic \"8 glasses a day\" rule is a good starting point, but your actual needs depend on your weight, activity level, and climate. A more accurate formula: drink 35ml per kg of your body weight daily. So a 70kg person needs about 2.5 litres per day. In hot Indian summers or if you exercise regularly, increase this by 500ml-1 litre.",
        tip: "A simple check: if your urine is pale yellow, you're well hydrated. Dark yellow means you need more water.",
      },
      {
        heading: "Dehydration and your brain",
        body: "Your brain is 73% water. Studies from the University of Barcelona found that just 2% dehydration leads to a 20% drop in concentration and short-term memory. If you feel that afternoon brain fog, before reaching for caffeine, try drinking two glasses of water and wait 15 minutes. You might be surprised at the difference.",
      },
      {
        heading: "Dehydration and your skin",
        body: "Forget expensive creams — water is your skin's best friend. Dehydrated skin looks dull, shows more wrinkles, and is prone to breakouts. Proper hydration improves skin elasticity, reduces puffiness, and gives you a natural glow. Dermatologists consistently rank hydration as the #1 skincare habit.",
      },
      {
        heading: "Dehydration and your kidneys",
        body: "Your kidneys filter about 180 litres of blood daily, and they need adequate water to function properly. Chronic dehydration is one of the leading causes of kidney stones in India. Drinking sufficient water dilutes the minerals and salts that form stones, reducing your risk by up to 50%.",
        tip: "People prone to kidney stones should aim for at least 3 litres of water daily.",
      },
      {
        heading: "Smart hydration habits",
        body: "• Start your day with 2 glasses of warm water\n• Carry a reusable bottle everywhere\n• Set hourly reminders on your phone\n• Eat water-rich foods: cucumber, watermelon, oranges\n• Drink a glass of water before every meal\n• Replace one sugary drink per day with water\n• Drink coconut water for natural electrolytes",
      },
      {
        heading: "When to drink more",
        body: "Increase your water intake when you're exercising, in hot weather, at high altitudes, if you're unwell (especially with fever, vomiting, or diarrhea), and if you consume caffeine or alcohol. Both caffeine and alcohol are diuretics that cause your body to lose more water than normal.",
      },
    ],
  },
  balanced_diet: {
    emoji: "🥗",
    title: "Balanced Diet: A Simple Guide",
    author: "Nutritionist Priya Rao",
    date: "Feb 2026",
    time: "5 min read",
    color: "#D97706",
    heroColor: "#FFFBEB",
    sections: [
      {
        heading: "What is a balanced diet?",
        body: "A balanced diet provides your body with all the essential nutrients it needs to function correctly. It's not about strict limitations or depriving yourself — it's about feeling great, having more energy, and improving your health. The key is variety, moderation, and consistency.",
      },
      {
        heading: "The ideal plate",
        body: "Imagine your plate divided into sections:\n\n• Half your plate: Vegetables and fruits — rich in vitamins, minerals, and fiber\n• Quarter of your plate: Whole grains — roti, brown rice, oats for sustained energy\n• Quarter of your plate: Protein — dal, paneer, eggs, chicken, fish for muscle repair\n• A small portion: Healthy fats — ghee, nuts, seeds, olive oil for brain function",
      },
      {
        heading: "Essential nutrients you're probably missing",
        body: "Even with a seemingly healthy diet, many Indians are deficient in key nutrients:\n\n• Vitamin D: 76% of Indians are deficient. Get 15 minutes of morning sunlight daily\n• Iron: Especially common in women. Include spinach, jaggery, and dates in your diet\n• Vitamin B12: Critical for vegetarians. Consider fortified foods or supplements\n• Calcium: Beyond milk — try ragi, sesame seeds, and leafy greens\n• Omega-3: Essential for heart health. Found in flaxseeds, walnuts, and fatty fish",
        tip: "Get a blood test done annually to check for deficiencies. RG Medlink can help you order supplements at the best prices.",
      },
      {
        heading: "Indian superfoods you should eat daily",
        body: "India has some of the world's most nutritious foods, and many of them are already in your kitchen:\n\n• Turmeric (Haldi): Anti-inflammatory, antioxidant powerhouse\n• Moringa (Drumstick leaves): Contains 7x more vitamin C than oranges\n• Amla (Indian Gooseberry): One of the richest sources of vitamin C\n• Ragi (Finger Millet): Packed with calcium and iron\n• Makhana (Fox Nuts): Low-calorie, high-protein snack\n• Curd (Dahi): Natural probiotic for gut health",
      },
      {
        heading: "Meal timing matters",
        body: "When you eat is almost as important as what you eat:\n\n• Breakfast (7-9 AM): Your largest meal — your metabolism is highest\n• Lunch (12-1 PM): A balanced, moderate meal\n• Snack (4-5 PM): Light — fruits, nuts, or sprouts\n• Dinner (7-8 PM): Your lightest meal — at least 2 hours before sleep\n\nAvoiding late-night eating gives your digestive system time to rest and improves sleep quality.",
        tip: "Try eating dinner by 7 PM for a week and notice the difference in your sleep and morning energy.",
      },
      {
        heading: "Foods to limit (not eliminate)",
        body: "A balanced diet isn't about banning foods — it's about being mindful:\n\n• Refined sugar: Replace with jaggery, honey, or dates\n• Processed snacks: Swap chips for roasted makhana or nuts\n• Refined flour (maida): Choose whole wheat or multigrain options\n• Excess salt: Use herbs and spices for flavor instead\n• Sugary drinks: Replace with nimbu pani, buttermilk, or herbal tea",
      },
      {
        heading: "Start your journey today",
        body: "You don't need to overhaul your diet overnight. Start with one change this week — maybe adding a serving of vegetables to lunch, or replacing your afternoon chai biscuit with a handful of almonds. Small changes, consistently made, lead to lasting health transformations. Your body is the only place you have to live — invest in it wisely.",
      },
    ],
  },
};

export default function HealthArticleScreen({ route, navigation }) {
  const { articleId } = route.params;
  const article = ARTICLES[articleId];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({ message: `${article.title}\n\nRead on RG Medlink App` });
    } catch {}
  };

  if (!article) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", padding: 32 }}>
        <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
        <Text style={{ fontSize: 17, fontFamily: F.bold, color: C.ink, marginTop: 16, marginBottom: 8 }}>Article not found</Text>
        <Text style={{ fontSize: 13, fontFamily: F.regular, color: C.ink4, textAlign: "center", marginBottom: 24 }}>
          This article is no longer available.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: C.brand, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 }}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 14, fontFamily: F.bold, color: "#fff" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent />

      {/* Sticky header */}
      <Animated.View style={[s.stickyHeader, { opacity: headerOpacity }]}>
        <Text style={s.stickyTitle} numberOfLines={1}>{article.title}</Text>
      </Animated.View>

      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.topBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={C.ink} />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity style={s.topBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={C.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero */}
        <Animated.View style={[s.hero, { backgroundColor: article.heroColor, opacity: fadeAnim }]}>
          <Text style={s.heroEmoji}>{article.emoji}</Text>
          <View style={s.heroTag}>
            <Ionicons name="time-outline" size={12} color={article.color} />
            <Text style={[s.heroTime, { color: article.color }]}>{article.time}</Text>
          </View>
          <Text style={s.heroTitle}>{article.title}</Text>
          <View style={s.heroMeta}>
            <View style={[s.heroAvatar, { backgroundColor: article.color }]}>
              <Text style={s.heroAvatarText}>{article.author[0]}</Text>
            </View>
            <View>
              <Text style={s.heroAuthor}>{article.author}</Text>
              <Text style={s.heroDate}>{article.date}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Content */}
        <Animated.View style={[s.content, { opacity: fadeAnim }]}>
          {article.sections.map((sec, i) => (
            <View key={i} style={s.section}>
              <Text style={s.sectionHeading}>{sec.heading}</Text>
              <Text style={s.sectionBody}>{sec.body}</Text>
              {sec.tip && (
                <View style={s.tipBox}>
                  <View style={s.tipHeader}>
                    <Ionicons name="bulb" size={16} color="#D97706" />
                    <Text style={s.tipLabel}>Pro Tip</Text>
                  </View>
                  <Text style={s.tipText}>{sec.tip}</Text>
                </View>
              )}
            </View>
          ))}

          {/* Bottom CTA */}
          <View style={s.bottomCta}>
            <View style={s.ctaIcon}>
              <Ionicons name="medkit" size={24} color={C.brand} />
            </View>
            <Text style={s.ctaTitle}>Need medicines or supplements?</Text>
            <Text style={s.ctaSub}>Upload your prescription and get delivered to your doorstep</Text>
            <TouchableOpacity
              style={s.ctaBtn}
              activeOpacity={0.85}
              onPress={() => navigation.getParent()?.navigate("OrdersTab", { screen: "UploadPrescription" })}
            >
              <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
              <Text style={s.ctaBtnText}>Upload Prescription</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },

  stickyHeader: {
    position: "absolute", top: 0, left: 0, right: 0,
    paddingTop: TOP, paddingBottom: 12, paddingHorizontal: 60,
    backgroundColor: "#fff", zIndex: 15,
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  stickyTitle: { fontSize: 14, fontFamily: F.bold, color: C.ink, textAlign: "center" },

  topBar: {
    position: "absolute", top: TOP, left: 16, right: 16,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    zIndex: 20,
  },
  topBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },

  // Hero
  hero: {
    paddingTop: TOP + 56, paddingBottom: 28, paddingHorizontal: 24,
  },
  heroEmoji: { fontSize: 48, marginBottom: 16 },
  heroTag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginBottom: 12,
  },
  heroTime: { fontSize: 12, fontFamily: F.semiBold },
  heroTitle: { fontSize: 26, fontFamily: F.extraBold, color: C.ink, lineHeight: 34 },
  heroMeta: {
    flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18,
  },
  heroAvatar: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: "center", alignItems: "center",
  },
  heroAvatarText: { fontSize: 15, fontFamily: F.bold, color: "#fff" },
  heroAuthor: { fontSize: 13, fontFamily: F.bold, color: C.ink },
  heroDate: { fontSize: 11, fontFamily: F.regular, color: C.ink4, marginTop: 1 },

  // Content
  content: { paddingHorizontal: 24, paddingTop: 8 },
  section: { marginTop: 24 },
  sectionHeading: { fontSize: 18, fontFamily: F.bold, color: C.ink, marginBottom: 10 },
  sectionBody: { fontSize: 15, fontFamily: F.regular, color: C.ink2, lineHeight: 24 },

  // Tip box
  tipBox: {
    marginTop: 14, borderRadius: 14, padding: 16,
    backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "rgba(217,119,6,0.15)",
  },
  tipHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  tipLabel: { fontSize: 12, fontFamily: F.bold, color: "#D97706" },
  tipText: { fontSize: 13, fontFamily: F.regular, color: "#92400E", lineHeight: 20 },

  // Bottom CTA
  bottomCta: {
    marginTop: 36, borderRadius: 20, padding: 24,
    backgroundColor: C.brandLt, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(127,14,37,0.1)",
  },
  ctaIcon: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center", marginBottom: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  ctaTitle: { fontSize: 16, fontFamily: F.bold, color: C.ink, textAlign: "center" },
  ctaSub: { fontSize: 13, fontFamily: F.regular, color: C.ink3, textAlign: "center", marginTop: 4, lineHeight: 19 },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.brand, borderRadius: 12,
    paddingHorizontal: 22, paddingVertical: 14, marginTop: 16,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  ctaBtnText: { fontSize: 14, fontFamily: F.bold, color: "#fff" },
});

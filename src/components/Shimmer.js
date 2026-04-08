import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

export default function Shimmer({ width = "100%", height = 16, radius = 8, style }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: "#E2E8F0", opacity },
        style,
      ]}
    />
  );
}

export function ShimmerCard() {
  return (
    <View style={sc.card}>
      <View style={sc.row}>
        <Shimmer width={42} height={42} radius={12} />
        <View style={{ flex: 1, gap: 8, marginLeft: 12 }}>
          <Shimmer width="70%" height={14} />
          <Shimmer width="40%" height={10} />
        </View>
        <Shimmer width={60} height={14} />
      </View>
      <Shimmer width="50%" height={24} radius={12} style={{ marginTop: 10 }} />
    </View>
  );
}

export function ShimmerBanner() {
  return (
    <View style={sc.banner}>
      <View style={{ flex: 1, gap: 10 }}>
        <Shimmer width={80} height={18} radius={6} />
        <Shimmer width="80%" height={16} />
        <Shimmer width="50%" height={12} />
      </View>
      <Shimmer width={80} height={80} radius={40} />
    </View>
  );
}

export function ShimmerServices() {
  return (
    <View style={sc.services}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={{ alignItems: "center", gap: 8 }}>
          <Shimmer width={52} height={52} radius={16} />
          <Shimmer width={48} height={10} />
        </View>
      ))}
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    backgroundColor: "#fff", marginHorizontal: 20, marginBottom: 10,
    borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#F1F5F9",
  },
  row: { flexDirection: "row", alignItems: "center" },
  banner: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#E8F0FE", marginHorizontal: 20, marginTop: 18,
    borderRadius: 18, padding: 20,
  },
  services: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: "#fff", marginHorizontal: 20, borderRadius: 20,
    padding: 20,
  },
});

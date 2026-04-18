import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import API from "../../api";
import { useAuth } from "../../context/AuthContext";
import { C } from "../../theme/colors";
import { F } from "../../theme/fonts";

const CATEGORIES = ["Order Issue", "Payment Issue", "Delivery Issue", "Medicine Query", "Account Issue", "General"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

export default function CreateTicketScreen({ navigation }) {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState("Medium");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!subject.trim()) return Alert.alert("Required", "Please enter a subject");
    if (!description.trim()) return Alert.alert("Required", "Please describe your issue");

    setLoading(true);
    try {
      await API.post("/tickets", {
        userId: user?._id || user?.phone,
        customerName: user?.name || "Customer",
        customerPhone: user?.phone,
        customerEmail: "",
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        orderId: orderId.trim() || undefined,
      });
     const res = await API.post("/tickets", {
  userId: user?._id || user?.phone,
  customerName: user?.name || "Customer",
  customerPhone: user?.phone,
  customerEmail: "",
  subject: subject.trim(),
  description: description.trim(),
  category,
  priority,
  orderId: orderId.trim() || undefined,
});

const ticket = res.data.data;

// Navigate based on messages
if (!ticket.messages || ticket.messages.length === 0) {
  navigation.replace("TicketSuccess", { ticket });
} else {
  navigation.replace("TicketDetail", { ticket });
}
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Subject */}
        <Text style={s.label}>Subject *</Text>
        <TextInput
          style={s.input}
          placeholder="Brief summary of your issue"
          placeholderTextColor={C.ink4}
          value={subject}
          onChangeText={setSubject}
          maxLength={100}
        />

        {/* Category */}
        <Text style={s.label}>Category</Text>
        <View style={s.chipGrid}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[s.chip, category === c && s.chipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[s.chipText, category === c && s.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Priority */}
        <Text style={s.label}>Priority</Text>
        <View style={s.chipGrid}>
          {PRIORITIES.map((p) => {
            const colors = {
              Low: C.green, Medium: C.amber, High: C.orange, Urgent: C.red,
            };
            return (
              <TouchableOpacity
                key={p}
                style={[s.chip, priority === p && { backgroundColor: colors[p] + "18", borderColor: colors[p] }]}
                onPress={() => setPriority(p)}
              >
                <Text style={[s.chipText, priority === p && { color: colors[p], fontWeight: "700" }]}>{p}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Order ID (optional) */}
        <Text style={s.label}>Related Order ID (optional)</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. ORD-1234567890"
          placeholderTextColor={C.ink4}
          value={orderId}
          onChangeText={setOrderId}
        />

        {/* Description */}
        <Text style={s.label}>Description *</Text>
        <TextInput
          style={[s.input, s.textArea]}
          placeholder="Describe your issue in detail..."
          placeholderTextColor={C.ink4}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
          maxLength={1000}
        />
        <Text style={s.charCount}>{description.length}/1000</Text>

        {/* Submit */}
        <TouchableOpacity
          style={[s.btn, loading && { opacity: 0.6 }]}
          onPress={submit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={s.btnText}>{loading ? "Submitting..." : "Submit Ticket"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  label: {
    fontSize: 12, fontFamily: F.extraBold, color: C.ink3, textTransform: "uppercase",
    letterSpacing: 0.5, marginBottom: 8, marginTop: 18,
  },
  input: {
    backgroundColor: C.card, borderRadius: 12, borderWidth: 1.5,
    borderColor: C.border, padding: 14, fontSize: 15, color: C.ink,
  },
  textArea: { height: 120, paddingTop: 14 },
  charCount: { fontSize: 11, color: C.ink4, textAlign: "right", marginTop: 4 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
  },
  chipActive: { backgroundColor: C.brandLt, borderColor: C.brand },
  chipText: { fontSize: 13, fontFamily: F.semiBold, color: C.ink3 },
  chipTextActive: { color: C.brand, fontFamily: F.bold },
  btn: {
    backgroundColor: C.brand, borderRadius: 14, paddingVertical: 16,
    alignItems: "center", marginTop: 28, shadowColor: C.brand,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 8, elevation: 4,
  },
  btnText: { color: C.white, fontSize: 16, fontFamily: F.extraBold },
});

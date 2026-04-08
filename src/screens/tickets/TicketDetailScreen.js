import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import API from "../../api";
import StatusChip from "../../components/StatusChip";
import { C } from "../../theme/colors";

const fDateTime = (d) => d ? new Date(d).toLocaleString("en-IN", {
  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
}) : "—";

export default function TicketDetailScreen({ route }) {
  const { ticket: initialTicket } = route.params;
  const [ticket, setTicket] = useState(initialTicket);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  // Refresh ticket data
  useEffect(() => {
    API.get(`/tickets/${initialTicket._id}`)
      .then((res) => setTicket(res.data.data || initialTicket))
      .catch(() => {});
  }, [initialTicket._id]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await API.post(`/tickets/${ticket._id}/reply`, {
        sender: "Customer",
        message: reply.trim(),
      });
      setTicket(res.data.data);
      setReply("");
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (err) {
      Alert.alert("Error", "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const messages = ticket.messages || [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        style={s.container}
        contentContainerStyle={{ paddingBottom: 20 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {/* Ticket Info Header */}
        <View style={s.header}>
          <Text style={s.ticketId}>{ticket.ticketId}</Text>
          <Text style={s.subject}>{ticket.subject}</Text>
          <View style={s.chipRow}>
            <StatusChip label={ticket.status || "Open"} size="md" />
            <StatusChip label={ticket.priority || "Medium"} size="md" />
            <StatusChip label={ticket.category || "General"} size="md" />
          </View>
        </View>

        {/* Info Grid */}
        <View style={s.infoGrid}>
          {[
            { l: "Created", v: fDateTime(ticket.createdAt) },
            { l: "Order ID", v: ticket.orderId || "—" },
            { l: "Assigned To", v: ticket.assignedTo || "Unassigned" },
          ].map((item, i) => (
            <View key={i} style={s.infoItem}>
              <Text style={s.infoLabel}>{item.l}</Text>
              <Text style={s.infoValue}>{item.v}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        <View style={s.descCard}>
          <Text style={s.descTitle}>Description</Text>
          <Text style={s.descText}>{ticket.description}</Text>
        </View>

        {/* Conversation */}
        <View style={s.convSection}>
          <Text style={s.convTitle}>Conversation ({messages.length})</Text>

          {messages.length === 0 ? (
            <View style={s.emptyConv}>
              <Text style={{ fontSize: 28 }}>💬</Text>
              <Text style={s.emptyText}>No messages yet. Send a message below.</Text>
            </View>
          ) : (
            messages.map((msg, i) => {
              const isCustomer = msg.sender === "Customer";
              return (
                <View key={i} style={[s.bubble, isCustomer ? s.bubbleRight : s.bubbleLeft]}>
                  <Text style={s.sender}>{msg.sender}</Text>
                  <Text style={[s.msgText, isCustomer && { color: C.white }]}>{msg.message}</Text>
                  <Text style={[s.msgTime, isCustomer && { color: "rgba(255,255,255,0.6)" }]}>
                    {fDateTime(msg.timestamp)}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Reply Input — only show if not closed/resolved */}
      {ticket.status !== "Closed" && ticket.status !== "Resolved" && (
        <View style={s.inputBar}>
          <TextInput
            style={s.replyInput}
            placeholder="Type a message..."
            placeholderTextColor={C.ink4}
            value={reply}
            onChangeText={setReply}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[s.sendBtn, !reply.trim() && { opacity: 0.4 }]}
            onPress={sendReply}
            disabled={sending || !reply.trim()}
          >
            <Text style={s.sendText}>{sending ? "..." : "Send"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    backgroundColor: C.brand, padding: 20, paddingTop: 8,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  ticketId: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: "700" },
  subject: { fontSize: 18, fontWeight: "900", color: C.white, marginVertical: 6 },
  chipRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  infoGrid: {
    flexDirection: "row", paddingHorizontal: 16, marginTop: 16, gap: 8,
  },
  infoItem: {
    flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: C.border,
  },
  infoLabel: { fontSize: 10, fontWeight: "700", color: C.ink4, textTransform: "uppercase" },
  infoValue: { fontSize: 13, fontWeight: "700", color: C.ink, marginTop: 4 },
  descCard: {
    backgroundColor: C.card, margin: 16, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.border,
  },
  descTitle: { fontSize: 12, fontWeight: "800", color: C.ink3, textTransform: "uppercase", marginBottom: 8 },
  descText: { fontSize: 14, color: C.ink2, lineHeight: 22 },
  convSection: { paddingHorizontal: 16 },
  convTitle: { fontSize: 14, fontWeight: "800", color: C.ink, marginBottom: 12 },
  emptyConv: { alignItems: "center", paddingVertical: 24 },
  emptyText: { fontSize: 13, color: C.ink4, marginTop: 8 },
  bubble: { maxWidth: "80%", borderRadius: 16, padding: 12, marginBottom: 10 },
  bubbleLeft: {
    backgroundColor: C.card, alignSelf: "flex-start",
    borderTopLeftRadius: 4, borderWidth: 1, borderColor: C.border,
  },
  bubbleRight: {
    backgroundColor: C.brand, alignSelf: "flex-end",
    borderTopRightRadius: 4,
  },
  sender: { fontSize: 10, fontWeight: "700", color: C.ink4, marginBottom: 4 },
  msgText: { fontSize: 14, color: C.ink2, lineHeight: 21 },
  msgTime: { fontSize: 10, color: C.ink4, marginTop: 6, textAlign: "right" },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    backgroundColor: C.card, padding: 12, paddingBottom: Platform.OS === "ios" ? 28 : 12,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  replyInput: {
    flex: 1, backgroundColor: C.surface3, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
    color: C.ink, maxHeight: 100, borderWidth: 1, borderColor: C.border,
  },
  sendBtn: {
    backgroundColor: C.brand, borderRadius: 12, paddingHorizontal: 20,
    paddingVertical: 12, justifyContent: "center",
  },
  sendText: { color: C.white, fontWeight: "800", fontSize: 14 },
});

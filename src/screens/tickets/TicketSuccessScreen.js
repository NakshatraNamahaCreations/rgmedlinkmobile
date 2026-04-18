import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import API from "../../api";

export default function TicketSuccessScreen({ route, navigation }) {
  const { ticket } = route.params;

  // 🔁 Auto check for admin reply
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await API.get(`/tickets/${ticket._id}`);
        const updatedTicket = res.data.data;

        if (updatedTicket.messages?.length > 0) {
          navigation.replace("TicketDetail", { ticket: updatedTicket });
        }
      } catch (err) {}
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
      
      <Text style={{ fontSize:22, fontWeight:"bold" }}>
        🎉 Ticket Submitted
      </Text>

      <Text style={{ marginTop:10 }}>
        Ticket ID: {ticket.ticketId}
      </Text>

      <Text style={{ marginTop:10 }}>
        Waiting for admin response...
      </Text>

      <TouchableOpacity
        onPress={() => navigation.replace("TicketDetail", { ticket })}
        style={{ marginTop:20 }}
      >
        <Text style={{ color:"blue" }}>Open Ticket</Text>
      </TouchableOpacity>

    </View>
  );
}
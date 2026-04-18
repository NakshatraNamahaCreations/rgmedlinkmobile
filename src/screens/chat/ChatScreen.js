import { View, Text, TextInput, TouchableOpacity, FlatList } from "react-native";
import { useState } from "react";

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages(prev => [
      ...prev,
      { text: input, sender: "user", id: Date.now().toString() }
    ]);

    setInput("");
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{
            alignSelf: item.sender === "user" ? "flex-end" : "flex-start",
            backgroundColor: item.sender === "user" ? "#7F0E25" : "#eee",
            padding: 10,
            borderRadius: 10,
            marginVertical: 4
          }}>
            <Text style={{ color: item.sender === "user" ? "#fff" : "#000" }}>
              {item.text}
            </Text>
          </View>
        )}
      />

      <View style={{ flexDirection: "row", marginTop: 10 }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type message..."
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            padding: 10
          }}
        />
        <TouchableOpacity onPress={sendMessage}>
          <Text style={{ padding: 10, color: "#7F0E25" }}>Send</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
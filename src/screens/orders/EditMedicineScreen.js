import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

export default function EditMedicineScreen({ route, navigation }) {
 
const { medicine, onSave } = route.params;
  const [duration, setDuration] = useState(
    medicine.duration ? medicine.duration.toString() : ""
  );
  const [freq, setFreq] = useState(medicine.freqLabel || "1-0-1");

  const handleSave = () => {
    if (!duration) {
      Alert.alert("Validation", "Please enter duration");
      return;
    }

  
  const updatedMedicine = {
    ...medicine,
    id: (medicine.id || medicine._id).toString(),
    duration: Number(duration),
    freqLabel: freq,
  };

  // 🔥 CALL PARENT FUNCTION
  onSave && onSave(updatedMedicine);

  // 🔥 GO BACK
  navigation.goBack();
};



  return (
    <View style={styles.container}>
      <Text style={styles.title}>{medicine.name}</Text>

      <Text style={styles.label}>Frequency (e.g. 1-0-1)</Text>
      <TextInput
        value={freq}
        onChangeText={setFreq}
        style={styles.input}
      />

      <Text style={styles.label}>Duration (days)</Text>
      <TextInput
        value={duration}
        onChangeText={setDuration}
        style={styles.input}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.btn} onPress={handleSave}>
        <Text style={styles.btnText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  label: { marginTop: 10, fontSize: 14, color: "#444" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginTop: 6,
    borderRadius: 8,
  },
  btn: {
    backgroundColor: "#7C0A02",
    padding: 15,
    alignItems: "center",
    borderRadius: 10,
    marginTop: 30,
  },
  btnText: { color: "#fff", fontWeight: "bold" },
});
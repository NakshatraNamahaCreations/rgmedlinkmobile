import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";


export default function PatientListScreen({ navigation }) {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  // ============================
  // FETCH PATIENTS
  // ============================
  const fetchPatients = async () => {
    try {
      setLoading(true);

      const res = await API.get(
        `/patient-details?userId=${user.phone}`
      );

      setPatients(res.data.data || []);

      // auto select default
      const defaultPatient = res.data.data?.find(p => p.isDefault);
      if (defaultPatient) setSelected(defaultPatient._id);

    } catch (err) {
      console.log("FETCH ERROR:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

useFocusEffect(
  useCallback(() => {
    fetchPatients();
  }, [])
);
  // ============================
  // DELETE PATIENT
  // ============================
const deletePatient = (id) => {
  Alert.alert("Delete Patient", "Are you sure you want to delete?", [
    { text: "Cancel" },
    {
      text: "Delete",
      style: "destructive",
      onPress: async () => {
        try {
          await API.delete(`/patient-details/${id}`);
          fetchPatients();
        } catch (err) {
          Alert.alert("Error", "Delete failed");
        }
      }
    }
  ]);
};

  // ============================
  // EDIT PATIENT
  // ============================
  const editPatient = (patient) => {
    navigation.navigate("PatientDetails", {
      isEdit: true,
      patientData: patient,
      from: "profile" 
    });
  };

  // ============================
  // RENDER ITEM
  // ============================
  const renderItem = ({ item }) => {
    const isSelected = selected === item._id;

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.selected]}
        onPress={() => setSelected(item._id)}
        activeOpacity={0.9}
      >
        {/* Top Row */}
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name?.[0]?.toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{item.name}</Text>

              {item.isDefault && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Default</Text>
                </View>
              )}
            </View>

            <Text style={styles.sub}>
              {item.age || "-"} yrs • {item.gender || "N/A"}
            </Text>

            <Text style={styles.phone}>
              📞 {item.primaryPhone}
            </Text>
          </View>

          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="#16A34A"
            />
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => editPatient(item)}>
            <Text style={styles.edit}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => deletePatient(item._id)}>
            <Text style={styles.delete}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ============================
  // EMPTY STATE
  // ============================
  const EmptyComponent = () => (
    <View style={styles.empty}>
      <Ionicons name="people-outline" size={60} color="#ccc" />
      <Text style={styles.emptyText}>No patients added yet</Text>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* ADD BUTTON */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate("PatientDetails")}
      >
        <Ionicons name="add-circle-outline" size={20} color="#B91C1C" />
        <Text style={styles.addText}> Add New Patient</Text>
      </TouchableOpacity>

      {/* LIST */}
      {loading ? (
        <ActivityIndicator size="large" color="#B91C1C" />
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={EmptyComponent}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F9FAFB"
  },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#B91C1C",
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#FFF5F5"
  },

  addText: {
    color: "#B91C1C",
    fontWeight: "600",
    fontSize: 14
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 2
  },

  selected: {
    borderColor: "#16A34A",
    borderWidth: 2
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#7C2D12",
    alignItems: "center",
    justifyContent: "center"
  },

  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },

  name: {
    fontSize: 16,
    fontWeight: "600"
  },

  badge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },

  badgeText: {
    fontSize: 10,
    color: "#16A34A",
    fontWeight: "600"
  },

  sub: {
    fontSize: 12,
    color: "#666",
    marginTop: 2
  },

  phone: {
    fontSize: 12,
    color: "#444",
    marginTop: 2
  },

  actions: {
    flexDirection: "row",
    marginTop: 12
  },

  edit: {
    color: "#2563EB",
    fontWeight: "600",
    marginRight: 20
  },

  delete: {
    color: "#DC2626",
    fontWeight: "600"
  },

  empty: {
    alignItems: "center",
    marginTop: 50
  },

  emptyText: {
    marginTop: 10,
    color: "#888"
  }
});
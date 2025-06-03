import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../hooks/useTheme";
import { StorageService } from "../services/storage";
import { RootStackParamList } from "../types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function StudyScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);

  // Simple spaced review: cards with lowest level or not reviewed recently
  const getCardsDueForReview = async () => {
    setLoading(true);
    try {
      const storage = StorageService.getInstance();
      const allCards = await storage.getAllCards();
      // Example spaced review: cards with level < 5, sorted by last reviewed (or random if not available)
      const dueCards = allCards
        .filter((card) => (card.level ?? 0) < 5)
        .sort((a, b) => {
          const aTime = a.lastReviewed ? new Date(a.lastReviewed).getTime() : 0;
          const bTime = b.lastReviewed ? new Date(b.lastReviewed).getTime() : 0;
          return aTime - bTime;
        })
        .slice(0, 20); // Limit to 20 cards per session
      if (dueCards.length === 0) {
        Alert.alert("No cards due", "You have no cards due for review!");
        setLoading(false);
        return;
      }
      navigation.navigate("StudySession", { cards: dueCards });
    } catch (error) {
      Alert.alert("Error", "Failed to load cards for review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text
        style={[styles.text, { color: theme.colors.text, marginBottom: 32 }]}
      >
        Smart Review
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={getCardsDueForReview}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Start Review</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 22,
    fontWeight: "bold",
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});

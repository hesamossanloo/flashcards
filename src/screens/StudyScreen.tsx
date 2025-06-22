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

  const startRandomizedStudy = async () => {
    setLoading(true);
    try {
      const storage = StorageService.getInstance();
      const allCards = await storage.getAllCards();
      if (allCards.length === 0) {
        Alert.alert("No cards", "You have no cards to study!");
        setLoading(false);
        return;
      }
      // Shuffle cards
      const shuffled = allCards.sort(() => Math.random() - 0.5);
      navigation.navigate("StudySession", { cards: shuffled });
    } catch (error) {
      Alert.alert("Error", "Failed to load cards.");
    } finally {
      setLoading(false);
    }
  };

  const startNeverReviewedStudy = async () => {
    setLoading(true);
    try {
      const storage = StorageService.getInstance();
      const allCards = await storage.getAllCards();
      const neverReviewed = allCards.filter(
        (card) =>
          (!card.lastReviewed || card.lastReviewed === undefined) &&
          (card.correctCount === 0 || card.correctCount === undefined) &&
          (card.incorrectCount === 0 || card.incorrectCount === undefined)
      );
      if (neverReviewed.length === 0) {
        Alert.alert(
          "No new cards",
          "All cards have been reviewed at least once!"
        );
        setLoading(false);
        return;
      }
      // Shuffle never reviewed cards
      const shuffled = neverReviewed.sort(() => Math.random() - 0.5);
      navigation.navigate("StudySession", { cards: shuffled });
    } catch (error) {
      Alert.alert("Error", "Failed to load cards.");
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
        Study Options
      </Text>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: theme.colors.primary, marginBottom: 20 },
        ]}
        onPress={startRandomizedStudy}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Randomized Study</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.secondary }]}
        onPress={startNeverReviewedStudy}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Study Never Reviewed Cards</Text>
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

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import { ProgressBar, Surface, Text } from "react-native-paper";
import { theme } from "../assets/themes/theme";
import { Deck } from "../types/index";

interface DeckCardProps {
  deck: Deck;
  onPress: () => void;
  onLongPress?: () => void;
  sharpLeft?: boolean;
  reviewedCards: number;
}

const { width } = Dimensions.get("window");
const cardWidth = width - theme.spacing.lg * 2;

export default function DeckCard({
  deck,
  onPress,
  onLongPress,
  sharpLeft = false,
  reviewedCards,
}: DeckCardProps) {
  // Progress: percentage of cards reviewed
  const progress = deck.totalCards > 0 ? reviewedCards / deck.totalCards : 0;

  // Gradient color logic
  const getDeckGradient = (): [string, string] => {
    if (deck.totalCards === 0)
      return [theme.colors.primary, theme.colors.secondary];
    if (progress === 0) return ["#a78bfa", "#7c3aed"]; // purple gradient
    if (progress > 0 && progress < 1) return ["#fb923c", "#f59e42"]; // orange gradient
    if (progress === 1) return [theme.colors.success, "#059669"]; // green gradient
    return [theme.colors.primary, theme.colors.secondary];
  };

  // Use a single neutral icon
  const getDeckIcon = () => {
    if (deck.totalCards === 0) return "cards-outline";
    return "book-open-variant";
  };

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress}>
      <Surface
        style={[styles.card, sharpLeft && styles.cardSharpLeft]}
        elevation={2}
      >
        <LinearGradient
          colors={getDeckGradient()}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={getDeckIcon()}
                  size={24}
                  color="#ffffff"
                />
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>
                  {deck.name}
                </Text>
                <Text style={styles.subtitle}>{deck.totalCards} cards</Text>
              </View>
            </View>

            {/* Progress Section */}
            {deck.totalCards > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={styles.progressPercentage}>
                    {Math.round(progress * 100)}%
                  </Text>
                </View>
                <ProgressBar
                  progress={progress}
                  color="#ffffff"
                  style={styles.progressBar}
                />
              </View>
            )}

            {/* Empty State */}
            {deck.totalCards === 0 && (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="plus-circle-outline"
                  size={32}
                  color="rgba(255,255,255,0.7)"
                />
                <Text style={styles.emptyStateText}>Add your first card</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    borderRadius: theme.roundness,
    overflow: "hidden",
    ...theme.shadows.medium,
  },
  cardSharpLeft: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  gradient: {
    padding: theme.spacing.lg,
  },
  cardContent: {
    position: "relative",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...theme.typography.h3,
    color: "#ffffff",
    marginBottom: theme.spacing.xs,
    fontWeight: "bold",
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: "rgba(255,255,255,0.8)",
  },
  progressSection: {
    marginBottom: theme.spacing.md,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  progressLabel: {
    ...theme.typography.bodySmall,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  progressPercentage: {
    ...theme.typography.bodySmall,
    color: "#ffffff",
    fontWeight: "bold",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginBottom: theme.spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
  },
  emptyStateText: {
    ...theme.typography.bodySmall,
    color: "rgba(255,255,255,0.8)",
    marginTop: theme.spacing.sm,
  },
});

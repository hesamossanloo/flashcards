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
}

const { width } = Dimensions.get("window");
const cardWidth = width - theme.spacing.lg * 2;

export default function DeckCard({
  deck,
  onPress,
  onLongPress,
  sharpLeft = false,
}: DeckCardProps) {
  const progress =
    deck.totalCards > 0 ? deck.masteredCards / deck.totalCards : 0;
  const learningProgress =
    deck.totalCards > 0 ? deck.learningCards / deck.totalCards : 0;

  const getProgressColor = () => {
    if (progress >= 0.8) return theme.colors.success;
    if (progress >= 0.5) return theme.colors.warning;
    return theme.colors.primary;
  };

  const getDeckIcon = () => {
    if (deck.totalCards === 0) return "cards-outline";
    if (progress >= 0.8) return "trophy-outline";
    if (progress >= 0.5) return "star-outline";
    return "book-open-variant";
  };

  const getDeckGradient = (): [string, string] => {
    if (deck.totalCards === 0)
      return [theme.colors.surfaceVariant, theme.colors.surfaceVariant];
    if (progress >= 0.8) return [theme.colors.success, "#059669"];
    if (progress >= 0.5) return [theme.colors.warning, "#d97706"];
    return [theme.colors.primary, theme.colors.secondary];
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
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                  {deck.masteredCards} mastered
                </Text>
                <Text style={styles.statsText}>
                  {deck.learningCards} learning
                </Text>
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
                <View style={styles.progressDetails}>
                  <View style={styles.progressItem}>
                    <View
                      style={[
                        styles.progressDot,
                        { backgroundColor: theme.colors.success },
                      ]}
                    />
                    <Text style={styles.progressText}>Mastered</Text>
                  </View>
                  <View style={styles.progressItem}>
                    <View
                      style={[
                        styles.progressDot,
                        { backgroundColor: theme.colors.warning },
                      ]}
                    />
                    <Text style={styles.progressText}>Learning</Text>
                  </View>
                  <View style={styles.progressItem}>
                    <View
                      style={[
                        styles.progressDot,
                        { backgroundColor: theme.colors.surfaceVariant },
                      ]}
                    />
                    <Text style={styles.progressText}>New</Text>
                  </View>
                </View>
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
  statsContainer: {
    alignItems: "flex-end",
  },
  statsText: {
    ...theme.typography.caption,
    color: "rgba(255,255,255,0.8)",
    marginBottom: theme.spacing.xs,
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
  progressDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  progressText: {
    ...theme.typography.caption,
    color: "rgba(255,255,255,0.8)",
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

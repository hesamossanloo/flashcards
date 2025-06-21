import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { CompositeNavigationProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Surface, Text } from "react-native-paper";
import { theme } from "../assets/themes/theme";
import { MainTabParamList, RootStackParamList } from "../types";

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Decks">,
  NativeStackNavigationProp<RootStackParamList>
>;

const { width } = Dimensions.get("window");

export default function HomeScreen({
  navigation,
}: {
  navigation: NavigationProp;
}) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.heroSection}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroIconContainer}>
            <MaterialCommunityIcons
              name="cards-outline"
              size={48}
              color="#ffffff"
            />
          </View>
          <Text style={styles.heroTitle}>Welcome to Flashcards</Text>
          <Text style={styles.heroSubtitle}>
            Master any subject with spaced repetition
          </Text>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <Card
            style={styles.actionCard}
            onPress={() => navigation.navigate("CreateDeck")}
          >
            <Card.Content style={styles.actionCardContent}>
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <MaterialCommunityIcons name="plus" size={24} color="#ffffff" />
              </View>
              <Text style={styles.actionTitle}>Create Deck</Text>
              <Text style={styles.actionDescription}>
                Start a new study set
              </Text>
            </Card.Content>
          </Card>

          <Card
            style={styles.actionCard}
            onPress={() => navigation.navigate("Decks")}
          >
            <Card.Content style={styles.actionCardContent}>
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: theme.colors.secondary },
                ]}
              >
                <MaterialCommunityIcons
                  name="book-open-variant"
                  size={24}
                  color="#ffffff"
                />
              </View>
              <Text style={styles.actionTitle}>Study Now</Text>
              <Text style={styles.actionDescription}>Review your decks</Text>
            </Card.Content>
          </Card>

          <Card
            style={styles.actionCard}
            onPress={() => navigation.navigate("Stats")}
          >
            <Card.Content style={styles.actionCardContent}>
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: theme.colors.tertiary },
                ]}
              >
                <MaterialCommunityIcons
                  name="chart-line"
                  size={24}
                  color="#ffffff"
                />
              </View>
              <Text style={styles.actionTitle}>Progress</Text>
              <Text style={styles.actionDescription}>View your stats</Text>
            </Card.Content>
          </Card>

          <Card
            style={styles.actionCard}
            onPress={() => navigation.navigate("Settings")}
          >
            <Card.Content style={styles.actionCardContent}>
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: theme.colors.info },
                ]}
              >
                <MaterialCommunityIcons name="cog" size={24} color="#ffffff" />
              </View>
              <Text style={styles.actionTitle}>Settings</Text>
              <Text style={styles.actionDescription}>Customize your app</Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Study Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Study Tips</Text>
        <Surface style={styles.tipsCard} elevation={1}>
          <View style={styles.tipItem}>
            <MaterialCommunityIcons
              name="lightbulb-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.tipText}>
              Study in short, focused sessions for better retention
            </Text>
          </View>
          <View style={styles.tipItem}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={20}
              color={theme.colors.secondary}
            />
            <Text style={styles.tipText}>
              Review cards regularly using spaced repetition
            </Text>
          </View>
          <View style={styles.tipItem}>
            <MaterialCommunityIcons
              name="target"
              size={20}
              color={theme.colors.tertiary}
            />
            <Text style={styles.tipText}>
              Focus on difficult cards more frequently
            </Text>
          </View>
        </Surface>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Ready to start learning? Create your first deck!
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate("CreateDeck")}
          style={styles.ctaButton}
          contentStyle={styles.ctaButtonContent}
          labelStyle={styles.ctaButtonLabel}
        >
          Get Started
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  heroSection: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  heroContent: {
    alignItems: "center",
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
  },
  heroTitle: {
    ...theme.typography.h1,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: {
    ...theme.typography.body,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: (width - theme.spacing.lg * 3) / 2,
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness,
    ...theme.shadows.medium,
  },
  actionCardContent: {
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  actionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  actionDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  tipsCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: theme.spacing.md,
  },
  tipText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    flex: 1,
    marginLeft: theme.spacing.sm,
    lineHeight: 20,
  },
  footer: {
    padding: theme.spacing.xl,
    alignItems: "center",
    marginTop: theme.spacing.lg,
  },
  footerText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  ctaButton: {
    borderRadius: theme.roundness,
    ...theme.shadows.medium,
  },
  ctaButtonContent: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  ctaButtonLabel: {
    ...theme.typography.h3,
    color: "#ffffff",
  },
});

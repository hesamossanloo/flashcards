import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../hooks/useTheme";
import { StorageService } from "../services/storage";
import { Deck, RootStackParamList, StudySession } from "../types";

interface SessionStats {
  totalCards: number;
  correctCards: number;
  accuracy: number;
  totalTime: number;
  averageTimePerCard: number;
}

type StatsScreenRouteProp = RouteProp<RootStackParamList, "Stats">;

// This is the screen shown after completing a study session
export const SessionStatsScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<StatsScreenRouteProp>();
  const stats: SessionStats = route.params?.stats;

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="trophy-outline"
            size={64}
            color={theme.colors.primary}
          />
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Session Complete!
          </Text>
        </View>

        <View
          style={[
            styles.statsContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          {/* Total Cards */}
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="cards"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {stats.totalCards}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Cards Reviewed
            </Text>
          </View>

          {/* Accuracy */}
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="target"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {Math.round(stats.accuracy)}%
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Accuracy
            </Text>
          </View>

          {/* Time */}
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatTime(stats.totalTime)}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Total Time
            </Text>
          </View>
        </View>

        {/* Detailed Stats */}
        <View
          style={[
            styles.detailedStats,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.detailedStatRow}>
            <Text
              style={[
                styles.detailedStatLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Correct Answers
            </Text>
            <Text
              style={[
                styles.detailedStatValue,
                { color: theme.colors.success },
              ]}
            >
              {stats.correctCards}
            </Text>
          </View>

          <View style={styles.detailedStatRow}>
            <Text
              style={[
                styles.detailedStatLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Incorrect Answers
            </Text>
            <Text
              style={[styles.detailedStatValue, { color: theme.colors.error }]}
            >
              {stats.totalCards - stats.correctCards}
            </Text>
          </View>

          <View style={styles.detailedStatRow}>
            <Text
              style={[
                styles.detailedStatLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Average Time per Card
            </Text>
            <Text
              style={[styles.detailedStatValue, { color: theme.colors.text }]}
            >
              {formatTime(stats.averageTimePerCard)}
            </Text>
          </View>
        </View>

        <Text
          style={[styles.encouragement, { color: theme.colors.textSecondary }]}
        >
          {stats.accuracy >= 80
            ? "Great job! You're mastering these cards! 🎉"
            : stats.accuracy >= 60
            ? "Good progress! Keep practicing to improve! 💪"
            : "Don't give up! Regular practice leads to mastery! 📚"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// This is the screen shown in the main tab navigation
const StatsScreen: React.FC = () => {
  const theme = useTheme();
  const storage = StorageService.getInstance();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCards: 0,
    masteredCards: 0,
    learningCards: 0,
    totalAccuracy: 0,
    totalStudyTime: 0,
    recentSessions: [] as StudySession[],
    decks: [] as Deck[],
    streak: {
      current: 0,
      best: 0,
      totalDays: 0,
    },
  });

  // Reset stats to initial values
  const resetStats = () => {
    setStats({
      totalCards: 0,
      masteredCards: 0,
      learningCards: 0,
      totalAccuracy: 0,
      totalStudyTime: 0,
      recentSessions: [],
      decks: [],
      streak: {
        current: 0,
        best: 0,
        totalDays: 0,
      },
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadStatsData = async () => {
      try {
        setIsLoading(true);
        resetStats(); // Reset stats before loading new data

        const [allCards, allSessions, allDecks] = await Promise.all([
          storage.getAllCards(),
          storage.getAllSessions(),
          storage.getAllDecks(),
        ]);

        if (!isMounted) return;

        // Calculate overall stats
        const masteredCards = allCards.filter((card) => card.level >= 5).length;
        const learningCards = allCards.filter(
          (card) => card.level > 0 && card.level < 5
        ).length;

        // Calculate total accuracy
        const totalCorrect = allSessions.reduce(
          (sum, session) =>
            sum +
            session.cardsReviewed.filter(
              (review) => review.result === "correct"
            ).length,
          0
        );
        const totalReviewed = allSessions.reduce(
          (sum, session) => sum + session.cardsReviewed.length,
          0
        );
        const totalAccuracy =
          totalReviewed > 0 ? (totalCorrect / totalReviewed) * 100 : 0;

        // Calculate total study time
        const totalStudyTime = allSessions.reduce((sum, session) => {
          if (!session.endTime) return sum;
          return (
            sum + (session.endTime.getTime() - session.startTime.getTime())
          );
        }, 0);

        // Get recent sessions (last 5)
        const recentSessions = allSessions
          .filter((session) => session.endTime)
          .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
          .slice(0, 5);

        // Calculate streak
        const streak = calculateStreak(allSessions);

        if (isMounted) {
          setStats({
            totalCards: allCards.length,
            masteredCards,
            learningCards,
            totalAccuracy,
            totalStudyTime,
            recentSessions,
            decks: allDecks,
            streak,
          });
        }
      } catch (error) {
        console.error("Failed to load stats:", error);
        if (isMounted) {
          resetStats(); // Reset stats on error
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStatsData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array since we only want to load on mount

  const calculateStreak = (sessions: StudySession[]) => {
    if (sessions.length === 0) return { current: 0, best: 0, totalDays: 0 };

    const studyDays = new Set(
      sessions
        .filter((session) => session.endTime)
        .map((session) => session.startTime.toDateString())
    );

    const days = Array.from(studyDays).sort();
    let currentStreak = 1;
    let bestStreak = 1;
    let currentStreakCount = 1;

    for (let i = 1; i < days.length; i++) {
      const prevDate = new Date(days[i - 1]);
      const currDate = new Date(days[i]);
      const dayDiff = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        currentStreakCount++;
        bestStreak = Math.max(bestStreak, currentStreakCount);
      } else {
        currentStreakCount = 1;
      }
    }

    // Check if the last study day was today or yesterday
    const lastStudyDay = new Date(days[days.length - 1]);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    currentStreak =
      lastStudyDay.toDateString() === today.toDateString() ||
      lastStudyDay.toDateString() === yesterday.toDateString()
        ? currentStreakCount
        : 0;

    return {
      current: currentStreak,
      best: bestStreak,
      totalDays: days.length,
    };
  };

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading stats...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Overall Progress */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Overall Progress
          </Text>
          <View
            style={[
              styles.statsContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="cards"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {stats.totalCards}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Total Cards
              </Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="star"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {stats.masteredCards}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Mastered
              </Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="target"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {Math.round(stats.totalAccuracy)}%
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Accuracy
              </Text>
            </View>
          </View>
        </View>

        {/* Study Streak */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Study Streak
          </Text>
          <View
            style={[
              styles.statsContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="fire"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {stats.streak.current}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Current Streak
              </Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="trophy"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {stats.streak.best}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Best Streak
              </Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="calendar-check"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {stats.streak.totalDays}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Days Studied
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Recent Activity
          </Text>
          {stats.recentSessions.map((session, index) => {
            const correctCount = session.cardsReviewed.filter(
              (review) => review.result === "correct"
            ).length;
            const accuracy =
              session.cardsReviewed.length > 0
                ? (correctCount / session.cardsReviewed.length) * 100
                : 0;
            const timeSpent = session.endTime
              ? session.endTime.getTime() - session.startTime.getTime()
              : 0;

            return (
              <View
                key={session.id}
                style={[
                  styles.sessionItem,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <View style={styles.sessionHeader}>
                  <Text
                    style={[styles.sessionDate, { color: theme.colors.text }]}
                  >
                    {formatDate(session.startTime)}
                  </Text>
                  <Text
                    style={[
                      styles.sessionAccuracy,
                      { color: theme.colors.text },
                    ]}
                  >
                    {Math.round(accuracy)}% accuracy
                  </Text>
                </View>
                <View style={styles.sessionDetails}>
                  <Text
                    style={[
                      styles.sessionCards,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {session.cardsReviewed.length} cards reviewed
                  </Text>
                  <Text
                    style={[
                      styles.sessionTime,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {formatTime(timeSpent)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Deck Performance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Deck Performance
          </Text>
          {stats.decks.map((deck) => (
            <View
              key={deck.id}
              style={[
                styles.deckItem,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Text style={[styles.deckName, { color: theme.colors.text }]}>
                {deck.name}
              </Text>
              <View style={styles.deckStats}>
                <Text
                  style={[
                    styles.deckStat,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {deck.totalCards} cards
                </Text>
                <Text
                  style={[
                    styles.deckStat,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {deck.masteredCards} mastered
                </Text>
                <Text
                  style={[
                    styles.deckStat,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {deck.learningCards} learning
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      {/* Reset Stats Button */}
      <View style={{ padding: 16 }}>
        <TouchableOpacity
          style={[
            {
              backgroundColor: theme.colors.error,
              padding: 16,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
          onPress={() => {
            Alert.alert(
              "Reset Stats",
              "Are you sure you want to reset all stats? This will remove all study history but keep your decks and cards. This cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Reset",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await storage.clearAllSessions();
                      // Reload stats
                      setIsLoading(true);
                      const [allCards, allSessions, allDecks] =
                        await Promise.all([
                          storage.getAllCards(),
                          storage.getAllSessions(),
                          storage.getAllDecks(),
                        ]);
                      // Calculate overall stats (same as in loadStatsData)
                      const masteredCards = allCards.filter(
                        (card) => card.level >= 5
                      ).length;
                      const learningCards = allCards.filter(
                        (card) => card.level > 0 && card.level < 5
                      ).length;
                      const totalCorrect = allSessions.reduce(
                        (sum, session) =>
                          sum +
                          session.cardsReviewed.filter(
                            (review) => review.result === "correct"
                          ).length,
                        0
                      );
                      const totalReviewed = allSessions.reduce(
                        (sum, session) => sum + session.cardsReviewed.length,
                        0
                      );
                      const totalAccuracy =
                        totalReviewed > 0
                          ? (totalCorrect / totalReviewed) * 100
                          : 0;
                      const totalStudyTime = allSessions.reduce(
                        (sum, session) => {
                          if (!session.endTime) return sum;
                          return (
                            sum +
                            (session.endTime.getTime() -
                              session.startTime.getTime())
                          );
                        },
                        0
                      );
                      const recentSessions = allSessions
                        .filter((session) => session.endTime)
                        .sort(
                          (a, b) =>
                            b.startTime.getTime() - a.startTime.getTime()
                        )
                        .slice(0, 5);
                      const streak = calculateStreak(allSessions);
                      setStats({
                        totalCards: allCards.length,
                        masteredCards,
                        learningCards,
                        totalAccuracy,
                        totalStudyTime,
                        recentSessions,
                        decks: allDecks,
                        streak,
                      });
                      setIsLoading(false);
                      // Show confirmation
                      Alert.alert(
                        "Stats Reset",
                        "All stats have been reset. Your decks and cards are safe."
                      );
                    } catch (error) {
                      Alert.alert(
                        "Error",
                        "Failed to reset stats. Please try again."
                      );
                    }
                  },
                },
              ]
            );
          }}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={20}
            color="white"
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            Reset Stats
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
  },
  detailedStats: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailedStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  detailedStatLabel: {
    fontSize: 14,
  },
  detailedStatValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  encouragement: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  sessionItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: "600",
  },
  sessionAccuracy: {
    fontSize: 14,
    fontWeight: "600",
  },
  sessionDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sessionCards: {
    fontSize: 14,
  },
  sessionTime: {
    fontSize: 14,
  },
  deckItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  deckName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  deckStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  deckStat: {
    fontSize: 14,
  },
});

export default StatsScreen;

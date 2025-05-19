import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface SessionStats {
  totalCards: number;
  correctCards: number;
  accuracy: number;
  totalTime: number;
  averageTimePerCard: number;
}

const StatsScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute();
  const stats: SessionStats = route.params?.stats;

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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

        <View style={[styles.statsContainer, { backgroundColor: theme.colors.surface }]}>
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
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
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
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
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
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Total Time
            </Text>
          </View>
        </View>

        {/* Detailed Stats */}
        <View style={[styles.detailedStats, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.detailedStatRow}>
            <Text style={[styles.detailedStatLabel, { color: theme.colors.textSecondary }]}>
              Correct Answers
            </Text>
            <Text style={[styles.detailedStatValue, { color: theme.colors.success }]}>
              {stats.correctCards}
            </Text>
          </View>

          <View style={styles.detailedStatRow}>
            <Text style={[styles.detailedStatLabel, { color: theme.colors.textSecondary }]}>
              Incorrect Answers
            </Text>
            <Text style={[styles.detailedStatValue, { color: theme.colors.error }]}>
              {stats.totalCards - stats.correctCards}
            </Text>
          </View>

          <View style={styles.detailedStatRow}>
            <Text style={[styles.detailedStatLabel, { color: theme.colors.textSecondary }]}>
              Average Time per Card
            </Text>
            <Text style={[styles.detailedStatValue, { color: theme.colors.text }]}>
              {formatTime(stats.averageTimePerCard)}
            </Text>
          </View>
        </View>

        <Text style={[styles.encouragement, { color: theme.colors.textSecondary }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailedStatLabel: {
    fontSize: 14,
  },
  detailedStatValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  encouragement: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default StatsScreen; 
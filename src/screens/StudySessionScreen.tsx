import { MaterialCommunityIcons } from "@expo/vector-icons";
// @ts-ignore
import { useNavigation, useRoute } from "@react-navigation/native";
// @ts-ignore
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SwipeableCard } from "../components/SwipeableCard";
import { useTheme } from "../hooks/useTheme";
import { StorageService } from "../services/storage";
import { Card, RootStackParamList, StudyResult, StudySession } from "../types";

// Route params type
type StudySessionRouteParams = {
  deckId: string;
};

// Simple UUID generator for React Native
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const StudySessionScreen: React.FC = () => {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const storage = StorageService.getInstance();
  const { deckId } = route.params as StudySessionRouteParams;

  // State
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Using ref to avoid closure issues in async operations
  // The ref always holds the latest value, while state is used for rendering
  const currentIndexRef = useRef(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);
  const [session, setSession] = useState<StudySession>({
    id: generateUUID(),
    deckId,
    startTime: new Date(),
    cardsReviewed: [],
  });

  // Update ref when currentIndex changes
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Load cards
  useEffect(() => {
    if (route.params && Array.isArray((route.params as any).cards)) {
      setCards((route.params as any).cards);
    } else {
      const loadCards = async () => {
        const allCards = await storage.getAllCards();
        const deckCards = allCards.filter((card) => card.deckId === deckId);
        setCards(deckCards);
      };
      loadCards();
    }
  }, [deckId, storage, route.params]);

  // Flip card
  const flipCard = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  // Handle card result
  const handleCardResult = useCallback(
    async (card: Card, result: StudyResult) => {
      const now = new Date();
      const timeSpent = now.getTime() - session.startTime.getTime();

      // Create new reviewed card entry
      const newReviewedCard = {
        cardId: card.id,
        result,
        timeSpent,
      };

      // Update session state using functional update
      setSession((prevSession) => {
        const updatedSession = {
          ...prevSession,
          cardsReviewed: [...prevSession.cardsReviewed, newReviewedCard],
          // Add end time if this is the last card
          ...(currentIndexRef.current + 1 >= cards.length
            ? { endTime: now }
            : {}),
        };

        console.log("Detailed session state:", {
          sessionId: updatedSession.id,
          totalCards: cards.length,
          currentIndex: currentIndexRef.current,
          cardsReviewed: updatedSession.cardsReviewed.map((r) => ({
            cardId: r.cardId,
            result: r.result,
            timeSpent: r.timeSpent,
          })),
          correctCount: updatedSession.cardsReviewed.filter(
            (r) => r.result === StudyResult.Correct
          ).length,
          incorrectCount: updatedSession.cardsReviewed.filter(
            (r) => r.result === StudyResult.Incorrect
          ).length,
          isLastCard: currentIndexRef.current + 1 >= cards.length,
        });

        // Save session update
        storage.saveSession(updatedSession).catch((error) => {
          console.error("Failed to save session:", error);
        });

        return updatedSession;
      });

      try {
        // Update card stats
        const updatedCard = {
          ...card,
          lastReviewed: now,
          correctCount:
            result === StudyResult.Correct
              ? (card.correctCount || 0) + 1
              : card.correctCount || 0,
          incorrectCount:
            result === StudyResult.Incorrect
              ? (card.incorrectCount || 0) + 1
              : card.incorrectCount || 0,
        };
        await storage.saveCard(updatedCard);
        setCards((prevCards) =>
          prevCards.map((c) => (c.id === updatedCard.id ? updatedCard : c))
        );

        // Check if this was the last card
        if (currentIndexRef.current + 1 >= cards.length) {
          console.log("Last card completed, calculating final stats");

          // Get the latest session state for stats calculation
          const latestSession = await storage
            .getAllSessions()
            .then((sessions) => sessions.find((s) => s.id === session.id));

          if (!latestSession) {
            console.error("Failed to find latest session state");
            return;
          }

          const correctCount = latestSession.cardsReviewed.filter(
            (review) => review.result === StudyResult.Correct
          ).length;
          const incorrectCount = latestSession.cardsReviewed.filter(
            (review) => review.result === StudyResult.Incorrect
          ).length;

          console.log("Final stats calculation:", {
            totalCards: cards.length,
            correctCount,
            incorrectCount,
            accuracy: (correctCount / cards.length) * 100,
            cardsReviewed: latestSession.cardsReviewed.map((r) => ({
              cardId: r.cardId,
              result: r.result,
            })),
          });

          const stats = {
            totalCards: cards.length,
            correctCards: correctCount,
            accuracy: (correctCount / cards.length) * 100,
            totalTime: now.getTime() - session.startTime.getTime(),
            averageTimePerCard:
              (now.getTime() - session.startTime.getTime()) / cards.length,
          };
          console.log("Calculated stats:", stats);

          navigation.reset({
            index: 1,
            routes: [
              { name: "Main", params: { screen: "Study" } },
              { name: "Stats", params: { sessionId: session.id, stats } },
            ],
          });
        } else {
          // Move to next card
          setCurrentIndex((prevIndex) => prevIndex + 1);
          setIsFlipped(false);
        }
      } catch (error) {
        console.error("Failed to save study progress:", error);
      }
    },
    [session.id, session.startTime, storage, cards.length, navigation, deckId]
  );

  // Handle swipe actions
  const handleSwipeLeft = useCallback(
    (card: Card) => {
      console.log("Swiped left on card:", {
        cardId: card.id,
        currentIndex,
        result: StudyResult.Incorrect,
      });
      handleCardResult(card, StudyResult.Incorrect);
    },
    [handleCardResult, currentIndex]
  );

  const handleSwipeRight = useCallback(
    (card: Card) => {
      console.log("Swiped right on card:", {
        cardId: card.id,
        currentIndex,
        result: StudyResult.Correct,
      });
      handleCardResult(card, StudyResult.Correct);
    },
    [handleCardResult, currentIndex]
  );

  const handleSwipeComplete = useCallback(() => {
    // Only handle the animation completion
    console.log("Swipe animation completed");
  }, []);

  // Add debug effect to monitor navigation state
  useEffect(() => {
    console.log("Navigation state:", {
      currentScreen: "StudySession",
      canNavigate: navigation !== undefined,
      sessionId: session.id,
      hasEndTime: session.endTime !== undefined,
    });
  }, [navigation, session]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Study",
      headerBackTitle: "Back",
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginRight: 16 }}
        >
          <Text
            style={{
              color: theme.colors.error,
              fontWeight: "600",
              fontSize: 16,
            }}
          >
            Exit
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme.colors.error]);

  if (cards.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="cards-outline"
            size={64}
            color={theme.colors.textSecondary}
          />
          <Text style={[styles.message, { color: theme.colors.text }]}>
            No cards available for study
          </Text>
          <Text
            style={[styles.submessage, { color: theme.colors.textSecondary }]}
          >
            All cards are up to date with their review schedule
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <Text style={[styles.progress, { color: theme.colors.text }]}>
          {Math.min(currentIndex + 1, cards.length)} / {cards.length}
        </Text>
      </View>

      {/* Card container */}
      <View style={styles.cardContainer}>
        {currentIndex < cards.length ? (
          <SwipeableCard
            key={
              cards[currentIndex].id +
              "-" +
              cards[currentIndex].correctCount +
              "-" +
              cards[currentIndex].incorrectCount
            }
            card={cards[currentIndex]}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onSwipeComplete={handleSwipeComplete}
            isFlipped={isFlipped}
            onFlip={flipCard}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={64}
              color={theme.colors.success}
            />
            <Text style={[styles.message, { color: theme.colors.text }]}>
              Session Complete!
            </Text>
            <Text
              style={[styles.submessage, { color: theme.colors.textSecondary }]}
            >
              Loading your results...
            </Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text
          style={[
            styles.instructionText,
            { color: theme.colors.textSecondary },
          ]}
        >
          {currentIndex < cards.length
            ? "Tap card to see answer, swipe right if you know it, left if you don't"
            : ""}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  exitButton: {
    position: "absolute",
    top: 60,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  progressContainer: {
    padding: 16,
    alignItems: "center",
  },
  progress: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  instructions: {
    padding: 16,
    alignItems: "center",
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  submessage: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
  },
});

export default StudySessionScreen;
